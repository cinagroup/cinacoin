/// Multi-chain adapter registry with 12 supported chains.
///
/// Provides a unified interface for interacting with different blockchain
/// networks: EVM, Solana, Bitcoin, TON, TRON, Cosmos, NEAR, Sui,
/// Starknet, Hedera, XRPL, and Polkadot.
///
/// Each adapter implements:
/// - getBalance — fetch native token balance
/// - sendTransaction — sign and broadcast a transaction
/// - getLatestBlock — fetch the latest block number/hash
/// - estimateFee — estimate transaction fees
///
/// ChainConfig registry provides metadata for all supported chains.
library chain_adapters;

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:convert/convert.dart';
import 'package:crypto/crypto.dart';

import 'types.dart';

// ── ChainAdapter Interface ──────────────────────────────────────────────

/// Abstract interface for all chain adapters.
///
/// Every adapter must implement these core methods to provide a unified
/// multi-chain experience through the Cinacoin SDK.
abstract class ChainAdapter {
  /// Chain identifier (CAIP-2 format).
  String get chainId;

  /// Human-readable chain name.
  String get chainName;

  /// Default RPC endpoint.
  String get rpcUrl;

  /// Native currency symbol.
  String get symbol;

  /// Native currency decimals.
  int get decimals;

  /// Fetch the native token balance for an address.
  ///
  /// Returns a decimal string (e.g. "1.234567").
  Future<String> getBalance(String address);

  /// Send a signed transaction to the network.
  ///
  /// [rawTx] is the hex-encoded signed transaction.
  /// Returns the transaction hash.
  Future<String> sendTransaction(String rawTx);

  /// Fetch the latest block number or hash.
  Future<String> getLatestBlock();

  /// Estimate the fee for a transaction.
  ///
  /// [txData] optional transaction data for more accurate estimation.
  /// Returns a decimal string representing the fee in native currency.
  Future<String> estimateFee({Map<String, dynamic>? txData});

  /// Build a transaction from parameters.
  ///
  /// Returns a hex-encoded unsigned transaction ready for signing.
  Future<String> buildTransaction(TransactionParams params);

  /// Decode a transaction from raw bytes.
  Map<String, dynamic> decodeTransaction(String rawTx);

  /// Validate an address format for this chain.
  bool isValidAddress(String address);

  /// Get a transaction receipt or status.
  Future<Map<String, dynamic>> getTransactionStatus(String txHash);
}

// ── Chain Configuration Registry ────────────────────────────────────────

/// Chain configuration metadata.
class ChainConfig {
  /// CAIP-2 chain identifier.
  final String id;

  /// Human-readable name.
  final String name;

  /// Default RPC URL.
  final String rpcUrl;

  /// Native currency symbol.
  final String symbol;

  /// Native currency decimals.
  final int decimals;

  /// Explorer URL.
  final String? explorerUrl;

  /// Chain type for adapter lookup.
  final ChainType type;

  const ChainConfig({
    required this.id,
    required this.name,
    required this.rpcUrl,
    required this.symbol,
    required this.decimals,
    this.explorerUrl,
    required this.type,
  });

  /// Get explorer URL for a transaction.
  String? txExplorerUrl(String txHash) =>
      explorerUrl != null ? '$explorerUrl/tx/$txHash' : null;

  /// Get explorer URL for an address.
  String? addressExplorerUrl(String address) =>
      explorerUrl != null ? '$explorerUrl/address/$address' : null;
}

/// Chain type discriminator.
enum ChainType {
  evm,
  solana,
  bitcoin,
  ton,
  tron,
  cosmos,
  near,
  sui,
  starknet,
  hedera,
  xrpl,
  polkadot,
}

/// Registry of all supported chains.
class ChainRegistry {
  ChainRegistry._();

