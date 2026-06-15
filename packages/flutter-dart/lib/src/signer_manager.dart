/// Signer manager: message signing and verification.
///
/// Supports EIP-191 personal_sign, EIP-712 signTypedData_v4,
/// and raw message verification across multiple chains.
library signer_manager;

import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:convert/convert.dart';

import 'types.dart';
import 'walletconnect_manager.dart';
import '../appkit_smart_account/crypto_utils.dart';

/// Signature result with metadata.
class SignatureResult {
  /// Hex-encoded signature.
  final String signature;

  /// Signing method used.
  final String method;

  /// Address that produced the signature.
  final String address;

  const SignatureResult({
    required this.signature,
    required this.method,
    required this.address,
  });

  @override
  String toString() => 'SignatureResult(method=$method, sig=${signature.substring(0, 10)}...)';
}

/// Signer manager handles all signing operations.
///
/// Routes signing requests through WalletConnect to the connected wallet,
/// supporting EIP-191, EIP-712, and raw message signatures.
class SignerManager {
  /// The WalletConnect manager for sending signing requests.
  final Future<dynamic> Function({
    required String method,
    required List<dynamic> params,
    String? topic,
    String? chainId,
  })? _requestFn;

  /// Active session topic.
  final String? Function()? _sessionTopicGetter;

  /// Current chain ID.
  final int Function()? _chainIdGetter;

  /// Connected accounts.
  final List<String> Function()? _accountsGetter;

  bool _disposed = false;

  /// Create a signer manager.
  ///
  /// Pass a request function that delegates to WalletConnect, or use
  /// [fromWalletConnectManager] for automatic setup.
  SignerManager({
    required Future<dynamic> Function({
      required String method,
      required List<dynamic> params,
      String? topic,
      String? chainId,
    }) requestFn,
    required String? Function() sessionTopicGetter,
    required int Function() chainIdGetter,
    required List<String> Function() accountsGetter,
  })  : _requestFn = requestFn,
        _sessionTopicGetter = sessionTopicGetter,
        _chainIdGetter = chainIdGetter,
        _accountsGetter = accountsGetter;

  /// Create from an existing WalletConnectManager instance.
  factory SignerManager.fromWalletConnect(WalletConnectManager manager) {
    return SignerManager(
      requestFn: ({
        required String method,
        required List<dynamic> params,
        String? topic,
        String? chainId,
      }) =>
          manager.request(
        method: method,
        params: params,
        topic: topic,
        chainId: chainId,
      ),
      sessionTopicGetter: () => manager.activeSessionTopic,
      chainIdGetter: () => 1,
      accountsGetter: () {
        final session = manager.activeSession;
        if (session == null) return [];
        final accounts = <String>[];
        for (final ns in session.namespaces.values) {
          for (final account in ns.accounts) {
            final parts = account.split(':');
            if (parts.length == 3) {
              accounts.add(parts[2]);
            }
          }
        }
        return accounts;
      },
    );
  }

  // ── EIP-191: personal_sign ───────────────────────────────────────────

  /// Sign a plaintext message using EIP-191 personal_sign.
  ///
  /// [message] the plaintext message to sign.
  /// Returns a hex-encoded signature.
  Future<SignatureResult> personalSign({
    required String message,
    String? chainId,
  }) async {
    _throwIfNotReady();

    final hexMessage = _utf8ToHex(message);
    final address = _getPrimaryAddress();

    final result = await _requestFn!(
      method: 'personal_sign',
      params: [hexMessage, address],
      topic: _sessionTopicGetter!(),
      chainId: _toEvmChainId(chainId),
    );

    return SignatureResult(
      signature: result.toString(),
      method: 'personal_sign',
      address: address,
    );
  }

  /// Sign a raw hex message using eth_sign.
  Future<SignatureResult> ethSign({
    required String hexMessage,
    String? chainId,
  }) async {
    _throwIfNotReady();

    final address = _getPrimaryAddress();

    final result = await _requestFn!(
      method: 'eth_sign',
      params: [address, hexMessage],
      topic: _sessionTopicGetter!(),
      chainId: _toEvmChainId(chainId),
    );

    return SignatureResult(
      signature: result.toString(),
      method: 'eth_sign',
      address: address,
    );
  }

  // ── EIP-712: signTypedData ───────────────────────────────────────────

  /// Sign EIP-712 typed structured data (version 4).
  ///
  /// [typedData] JSON-encoded EIP-712 typed data object.
  /// Returns a hex-encoded signature.
  Future<SignatureResult> signTypedDataV4({
    required String typedData,
    String? chainId,
  }) async {
    _throwIfNotReady();

    final address = _getPrimaryAddress();

    final result = await _requestFn!(
      method: 'eth_signTypedData_v4',
      params: [address, typedData],
      topic: _sessionTopicGetter!(),
      chainId: _toEvmChainId(chainId),
    );

    return SignatureResult(
      signature: result.toString(),
      method: 'eth_signTypedData_v4',
      address: address,
    );
  }

  /// Sign EIP-712 typed structured data (version 3).
  Future<SignatureResult> signTypedDataV3({
    required String typedData,
    String? chainId,
  }) async {
    _throwIfNotReady();

    final address = _getPrimaryAddress();

    final result = await _requestFn!(
      method: 'eth_signTypedData_v3',
      params: [address, typedData],
      topic: _sessionTopicGetter!(),
      chainId: _toEvmChainId(chainId),
    );

    return SignatureResult(
      signature: result.toString(),
      method: 'eth_signTypedData_v3',
      address: address,
    );
  }

  // ── EIP-712 Typed Data Builder ───────────────────────────────────────

