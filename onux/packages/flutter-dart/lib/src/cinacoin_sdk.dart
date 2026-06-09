/// Cinacoin SDK main entry point.
///
/// Singleton facade coordinating WalletConnect, chain adapters,
/// transaction management, and signing.
library cinacoin_sdk;

import 'dart:async';

import 'walletconnect_manager.dart';
import 'chain_adapters.dart';
import 'transaction_manager.dart';
import 'signer_manager.dart';
import 'storage_manager.dart';
import 'types.dart';

/// Main SDK singleton facade.
///
/// Provides a unified API for:
/// - WalletConnect v2 pairing and session management
/// - Multi-chain adapter support (12 chains)
/// - Transaction building, signing, and polling
/// - Message signing (EIP-191, EIP-712)
/// - Encrypted session persistence
///
/// ### Usage
///
/// ```dart
/// // Initialize
/// final sdk = CinacoinSdk.instance;
/// await sdk.initialize(
///   projectId: 'YOUR_PROJECT_ID',
///   metadata: AppMetadata(
///     name: 'My dApp',
///     description: 'A Flutter dApp',
///     url: 'https://mydapp.com',
///     icons: [],
///   ),
/// );
///
/// // Connect
/// final pairing = await sdk.createPairing();
/// // Display pairing.uri as QR code
///
/// // After wallet approves
/// final session = await sdk.getSession();
///
/// // Sign
/// final sig = await sdk.personalSign(message: 'Hello!');
///
/// // Send transaction
/// final txHash = await sdk.sendViaWalletConnect(
///   from: accounts[0],
///   to: '0x...',
///   value: '1000000000000000000',
/// );
///
/// // Switch chain
/// await sdk.switchChain('eip155:137');
///
/// // Disconnect
/// await sdk.disconnect();
/// ```
class CinacoinSdk {
  /// Singleton instance.
  static final CinacoinSdk instance = CinacoinSdk._();

  CinacoinSdk._();

  // ── Internal State ───────────────────────────────────────────────────

  WalletConnectManager? _wcManager;
  TransactionManager? _txManager;
  SignerManager? _signerManager;
  StorageManager? _storageManager;
  bool _initialized = false;
  bool _disposed = false;

  final _stateController = StreamController<SdkState>.broadcast();

  /// Stream of SDK state changes.
  Stream<SdkState> get stateChanges => _stateController.stream;

  /// Whether the SDK is initialized.
  bool get isInitialized => _initialized;

  /// Whether a wallet session is active.
  bool get isConnected => _wcManager?.hasActiveSession ?? false;

  /// Active session topic.
  String? get sessionTopic => _wcManager?.activeSessionTopic;

  /// Connected accounts.
  List<String> get accounts {
    final session = _wcManager?.activeSession;
    if (session == null) return [];
    final accounts = <String>[];
    for (final ns in session.namespaces.values) {
      for (final account in ns.accounts) {
        final parts = account.split(':');
        if (parts.length == 3) accounts.add(parts[2]);
      }
    }
    return accounts;
  }

  // ── Initialization ───────────────────────────────────────────────────

  /// Initialize the SDK.
  ///
  /// [projectId] WalletConnect project ID.
  /// [metadata] App metadata for pairing.
  /// [relayUrl] Optional relay URL override.
  /// [chains] Chain IDs to register adapters for (default: all).
  /// [sessionTtl] Session persistence TTL.
  Future<void> initialize({
    required String projectId,
    required AppMetadata metadata,
    String? relayUrl,
    List<String>? chains,
    Duration sessionTtl = const Duration(days: 7),
  }) async {
    if (_initialized || _disposed) return;

    // Initialize storage
    _storageManager = StorageManager(sessionTtl: sessionTtl);
    await _storageManager!.init();

    // Initialize WalletConnect manager
    _wcManager = WalletConnectManager(
      projectId: projectId,
      metadata: metadata,
      relayUrl: relayUrl,
      sessionTtl: sessionTtl,
    );
    await _wcManager!.init();

    // Initialize transaction manager
    _txManager = TransactionManager();

    // Register chain adapters
    final targetChains = chains ?? ChainRegistry.getAllChainIds();
    for (final chainId in targetChains) {
      final config = ChainRegistry.get(chainId);
      if (config != null) {
        _txManager!.registerAdapter(chainId, ChainRegistry.getAdapter(chainId));
      }
    }

    // Initialize signer manager
    _signerManager = SignerManager(
      requestFn: ({
        required String method,
        required List<dynamic> params,
        String? topic,
        String? chainId,
      }) =>
          _wcManager!.request(
        method: method,
        params: params,
        topic: topic,
        chainId: chainId,
      ),
      sessionTopicGetter: () => _wcManager!.activeSessionTopic,
      chainIdGetter: () => 1,
      accountsGetter: () => accounts,
    );

    _initialized = true;
    _emitState();

    // Attempt session restore
    await _wcManager!.tryRestoreSession();
  }

  // ── Pairing ──────────────────────────────────────────────────────────

  /// Create a new WalletConnect pairing.
  ///
  /// Returns a PairingResult with the URI for QR display.
  Future<PairingResult> createPairing({
    List<String> chains = const ['eip155:1'],
    List<String>? methods,
    List<String>? events,
  }) async {
    _throwIfNotInitialized();
    return _wcManager!.createPairing(
      chains: chains,
      methods: methods,
      events: events,
    );
  }

  /// Pair using a WC URI.
  Future<void> pairFromUri(String uri) async {
    _throwIfNotInitialized();
    await _wcManager!.pairFromUri(uri);
  }

  // ── Session ──────────────────────────────────────────────────────────