  /// All registered chains.
  static const Map<String, ChainConfig> chains = {
    'eip155:1': ChainConfig(
      id: 'eip155:1',
      name: 'Ethereum',
      rpcUrl: 'https://eth.llamarpc.com',
      symbol: 'ETH',
      decimals: 18,
      explorerUrl: 'https://etherscan.io',
      type: ChainType.evm,
    ),
    'eip155:137': ChainConfig(
      id: 'eip155:137',
      name: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      symbol: 'MATIC',
      decimals: 18,
      explorerUrl: 'https://polygonscan.com',
      type: ChainType.evm,
    ),
    'eip155:42161': ChainConfig(
      id: 'eip155:42161',
      name: 'Arbitrum One',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      symbol: 'ETH',
      decimals: 18,
      explorerUrl: 'https://arbiscan.io',
      type: ChainType.evm,
    ),
    'eip155:10': ChainConfig(
      id: 'eip155:10',
      name: 'Optimism',
      rpcUrl: 'https://mainnet.optimism.io',
      symbol: 'ETH',
      decimals: 18,
      explorerUrl: 'https://optimistic.etherscan.io',
      type: ChainType.evm,
    ),
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': ChainConfig(
      id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      name: 'Solana',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      symbol: 'SOL',
      decimals: 9,
      explorerUrl: 'https://solscan.io',
      type: ChainType.solana,
    ),
    'bip122:000000000019d6689c085ae165831e93': ChainConfig(
      id: 'bip122:000000000019d6689c085ae165831e93',
      name: 'Bitcoin',
      rpcUrl: 'https://mempool.space/api',
      symbol: 'BTC',
      decimals: 8,
      explorerUrl: 'https://mempool.space',
      type: ChainType.bitcoin,
    ),
    'tron:0x2b6653dc': ChainConfig(
      id: 'tron:0x2b6653dc',
      name: 'TRON',
      rpcUrl: 'https://api.trongrid.io',
      symbol: 'TRX',
      decimals: 6,
      explorerUrl: 'https://tronscan.org',
      type: ChainType.tron,
    ),
    'cosmos:cosmoshub-4': ChainConfig(
      id: 'cosmos:cosmoshub-4',
      name: 'Cosmos Hub',
      rpcUrl: 'https://rpc.cosmos.network',
      symbol: 'ATOM',
      decimals: 6,
      explorerUrl: 'https://www.mintscan.io/cosmos',
      type: ChainType.cosmos,
    ),
    'near:near-mainnet': ChainConfig(
      id: 'near:near-mainnet',
      name: 'NEAR',
      rpcUrl: 'https://rpc.mainnet.near.org',
      symbol: 'NEAR',
      decimals: 24,
      explorerUrl: 'https://explorer.near.org',
      type: ChainType.near,
    ),
    'sui:sui-mainnet': ChainConfig(
      id: 'sui:sui-mainnet',
      name: 'Sui',
      rpcUrl: 'https://fullnode.mainnet.sui.io',
      symbol: 'SUI',
      decimals: 9,
      explorerUrl: 'https://suiscan.xyz',
      type: ChainType.sui,
    ),
    'starknet:SN_MAIN': ChainConfig(
      id: 'starknet:SN_MAIN',
      name: 'Starknet',
      rpcUrl: 'https://rpc.starknet.lava.build',
      symbol: 'ETH',
      decimals: 18,
      explorerUrl: 'https://starkscan.co',
      type: ChainType.starknet,
    ),
    'hedera:mainnet': ChainConfig(
      id: 'hedera:mainnet',
      name: 'Hedera',
      rpcUrl: 'https://mainnet-public.mirrornode.hedera.com',
      symbol: 'HBAR',
      decimals: 8,
      explorerUrl: 'https://hashscan.io',
      type: ChainType.hedera,
    ),
    'xrpl:0': ChainConfig(
      id: 'xrpl:0',
      name: 'XRP Ledger',
      rpcUrl: 'https://xrplcluster.com',
      symbol: 'XRP',
      decimals: 6,
      explorerUrl: 'https://livenet.xrpl.org',
      type: ChainType.xrpl,
    ),
    'polkadot:91b171bb158e2d3848fa23a9f1c25182': ChainConfig(
      id: 'polkadot:91b171bb158e2d3848fa23a9f1c25182',
      name: 'Polkadot',
      rpcUrl: 'https://rpc.polkadot.io',
      symbol: 'DOT',
      decimals: 10,
      explorerUrl: 'https://polkadot.subscan.io',
      type: ChainType.polkadot,
    ),
  };

  /// Get a chain config by CAIP-2 ID.
  static ChainConfig? get(String chainId) => chains[chainId];

  /// Get all chain IDs.
  static List<String> getAllChainIds() => chains.keys.toList();

  /// Get all EVM chain IDs.
  static List<String> getEvmChainIds() =>
      chains.entries.where((e) => e.value.type == ChainType.evm).map((e) => e.key).toList();

  /// Get all non-EVM chain IDs.
  static List<String> getNonEvmChainIds() =>
      chains.entries.where((e) => e.value.type != ChainType.evm).map((e) => e.key).toList();

  /// Check if a chain ID is supported.
  static bool isSupported(String chainId) => chains.containsKey(chainId);

  /// Get chain type from CAIP-2 ID.
  static ChainType? getChainType(String chainId) => chains[chainId]?.type;

  /// Find adapter for a chain.
  static ChainAdapter getAdapter(String chainId) {
    final config = chains[chainId];
    if (config == null) {
      throw ArgumentError('Unsupported chain: $chainId');
    }
    switch (config.type) {
      case ChainType.evm:
        return EvmChainAdapter(rpcUrl: config.rpcUrl, chainId: chainId);
      case ChainType.solana:
        return SolanaChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.bitcoin:
        return BitcoinChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.ton:
        return TonChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.tron:
        return TronChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.cosmos:
        return CosmosChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.near:
        return NearChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.sui:
        return SuiChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.starknet:
        return StarknetChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.hedera:
        return HederaChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.xrpl:
        return XrplChainAdapter(rpcUrl: config.rpcUrl);
      case ChainType.polkadot:
        return PolkadotChainAdapter(rpcUrl: config.rpcUrl);
    }
  }
}

// ── EVM Chain Adapter ───────────────────────────────────────────────────