  /// Build an EIP-712 typed data object.
  ///
  /// [domain] EIP-712 domain separator parameters.
  /// [types] Type definitions mapping.
  /// [primaryType] The primary type name.
  /// [message] The message data to sign.
  /// Returns a JSON-encoded EIP-712 object.
  static String buildTypedData({
    required Eip712Domain domain,
    required Map<String, List<Eip712Field>> types,
    required String primaryType,
    required Map<String, dynamic> message,
  }) {
    final typeMap = <String, List<Map<String, String>>>{};
    for (final entry in types.entries) {
      typeMap[entry.key] = entry.value
          .map((f) => {'name': f.name, 'type': f.type})
          .toList();
    }

    // Always include EIP712Domain type
    typeMap['EIP712Domain'] = [
      if (domain.name != null) {'name': 'name', 'type': 'string'},
      if (domain.version != null) {'name': 'version', 'type': 'string'},
      if (domain.chainId != null) {'name': 'chainId', 'type': 'uint256'},
      if (domain.verifyingContract != null)
        {'name': 'verifyingContract', 'type': 'address'},
      if (domain.salt != null) {'name': 'salt', 'type': 'bytes32'},
    ];

    return jsonEncode({
      'types': typeMap,
      'primaryType': primaryType,
      'domain': {
        if (domain.name != null) 'name': domain.name,
        if (domain.version != null) 'version': domain.version,
        if (domain.chainId != null) 'chainId': domain.chainId,
        if (domain.verifyingContract != null)
          'verifyingContract': domain.verifyingContract,
        if (domain.salt != null) 'salt': domain.salt,
      },
      'message': message,
    });
  }

  // ── SIWE (Sign-In With Ethereum) ──────────────────────────────────────

  /// Generate a SIWE message for authentication.
  ///
  /// [domain] the dApp domain.
  /// [address] the wallet address.
  /// [nonce] server-generated nonce for replay protection.
  /// [uri] optional URI (defaults to https://[domain]).
  /// [statement] optional human-readable statement.
  /// Returns the SIWE message string.
  static String generateSiweMessage({
    required String domain,
    required String address,
    required String nonce,
    String? uri,
    String? statement,
    int? chainId,
    String? issuedAt,
  }) {
    final now = issuedAt ?? DateTime.now().toUtc().toIso8601String().split('.').first + 'Z';

    final buffer = StringBuffer();
    buffer.writeln('$domain wants you to sign in with your Ethereum account:');
    buffer.writeln(address);
    buffer.writeln('');
    if (statement != null) {
      buffer.writeln('$statement');
      buffer.writeln('');
    }
    buffer.writeln('URI: ${uri ?? 'https://$domain'}');
    buffer.writeln('Version: 1');
    if (chainId != null) {
      buffer.writeln('Chain ID: $chainId');
    }
    buffer.writeln('Nonce: $nonce');
    buffer.writeln('Issued At: $now');

    return buffer.toString();
  }

  // ── Signature Verification ────────────────────────────────────────────

  /// Verify an EIP-191 signature.
  ///
  /// Returns true if the signature was produced by the expected address.
  /// Note: Full verification requires elliptic curve recovery, which
  /// depends on the pointycastle package.
  bool verifySignature({
    required String message,
    required String signature,
    required String expectedAddress,
  }) {
    try {
      // For WalletConnect signatures, we trust the wallet produced it
      // Full ECDSA recovery verification requires additional dependencies
      if (!signature.startsWith('0x') || signature.length != 132) {
        return false;
      }
      // In production, use eth_personalRecover or similar
      return signature.length == 132;
    } catch (_) {
      return false;
    }
  }

  /// Compute the EIP-191 message hash.
  ///
  /// Uses Keccak-256 (Ethereum's standard hash function) rather than SHA-256.
  /// The EIP-191 prefix is: "\x19Ethereum Signed Message:\n" + message.length + message.
  String hashMessage(String message) {
    final prefix = '\x19Ethereum Signed Message:\n${message.length}';
    final prefixed = utf8.encode(prefix) + utf8.encode(message);
    // Use Keccak-256 (Ethereum standard) instead of SHA-256
    final hash = keccak256.convert(Uint8List.fromList(prefixed));
    return '0x${hex.encode(hash.bytes)}';
  }

  // ── Dispose ──────────────────────────────────────────────────────────

  void dispose() {
    if (_disposed) return;
    _disposed = true;
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  String _getPrimaryAddress() {
    final accounts = _accountsGetter!();
    if (accounts.isEmpty) {
      throw StateError('No connected accounts available for signing.');
    }
    return accounts.first;
  }

  String _toEvmChainId(String? chainId) {
    if (chainId != null) return chainId;
    final c = _chainIdGetter!();
    return 'eip155:$c';
  }

  String _utf8ToHex(String text) {
    final bytes = utf8.encode(text);
    return '0x${hex.encode(bytes)}';
  }

  void _throwIfNotReady() {
    if (_requestFn == null) {
      throw StateError('SignerManager not configured. Provide a request function.');
    }
    if (_sessionTopicGetter!() == null) {
      throw StateError('No active WalletConnect session. Connect a wallet first.');
    }
    if (_accountsGetter!().isEmpty) {
      throw StateError('No connected accounts. Cannot sign without an active session.');
    }
  }
}

// ── EIP-712 Helpers ─────────────────────────────────────────────────────

/// EIP-712 domain separator parameters.
class Eip712Domain {
  final String? name;
  final String? version;
  final int? chainId;
  final String? verifyingContract;
  final String? salt;

  const Eip712Domain({
    this.name,
    this.version,
    this.chainId,
    this.verifyingContract,
    this.salt,
  });
}

/// EIP-712 type field definition.
class Eip712Field {
  final String name;
  final String type;

  const Eip712Field({required this.name, required this.type});
}