  /// Get the active session.
  SessionStruct? getSession() => _wcManager?.activeSession;

  /// Approve a session proposal.
  Future<WcSessionResult> approveSession({
    required String proposerPublicKey,
    required Map<String, RequiredNamespace> namespaces,
  }) async {
    _throwIfNotInitialized();
    return _wcManager!.approveSession(
      proposerPublicKey: proposerPublicKey,
      namespaces: namespaces,
    );
  }

  /// Disconnect the active session.
  Future<void> disconnect() async {
    _throwIfNotInitialized();
    await _wcManager!.disconnect();
    _emitState();
  }

  // ── Chain Switching ──────────────────────────────────────────────────

  /// Switch the active chain.
  Future<void> switchChain(String chainId) async {
    _throwIfNotInitialized();
    _throwIfNotConnected();

    if (!ChainRegistry.isSupported(chainId)) {
      throw ArgumentError('Unsupported chain: $chainId');
    }

    _txManager!.setActiveChain(chainId);
    await _storageManager?.setLastChainId(int.parse(chainId.split(':').last));
    _emitState();
  }

  /// Get the last used chain ID.
  Future<int?> getLastChainId() async {
    await _storageManager?.init();
    return _storageManager?.getLastChainId();
  }

  // ── Signing ──────────────────────────────────────────────────────────

  /// Sign a message using EIP-191 personal_sign.
  Future<SignatureResult> personalSign({
    required String message,
    String? chainId,
  }) async {
    _throwIfNotInitialized();
    _throwIfNotConnected();
    return _signerManager!.personalSign(message: message, chainId: chainId);
  }

  /// Sign EIP-712 typed data (v4).
  Future<SignatureResult> signTypedDataV4({
    required String typedData,
    String? chainId,
  }) async {
    _throwIfNotInitialized();
    _throwIfNotConnected();
    return _signerManager!.signTypedDataV4(typedData: typedData, chainId: chainId);
  }

  // ── Transactions ─────────────────────────────────────────────────────

  /// Send a transaction via the connected wallet.
  Future<String> sendViaWalletConnect({
    required String from,
    required String to,
    String? value,
    String? data,
    String? chainId,
  }) async {
    _throwIfNotInitialized();
    _throwIfNotConnected();

    return _txManager!.sendViaWalletConnect(
      from: from,
      to: to,
      value: value,
      data: data,
      chainId: chainId,
      request: ({
        required String method,
        required List<dynamic> params,
        String? topic,
        String? cId,
      }) =>
          _wcManager!.request(
        method: method,
        params: params,
        topic: topic,
        chainId: cId,
      ),
    );
  }

  /// Estimate fees for a transaction.
  Future<String> estimateFee({
    required String from,
    required String to,
    String? value,
    String? data,
    String? chainId,
  }) async {
    _throwIfNotInitialized();
    return _txManager!.estimateFee(
      from: from,
      to: to,
      value: value,
      data: data,
      chainId: chainId,
    );
  }

  /// Poll a transaction for confirmation.
  Future<TxEvent> pollTransaction(
    String txHash, {
    int maxAttempts = 30,
    int intervalMs = 3000,
    String? chainId,
  }) async {
    _throwIfNotInitialized();
    return _txManager!.pollTransaction(
      txHash,
      maxAttempts: maxAttempts,
      intervalMs: intervalMs,
      chainId: chainId,
    );
  }

  /// Get balance for an address.
  Future<String> getBalance(String address, {String? chainId}) async {
    _throwIfNotInitialized();
    return _txManager!.getBalance(address, chainId: chainId);
  }

  /// Get the latest block.
  Future<String> getLatestBlock({String? chainId}) async {
    _throwIfNotInitialized();
    return _txManager!.getLatestBlock(chainId: chainId);
  }

  // ── Storage ──────────────────────────────────────────────────────────

  /// Get the storage manager for custom data persistence.
  StorageManager? get storage => _storageManager;

  // ── Utilities ────────────────────────────────────────────────────────

  /// Get the pairing URI for QR display.
  String? getPairingUri() => _wcManager?.getPairingUri();

  /// Get all supported chain IDs.
  List<String> getSupportedChains() => ChainRegistry.getAllChainIds();

  /// Get chain config by ID.
  ChainConfig? getChainConfig(String chainId) => ChainRegistry.get(chainId);

  // ── Disposal ─────────────────────────────────────────────────────────

  /// Dispose of all SDK resources.
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;

    await _txManager?.dispose();
    await _wcManager?.dispose();
    await _stateController.close();
    _initialized = false;
  }

  // ── Internal ─────────────────────────────────────────────────────────

  void _emitState() {
    _stateController.add(SdkState(
      isInitialized: _initialized,
      isConnected: isConnected,
      accounts: accounts,
      sessionTopic: sessionTopic,
    ));
  }

  void _throwIfNotInitialized() {
    if (!_initialized) {
      throw StateError('CinacoinSdk not initialized. Call initialize() first.');
    }
    if (_disposed) {
      throw StateError('CinacoinSdk has been disposed.');
    }
  }

  void _throwIfNotConnected() {
    if (!isConnected) {
      throw StateError('No wallet connected. Call createPairing() and approve a session first.');
    }
  }
}

/// SDK state snapshot.
class SdkState {
  final bool isInitialized;
  final bool isConnected;
  final List<String> accounts;
  final String? sessionTopic;

  const SdkState({
    required this.isInitialized,
    required this.isConnected,
    required this.accounts,
    this.sessionTopic,
  });

  @override
  String toString() =>
      'SdkState(initialized=$isInitialized, connected=$isConnected, accounts=$accounts)';
}