/// EVM-compatible chain adapter (Ethereum, Polygon, Arbitrum, Optimism, etc.).
class EvmChainAdapter implements ChainAdapter {
  final String _rpcUrl;
  final String _chainId;

  EvmChainAdapter({required String rpcUrl, String chainId = 'eip155:1'})
      : _rpcUrl = rpcUrl,
        _chainId = chainId;

  @override
  String get chainId => _chainId;
  @override
  String get chainName => ChainRegistry.get(_chainId)?.name ?? 'EVM Chain';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => ChainRegistry.get(_chainId)?.symbol ?? 'ETH';
  @override
  int get decimals => ChainRegistry.get(_chainId)?.decimals ?? 18;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('eth_getBalance', [address, 'latest']);
    final hexBalance = response['result'] as String;
    final wei = int.parse(hexBalance, radix: 16);
    return _weiToEth(wei, decimals);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('eth_sendRawTransaction', [rawTx]);
    return response['result'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('eth_blockNumber', []);
    final hexBlock = response['result'] as String;
    return int.parse(hexBlock, radix: 16).toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    final response = await _jsonRpcCall('eth_gasPrice', []);
    final hexGasPrice = response['result'] as String;
    final gasPrice = int.parse(hexGasPrice, radix: 16);

    // Estimate gas limit (default 21000 for simple transfers)
    int gasLimit = 21000;
    if (txData != null && txData['data'] != null) {
      final gasResponse = await _jsonRpcCall('eth_estimateGas', [
        {
          'from': txData['from'] ?? '',
          'to': txData['to'] ?? '',
          if (txData['value'] != null) 'value': txData['value'],
          if (txData['data'] != null) 'data': txData['data'],
        }
      ]);
      gasLimit = int.parse((gasResponse['result'] as String), radix: 16);
    }

    final totalWei = BigInt.from(gasLimit) * BigInt.from(gasPrice);
    return _weiToEth(totalWei.toInt(), decimals);
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    // Build EIP-155 transaction envelope
    final nonce = await _getNonce(params.from);
    final gasPrice = await _getGasPrice();
    final gasLimit = await _estimateGasLimit(params);

    final tx = {
      'nonce': nonce,
      'gasPrice': gasPrice,
      'gas': gasLimit,
      'to': params.to,
      'value': params.value ?? '0x0',
      'data': params.data ?? '0x',
      'chainId': _parseEvmChainId(),
    };

    return jsonEncode(tx);
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    if (!address.startsWith('0x') || address.length != 42) return false;
    try {
      hex.decode(address.substring(2));
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('eth_getTransactionReceipt', [txHash]);
    final receipt = response['result'];
    if (receipt == null) {
      return {'status': 'pending', 'hash': txHash};
    }
    final receiptMap = receipt as Map<String, dynamic>;
    return {
      'status': receiptMap['status'] == '0x1' ? 'success' : 'failed',
      'hash': txHash,
      'blockNumber': receiptMap['blockNumber'],
      'gasUsed': receiptMap['gasUsed'],
    };
  }

  // ── Private: JSON-RPC ────────────────────────────────────────────────

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    List<dynamic> params,
  ) async {
    final body = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params,
      'id': DateTime.now().millisecondsSinceEpoch,
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('RPC call failed: ${response.statusCode} ${response.body}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<String> _getNonce(String address) async {
    final response = await _jsonRpcCall('eth_getTransactionCount', [address, 'latest']);
    return response['result'] as String;
  }

  Future<String> _getGasPrice() async {
    final response = await _jsonRpcCall('eth_gasPrice', []);
    return response['result'] as String;
  }

  Future<String> _estimateGasLimit(TransactionParams params) async {
    final response = await _jsonRpcCall('eth_estimateGas', [
      {
        'from': params.from,
        'to': params.to,
        if (params.value != null) 'value': params.value,
        if (params.data != null) 'data': params.data,
      }
    ]);
    return response['result'] as String;
  }

  int _parseEvmChainId() {
    final parts = _chainId.split(':');
    if (parts.length == 2) {
      return int.tryParse(parts[1]) ?? 1;
    }
    return 1;
  }

  String _weiToEth(int wei, int decimals) {
    final divisor = BigInt.from(10).pow(decimals);
    final bigWei = BigInt.from(wei);
    final whole = bigWei ~/ divisor;
    final fractional = bigWei % divisor;
    if (fractional == BigInt.zero) {
      return whole.toString();
    }
    final fracStr = fractional.toString().padLeft(decimals, '0');
    return '$whole.${fracStr.replaceAll(RegExp(r'0+$'), '')}';
  }
}

// ── Solana Chain Adapter ────────────────────────────────────────────────

/// Solana chain adapter.
class SolanaChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  SolanaChainAdapter({String rpcUrl = 'https://api.mainnet-beta.solana.com'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  @override
  String get chainName => 'Solana';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'SOL';
  @override
  int get decimals => 9;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('getBalance', [address]);
    final balance = (response['result'] as Map)['value'] as int;
    return _lamportsToSol(balance);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('sendTransaction', [
      rawTx,
      {'encoding': 'base64', 'skipPreflight': false}
    ]);
    return response['result'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('getSlot', []);
    return (response['result'] as int).toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    final response = await _jsonRpcCall('getFeeForMessage', [
      txData?['message'] ?? '',
      {'commitment': 'confirmed'}
    ]);
    final fee = ((response['result'] as Map)['value'] as int?) ?? 5000;
    return _lamportsToSol(fee);
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    // Build Solana transaction (simplified — requires ed25519 signing)
    return jsonEncode({
      'recentBlockhash': 'PLACEHOLDER', // Fetch with getLatestBlockhash
      'feePayer': params.from,
      'instructions': [
        {
          'programId': '11111111111111111111111111111111',
          'keys': [
            {'pubkey': params.from, 'isSigner': true, 'isWritable': true},
            {'pubkey': params.to, 'isSigner': false, 'isWritable': true},
          ],
          'data': _encodeSolTransfer(params.value),
        }
      ],
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    try {
      final bytes = base58Decode(address);
      return bytes.length == 32;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('getTransaction', [
      txHash,
      {'encoding': 'json', 'commitment': 'confirmed'}
    ]);
    final tx = response['result'];
    if (tx == null) {
      return {'status': 'pending', 'hash': txHash};
    }
    final txMap = tx as Map<String, dynamic>;
    final meta = txMap['meta'] as Map<String, dynamic>?;
    return {
      'status': meta?['err'] == null ? 'success' : 'failed',
      'hash': txHash,
      'slot': txMap['slot'],
    };
  }

  // ── Private ──────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    List<dynamic> params,
  ) async {
    final body = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params,
      'id': DateTime.now().millisecondsSinceEpoch,
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('Solana RPC failed: ${response.statusCode}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  String _lamportsToSol(int lamports) {
    final sol = lamports / 1e9;
    return sol.toStringAsFixed(sol.truncateToDouble() == sol ? 0 : 9);
  }

  String _encodeSolTransfer(String? value) {
    // Simplified — actual Solana needs proper binary encoding
    final lamports = value != null ? int.parse(value) : 0;
    final bytes = <int>[2, 0, 0, 0]; // Transfer instruction index
    // Add lamports as little-endian u64
    for (var i = 0; i < 8; i++) {
      bytes.add((lamports >> (i * 8)) & 0xFF);
    }
    return base64Encode(bytes);
  }

  List<int> base58Decode(String input) {
    // Simplified base58 decode for address validation
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    final bytes = <int>[0];
    for (final char in input.split('')) {
      var carry = alphabet.indexOf(char);
      if (carry == -1) throw FormatException('Invalid base58 character');
      for (var i = 0; i < bytes.length; i++) {
        carry += bytes[i] * 58;
        bytes[i] = carry & 0xFF;
        carry >>= 8;
      }
      while (carry > 0) {
        bytes.add(carry & 0xFF);
        carry >>= 8;
      }
    }
    // Count leading zeros
    var zeros = 0;
    for (final char in input.split('')) {
      if (char == '1') zeros++;
      else break;
    }
    return List.filled(zeros, 0) + bytes.reversed.toList();
  }
}

// ── Bitcoin Chain Adapter ───────────────────────────────────────────────

/// Bitcoin chain adapter.
class BitcoinChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  BitcoinChainAdapter({String rpcUrl = 'https://mempool.space/api'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'bip122:000000000019d6689c085ae165831e93';
  @override
  String get chainName => 'Bitcoin';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'BTC';
  @override
  int get decimals => 8;

  @override
  Future<String> getBalance(String address) async {
    final response = await http.get(Uri.parse('$_rpcUrl/address/$address'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Bitcoin balance');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final chainStats = data['chain_stats'] as Map<String, dynamic>;
    final mempoolStats = data['mempool_stats'] as Map<String, dynamic>;
    final totalSat = (chainStats['funded_txo_sum'] as int) -
        (chainStats['spent_txo_sum'] as int) +
        (mempoolStats['funded_txo_sum'] as int) -
        (mempoolStats['spent_txo_sum'] as int);
    return _satToBtc(totalSat);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await http.post(
      Uri.parse('$_rpcUrl/tx'),
      headers: {'Content-Type': 'text/plain'},
      body: rawTx,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to broadcast Bitcoin transaction');
    }
    return response.body;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await http.get(Uri.parse('$_rpcUrl/blocks/tip/height'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Bitcoin block height');
    }
    return response.body.trim();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    final response = await http.get(Uri.parse('$_rpcUrl/v1/fees/recommended'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Bitcoin fees');
    }
    final fees = jsonDecode(response.body) as Map<String, dynamic>;
    // Return fast fee in BTC per byte (simplified)
    final satsPerByte = fees['fastestFee'] as int;
    final btcPerByte = satsPerByte / 1e8;
    return btcPerByte.toStringAsFixed(10);
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'inputs': [], // PSBT inputs to be filled
      'outputs': [
        {'address': params.to, 'value': params.value}
      ],
      'feeRate': 'fastest',
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    // Basic validation: starts with 1, 3, or bc1
    return address.startsWith('1') ||
        address.startsWith('3') ||
        address.startsWith('bc1');
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await http.get(Uri.parse('$_rpcUrl/tx/$txHash/status'));
    if (response.statusCode != 200) {
      return {'status': 'pending', 'hash': txHash};
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return {
      'status': data['confirmed'] == true ? 'confirmed' : 'pending',
      'hash': txHash,
      'blockHeight': data['block_height'],
      'blockHash': data['block_hash'],
    };
  }

  String _satToBtc(int satoshis) {
    final btc = satoshis / 1e8;
    return btc.toStringAsFixed(btc.truncateToDouble() == btc ? 0 : 8);
  }
}

// ── TON Chain Adapter ───────────────────────────────────────────────────

/// TON (The Open Network) chain adapter.
class TonChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  TonChainAdapter({String rpcUrl = 'https://toncenter.com/api/v2'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'ton:mainnet';
  @override
  String get chainName => 'TON';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'TON';
  @override
  int get decimals => 9;

  @override
  Future<String> getBalance(String address) async {
    final response = await http.get(Uri.parse('$_rpcUrl/getAddressInformation?address=$address'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch TON balance');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final result = data['result'] as Map<String, dynamic>;
    final nanoTon = BigInt.parse(result['balance'] as String);
    final divisor = BigInt.from(10).pow(decimals);
    final whole = nanoTon ~/ divisor;
    final frac = nanoTon % divisor;
    if (frac == BigInt.zero) return whole.toString();
    return '$whole.${frac.toString().padLeft(decimals, '0').replaceAll(RegExp(r'0+$'), '')}';
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await http.post(
      Uri.parse('$_rpcUrl/sendPacket'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'boc': rawTx}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to send TON transaction');
    }
    return rawTx;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await http.get(Uri.parse('$_rpcUrl/getLastBlock'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch TON block');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['result']['seqno'].toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    // TON uses gas-based fees; return estimated nanoTON
    return '5000000'; // ~0.005 TON
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'source': params.from,
      'destination': params.to,
      'amount': params.value,
      'payload': params.data,
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return address.length >= 48 &&
        (address.startsWith('EQ') || address.startsWith('UQ') || address.startsWith('kQ'));
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    return {
      'status': 'pending', // TON uses lt/hash for tracking
      'hash': txHash,
    };
  }
}

// ── TRON Chain Adapter ──────────────────────────────────────────────────

/// TRON chain adapter.
class TronChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  TronChainAdapter({String rpcUrl = 'https://api.trongrid.io'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'tron:0x2b6653dc';
  @override
  String get chainName => 'TRON';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'TRX';
  @override
  int get decimals => 6;

  @override
  Future<String> getBalance(String address) async {
    final response = await http.get(Uri.parse('$_rpcUrl/v1/accounts/$address'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch TRON balance');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final account = (data['data'] as List).first as Map<String, dynamic>;
    final balance = account['balance'] as int? ?? 0;
    return _sunToTrx(balance);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await http.post(
      Uri.parse('$_rpcUrl/wallet/broadcasttransaction'),
      headers: {'Content-Type': 'application/json'},
      body: rawTx,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to broadcast TRON transaction');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['txid'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await http.get(Uri.parse('$_rpcUrl/wallet/getnowblock'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch TRON block');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (data['block_header'] as Map)['raw_data']['number'].toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    // TRON bandwidth/energy estimation
    return '1000'; // ~0.001 TRX base fee
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'owner_address': params.from,
      'to_address': params.to,
      'amount': int.parse(params.value ?? '0'),
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return address.startsWith('T') && address.length == 34;
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await http.get(Uri.parse('$_rpcUrl/wallet/gettransactioninfobyid?value=$txHash'));
    if (response.statusCode != 200 || response.body.isEmpty) {
      return {'status': 'pending', 'hash': txHash};
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return {
      'status': data['receipt']?['result'] == 'SUCCESS' ? 'success' : 'failed',
      'hash': txHash,
      'blockNumber': data['blockNumber'],
    };
  }

  String _sunToTrx(int sun) {
    final trx = sun / 1e6;
    return trx.toStringAsFixed(trx.truncateToDouble() == trx ? 0 : 6);
  }
}

// ── Cosmos Chain Adapter ────────────────────────────────────────────────

/// Cosmos Hub chain adapter.
class CosmosChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  CosmosChainAdapter({String rpcUrl = 'https://rpc.cosmos.network'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'cosmos:cosmoshub-4';
  @override
  String get chainName => 'Cosmos Hub';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'ATOM';
  @override
  int get decimals => 6;

  @override
  Future<String> getBalance(String address) async {
    final response = await http.get(Uri.parse('$_rpcUrl/cosmos/bank/v1beta1/balances/$address'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Cosmos balance');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final balances = data['balances'] as List;
    if (balances.isEmpty) return '0';
    final atomBalance = balances.firstWhere(
      (b) => (b as Map)['denom'] == 'uatom',
      orElse: () => {'amount': '0'},
    );
    final uatom = int.parse(atomBalance['amount'] as String);
    return _uatomToAtom(uatom);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await http.post(
      Uri.parse('$_rpcUrl/cosmos/tx/v1beta1/txs'),
      headers: {'Content-Type': 'application/json'},
      body: rawTx,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to broadcast Cosmos transaction');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['tx_response']['txhash'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await http.get(Uri.parse('$_rpcUrl/cosmos/base/tendermint/v1/blocks/latest'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Cosmos block');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['block']['header']['height'] as String;
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    return '5000'; // ~0.005 ATOM
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'body': {
        'messages': [
          {
            '@type': '/cosmos.bank.v1beta1.MsgSend',
            'from_address': params.from,
            'to_address': params.to,
            'amount': [
              {'denom': 'uatom', 'amount': params.value}
            ],
          }
        ],
      },
      'auth_info': {'fee': {'amount': [], 'gas_limit': '200000'}},
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return address.startsWith('cosmos') && address.length >= 40;
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await http.get(Uri.parse('$_rpcUrl/cosmos/tx/v1beta1/txs/$txHash'));
    if (response.statusCode != 200) {
      return {'status': 'pending', 'hash': txHash};
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return {
      'status': data['tx_response']['code'] == 0 ? 'success' : 'failed',
      'hash': txHash,
      'height': data['tx_response']['height'],
    };
  }

  String _uatomToAtom(int uatom) {
    final atom = uatom / 1e6;
    return atom.toStringAsFixed(atom.truncateToDouble() == atom ? 0 : 6);
  }
}

// ── NEAR Chain Adapter ──────────────────────────────────────────────────

/// NEAR Protocol chain adapter.
class NearChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  NearChainAdapter({String rpcUrl = 'https://rpc.mainnet.near.org'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'near:near-mainnet';
  @override
  String get chainName => 'NEAR';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'NEAR';
  @override
  int get decimals => 24;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('query', {
      'request_type': 'view_account',
      'finality': 'final',
      'account_id': address,
    });
    final result = response['result'] as Map<String, dynamic>;
    final balance = BigInt.parse(result['amount'] as String);
    final divisor = BigInt.from(10).pow(decimals);
    final whole = balance ~/ divisor;
    final frac = balance % divisor;
    if (frac == BigInt.zero) return whole.toString();
    return '$whole.${frac.toString().padLeft(decimals, '0').replaceAll(RegExp(r'0+$'), '')}';
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('broadcast_tx_commit', [rawTx]);
    final result = response['result'] as Map<String, dynamic>;
    return result['transaction']['hash'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('block', {'finality': 'final'});
    final result = response['result'] as Map<String, dynamic>;
    return result['header']['height'].toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    return '1000000000000000000000'; // ~0.000001 NEAR
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'receiver_id': params.to,
      'actions': [
        {
          'Transfer': {
            'deposit': params.value ?? '0',
          }
        }
      ],
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    // NEAR accounts: 2-64 chars, lowercase alphanumeric with . and -
    if (address.length < 2 || address.length > 64) return false;
    return RegExp(r'^[a-z0-9._-]+$').hasMatch(address);
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('tx', [txHash, '']);
    if (response['result'] == null) {
      return {'status': 'pending', 'hash': txHash};
    }
    final result = response['result'] as Map<String, dynamic>;
    return {
      'status': result['status'] != null ? 'success' : 'failed',
      'hash': txHash,
    };
  }

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    dynamic params,
  ) async {
    final body = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params,
      'id': DateTime.now().millisecondsSinceEpoch,
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('NEAR RPC failed: ${response.statusCode}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

// ── Sui Chain Adapter ───────────────────────────────────────────────────

/// Sui chain adapter.
class SuiChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  SuiChainAdapter({String rpcUrl = 'https://fullnode.mainnet.sui.io'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'sui:sui-mainnet';
  @override
  String get chainName => 'Sui';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'SUI';
  @override
  int get decimals => 9;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('suix_getBalance', [address, '0x2::sui::SUI']);
    final result = response['result'] as Map<String, dynamic>;
    final total = BigInt.parse(result['totalBalance'] as String);
    final divisor = BigInt.from(10).pow(decimals);
    final whole = total ~/ divisor;
    final frac = total % divisor;
    if (frac == BigInt.zero) return whole.toString();
    return '$whole.${frac.toString().padLeft(decimals, '0').replaceAll(RegExp(r'0+$'), '')}';
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('sui_executeTransactionBlock', [
      rawTx,
      {'commitment': 'Finalized'}
    ]);
    final result = response['result'] as Map<String, dynamic>;
    return result['digest'] as String? ?? rawTx;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('sui_getLatestCheckpointSequenceNumber', []);
    return response['result'] as String;
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    return '1000000'; // ~0.001 SUI
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'kind': 'ProgrammableTransaction',
      'inputs': [],
      'transactions': [
        {
          'SplitCoins': [
            {'Input': 0},
            [{'Input': 1}]
          ]
        },
        {
          'TransferObjects': [
            [{'NestedResult': [0, 0]}],
            {'Input': 2}
          ]
        }
      ],
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return address.startsWith('0x') && address.length >= 66;
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('sui_getTransactionBlock', [txHash, {'showEffects': true}]);
    if (response['result'] == null) {
      return {'status': 'pending', 'hash': txHash};
    }
    final result = response['result'] as Map<String, dynamic>;
    final status = (result['effects'] as Map?)?['status'] as Map?;
    return {
      'status': status?['status'] == 'success' ? 'success' : 'failed',
      'hash': txHash,
      'checkpoint': result['checkpoint'],
    };
  }

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    List<dynamic> params,
  ) async {
    final body = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params,
      'id': DateTime.now().millisecondsSinceEpoch,
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('Sui RPC failed: ${response.statusCode}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

// ── Starknet Chain Adapter ──────────────────────────────────────────────

/// Starknet chain adapter.
class StarknetChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  StarknetChainAdapter({String rpcUrl = 'https://rpc.starknet.lava.build'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'starknet:SN_MAIN';
  @override
  String get chainName => 'Starknet';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'ETH';
  @override
  int get decimals => 18;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('starknet_call', {
      'contract_address': '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      'entry_point_selector': '0x50155daf389276866962b4690e2373b38e48b5636954d72c497e00c2a3e1e1',
      'calldata': [address],
    });
    // Simplified — actual Starknet needs proper Cairo call encoding
    return '0'; // Placeholder
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('starknet_addInvokeTransaction', jsonDecode(rawTx));
    final result = response['result'] as Map<String, dynamic>;
    return result['transaction_hash'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('starknet_blockNumber', []);
    return (response['result'] as int).toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    return '1000000000000000'; // ~0.000001 ETH
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'invocation': {
        'contract_address': params.to,
        'entry_point_selector': '0x',
        'calldata': [params.value ?? '0'],
      },
      'type': 'INVOKE',
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return address.startsWith('0x') && address.length <= 66;
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('starknet_getTransactionStatus', {'transaction_hash': txHash});
    if (response['result'] == null) {
      return {'status': 'pending', 'hash': txHash};
    }
    final result = response['result'] as Map<String, dynamic>;
    return {
      'status': result['execution_status'] == 'SUCCEEDED' ? 'success' : 'failed',
      'hash': txHash,
    };
  }

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    dynamic params,
  ) async {
    final body = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params is List ? params : [params],
      'id': DateTime.now().millisecondsSinceEpoch,
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('Starknet RPC failed: ${response.statusCode}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

// ── Hedera Chain Adapter ────────────────────────────────────────────────

/// Hedera chain adapter.
class HederaChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  HederaChainAdapter({String rpcUrl = 'https://mainnet-public.mirrornode.hedera.com'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'hedera:mainnet';
  @override
  String get chainName => 'Hedera';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'HBAR';
  @override
  int get decimals => 8;

  @override
  Future<String> getBalance(String address) async {
    final response = await http.get(Uri.parse('$_rpcUrl/api/v1/accounts/$address'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Hedera balance');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final tinybars = data['balance']?['balance'] as int? ?? 0;
    return _tinybarToHbar(tinybars);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await http.post(
      Uri.parse('$_rpcUrl/api/v1/transactions'),
      headers: {'Content-Type': 'application/x-protobuf'},
      body: rawTx,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to submit Hedera transaction');
    }
    return rawTx;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await http.get(Uri.parse('$_rpcUrl/api/v1/blocks?limit=1&order=desc'));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch Hedera block');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (data['blocks'] as List).first['number'].toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    return '10000000'; // ~0.1 HBAR
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'nodeId': '0.0.3',
      'accountId': params.to,
      'amount': params.value,
      'memo': params.data ?? '',
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return RegExp(r'^\d+\.\d+\.\d+$').hasMatch(address);
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await http.get(Uri.parse('$_rpcUrl/api/v1/transactions/$txHash'));
    if (response.statusCode != 200) {
      return {'status': 'pending', 'hash': txHash};
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final transactions = data['transactions'] as List?;
    if (transactions == null || transactions.isEmpty) {
      return {'status': 'pending', 'hash': txHash};
    }
    final tx = transactions.first as Map<String, dynamic>;
    return {
      'status': tx['result'] == 'SUCCESS' ? 'success' : 'failed',
      'hash': txHash,
      'consensusTimestamp': tx['consensus_timestamp'],
    };
  }

  String _tinybarToHbar(int tinybars) {
    final hbar = tinybars / 1e8;
    return hbar.toStringAsFixed(hbar.truncateToDouble() == hbar ? 0 : 8);
  }
}

// ── XRPL Chain Adapter ──────────────────────────────────────────────────

/// XRP Ledger chain adapter.
class XrplChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  XrplChainAdapter({String rpcUrl = 'https://xrplcluster.com'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'xrpl:0';
  @override
  String get chainName => 'XRP Ledger';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'XRP';
  @override
  int get decimals => 6;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('account_info', {
      'account': address,
      'ledger_index': 'validated',
    });
    final result = response['result'] as Map<String, dynamic>;
    final drops = result['account_data']['Balance'] as String;
    final xrp = int.parse(drops) / 1e6;
    return xrp.toStringAsFixed(xrp.truncateToDouble() == xrp ? 0 : 6);
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('submit', {'tx_blob': rawTx});
    final result = response['result'] as Map<String, dynamic>;
    return result['tx_json']?['hash'] as String? ?? rawTx;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('ledger', {'ledger_index': 'validated'});
    final result = response['result'] as Map<String, dynamic>;
    return result['ledger_index'].toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    final response = await _jsonRpcCall('fee', {});
    final result = response['result'] as Map<String, dynamic>;
    final drops = result['drops']['base_fee'] as String;
    return (int.parse(drops) / 1e6).toStringAsFixed(6);
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'TransactionType': 'Payment',
      'Account': params.from,
      'Destination': params.to,
      'Amount': params.value,
      'Fee': '12',
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    return address.startsWith('r') && address.length >= 25 && address.length <= 35;
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('tx', {
      'transaction': txHash,
      'binary': false,
    });
    final result = response['result'] as Map<String, dynamic>;
    if (result['error'] != null) {
      return {'status': 'pending', 'hash': txHash};
    }
    return {
      'status': result['meta']?['TransactionResult'] == 'tesSUCCESS' ? 'success' : 'failed',
      'hash': txHash,
      'ledgerIndex': result['ledger_index'],
    };
  }

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    Map<String, dynamic> params,
  ) async {
    final body = jsonEncode({
      'method': method,
      'params': [params],
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('XRPL RPC failed: ${response.statusCode}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

// ── Polkadot Chain Adapter ──────────────────────────────────────────────

/// Polkadot chain adapter.
class PolkadotChainAdapter implements ChainAdapter {
  final String _rpcUrl;

  PolkadotChainAdapter({String rpcUrl = 'https://rpc.polkadot.io'})
      : _rpcUrl = rpcUrl;

  @override
  String get chainId => 'polkadot:91b171bb158e2d3848fa23a9f1c25182';
  @override
  String get chainName => 'Polkadot';
  @override
  String get rpcUrl => _rpcUrl;
  @override
  String get symbol => 'DOT';
  @override
  int get decimals => 10;

  @override
  Future<String> getBalance(String address) async {
    final response = await _jsonRpcCall('state_getStorage', [
      _storageKey('System', 'Account', address),
    ]);
    if (response['result'] == null) return '0';
    // Decoding SCALE-encoded balance requires polkadot-js
    // Simplified: return placeholder
    return '0';
  }

  @override
  Future<String> sendTransaction(String rawTx) async {
    final response = await _jsonRpcCall('author_submitExtrinsic', [rawTx]);
    return response['result'] as String;
  }

  @override
  Future<String> getLatestBlock() async {
    final response = await _jsonRpcCall('chain_getBlockNumber', []);
    final hexBlock = response['result'] as String;
    return int.parse(hexBlock.substring(2), radix: 16).toString();
  }

  @override
  Future<String> estimateFee({Map<String, dynamic>? txData}) async {
    return '150000000'; // ~0.015 DOT
  }

  @override
  Future<String> buildTransaction(TransactionParams params) async {
    return jsonEncode({
      'method': {
        'callIndex': '0x0500', // balances.transfer
        'args': {
          'dest': {'Id': params.to},
          'value': params.value,
        }
      },
      'era': {'current': 0, 'phase': 0},
      'nonce': 0,
      'tip': 0,
    });
  }

  @override
  Map<String, dynamic> decodeTransaction(String rawTx) {
    return jsonDecode(rawTx) as Map<String, dynamic>;
  }

  @override
  bool isValidAddress(String address) {
    // Polkadot addresses start with '1' and are ~47 chars (base58)
    return (address.startsWith('1') || address.startsWith('5')) &&
        address.length >= 40 &&
        address.length <= 50;
  }

  @override
  Future<Map<String, dynamic>> getTransactionStatus(String txHash) async {
    final response = await _jsonRpcCall('chain_getBlockHash', []);
    // Polkadot tx status requires subscription to author_submitAndWatchExtrinsic
    return {
      'status': 'pending',
      'hash': txHash,
    };
  }

  Future<Map<String, dynamic>> _jsonRpcCall(
    String method,
    List<dynamic> params,
  ) async {
    final body = jsonEncode({
      'jsonrpc': '2.0',
      'method': method,
      'params': params,
      'id': DateTime.now().millisecondsSinceEpoch,
    });

    final response = await http.post(
      Uri.parse(_rpcUrl),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode != 200) {
      throw Exception('Polkadot RPC failed: ${response.statusCode}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  String _storageKey(String module, String storage, String key) {
    // Simplified — actual Polkadot needs proper SCALE + Twox64Concat hashing
    final input = '$module$storage$key';
    final hashBytes = sha256.convert(utf8.encode(input)).bytes;
    return hex.encode(hashBytes);
  }
}
