/// Transaction manager: build, sign, send, and track transactions.
///
/// Coordinates with chain adapters and the WalletConnect session to handle
/// the full transaction lifecycle: estimation → build → sign → submit → poll.
library transaction_manager;

import 'dart:async';
import 'types.dart';
import 'chain_adapters.dart';

/// Transaction status states.
enum TxStatus { pending, submitted, confirmed, failed, dropped }

/// Transaction lifecycle event.
class TxEvent {
  final String txHash;
  final TxStatus status;
  final String? errorMessage;
  final int? blockNumber;
  final DateTime timestamp;

  const TxEvent({
    required this.txHash,
    required this.status,
    this.errorMessage,
    this.blockNumber,
    required this.timestamp,
  });

  @override
  String toString() => 'TxEvent(hash=$txHash, status=$status)';
}

/// Transaction manager handles building, signing, sending, and polling
/// transactions across multiple chains.
class TransactionManager {
  // ── State ────────────────────────────────────────────────────────────

  final Map<String, ChainAdapter> _adapters = {};
  final Map<String, TxEvent> _transactions = {};
  final _eventController = StreamController<TxEvent>.broadcast();
  String? _activeChainId;
  bool _disposed = false;

  /// Stream of transaction lifecycle events.
  Stream<TxEvent> get events => _eventController.stream;

  /// Currently active chain.
  String? get activeChainId => _activeChainId;

  /// All tracked transactions.
  Map<String, TxEvent> get transactions => Map.unmodifiable(_transactions);

  /// Register a chain adapter.
  void registerAdapter(String chainId, ChainAdapter adapter) {
    _adapters[chainId] = adapter;
  }

  /// Set the active chain.
  void setActiveChain(String chainId) {
    if (!_adapters.containsKey(chainId)) {
      throw ArgumentError('No adapter registered for chain: $chainId');
    }
    _activeChainId = chainId;
  }

  /// Get adapter for a chain.
  ChainAdapter getAdapter(String? chainId) {
    final id = chainId ?? _activeChainId;
    if (id == null) {
      throw StateError('No active chain set. Call setActiveChain() first.');
    }
    final adapter = _adapters[id];
    if (adapter == null) {
      throw StateError('No adapter registered for chain: $id');
    }
    return adapter;
  }

  // ── Build ────────────────────────────────────────────────────────────

  /// Build an unsigned transaction.
  Future<String> buildTransaction({
    required String from,
    required String to,
    String? value,
    String? data,
    String? chainId,
  }) async {
    final adapter = getAdapter(chainId);
    final params = TransactionParams(
      from: from,
      to: to,
      value: value,
      data: data,
    );
    return adapter.buildTransaction(params);
  }

  // ── Fee Estimation ───────────────────────────────────────────────────

  /// Estimate the fee for a transaction.
  Future<String> estimateFee({
    required String from,
    required String to,
    String? value,
    String? data,
    String? chainId,
  }) async {
    final adapter = getAdapter(chainId);
    return adapter.estimateFee(txData: {
      'from': from,
      'to': to,
      'value': value,
      'data': data,
    });
  }

  /// Get detailed gas/fee estimates for EVM chains.
  Future<Map<String, String>> getGasEstimates(String? chainId) async {
    final adapter = getAdapter(chainId);
    final block = await adapter.getLatestBlock();
    final fee = await adapter.estimateFee();
    return {
      'latestBlock': block,
      'estimatedFee': fee,
      'symbol': adapter.symbol,
      'chainId': adapter.chainId,
    };
  }

  // ── Send ─────────────────────────────────────────────────────────────

  /// Send a signed transaction.
  ///
  /// [signedTx] is the hex-encoded signed transaction bytes.
  /// Returns the transaction hash.
  Future<String> sendTransaction(String signedTx, {String? chainId}) async {
    final adapter = getAdapter(chainId);
    final txHash = await adapter.sendTransaction(signedTx);

    _transactions[txHash] = TxEvent(
      txHash: txHash,
      status: TxStatus.submitted,
      timestamp: DateTime.now(),
    );

    _eventController.add(TxEvent(
      txHash: txHash,
      status: TxStatus.submitted,
      timestamp: DateTime.now(),
    ));

    return txHash;
  }

  /// Build and send via WalletConnect (unsigned → wallet signs → broadcast).
  Future<String> sendViaWalletConnect({
    required String from,
    required String to,
    required Future<dynamic> Function(String method, List<dynamic> params) request,
    String? value,
    String? data,
    String? chainId,
  }) async {
    final txHash = await request(
      'eth_sendTransaction',
      [
        {
          'from': from,
          'to': to,
          if (value != null) 'value': value,
          if (data != null) 'data': data,
        }
      ],
    );

    final hash = txHash.toString();

    _transactions[hash] = TxEvent(
      txHash: hash,
      status: TxStatus.submitted,
      timestamp: DateTime.now(),
    );

    _eventController.add(TxEvent(
      txHash: hash,
      status: TxStatus.submitted,
      timestamp: DateTime.now(),
    ));

    return hash;
  }

  // ── Status Polling ───────────────────────────────────────────────────

  /// Poll a transaction until confirmed or failed.
  ///
  /// [txHash] the transaction hash to track.
  /// [maxAttempts] maximum polling attempts (default: 30).
  /// [intervalMs] delay between polls in milliseconds (default: 3000).
  Future<TxEvent> pollTransaction(
    String txHash, {
    int maxAttempts = 30,
    int intervalMs = 3000,
    String? chainId,
  }) async {
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      final status = await getTransactionStatus(txHash, chainId: chainId);

      if (status['status'] == 'success' || status['status'] == 'confirmed') {
        final event = TxEvent(
          txHash: txHash,
          status: TxStatus.confirmed,
          blockNumber: int.tryParse(status['blockNumber']?.toString() ?? ''),
          timestamp: DateTime.now(),
        );
        _transactions[txHash] = event;
        _eventController.add(event);
        return event;
      }

      if (status['status'] == 'failed') {
        final event = TxEvent(
          txHash: txHash,
          status: TxStatus.failed,
          errorMessage: 'Transaction failed',
          timestamp: DateTime.now(),
        );
        _transactions[txHash] = event;
        _eventController.add(event);
        return event;
      }

      await Future.delayed(Duration(milliseconds: intervalMs));
    }

    final event = TxEvent(
      txHash: txHash,
      status: TxStatus.dropped,
      errorMessage: 'Polling timeout after $maxAttempts attempts',
      timestamp: DateTime.now(),
    );
    _transactions[txHash] = event;
    _eventController.add(event);
    return event;
  }

  /// Get the current status of a transaction.
  Future<Map<String, dynamic>> getTransactionStatus(
    String txHash, {
    String? chainId,
  }) async {
    final adapter = getAdapter(chainId);
    return adapter.getTransactionStatus(txHash);
  }

  /// Get balance for an address.
  Future<String> getBalance(String address, {String? chainId}) async {
    final adapter = getAdapter(chainId);
    return adapter.getBalance(address);
  }

  /// Get latest block.
  Future<String> getLatestBlock({String? chainId}) async {
    final adapter = getAdapter(chainId);
    return adapter.getLatestBlock();
  }

  /// Dispose of the manager.
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    await _eventController.close();
  }
}
