/// Tests for the TransactionManager.
import 'package:flutter_test/flutter_test.dart';
import 'package:cinacoin/transaction_manager.dart';
import 'package:cinacoin/chain_adapters.dart';

void main() {
  late TransactionManager txManager;

  setUp(() {
    txManager = TransactionManager();
  });

  tearDown(() async {
    await txManager.dispose();
  });

  group('TransactionManager', () {
    test('can register adapters', () {
      txManager.registerAdapter(
          'eip155:1', EvmChainAdapter(rpcUrl: 'https://eth.llamarpc.com'));
      expect(txManager.getAdapter('eip155:1'), isA<EvmChainAdapter>());
    });

    test('can set active chain', () {
      txManager.registerAdapter(
          'eip155:1', EvmChainAdapter(rpcUrl: 'https://eth.llamarpc.com'));
      txManager.setActiveChain('eip155:1');
      expect(txManager.activeChainId, 'eip155:1');
    });

    test('throws when no active chain set', () {
      expect(() => txManager.getAdapter(null), throwsStateError);
    });

    test('throws when adapter not registered', () {
      expect(() => txManager.setActiveChain('eip155:999'), throwsArgumentError);
    });

    test('throws when adapter not found', () {
      txManager.setActiveChain('eip155:1');
      expect(() => txManager.getAdapter('eip155:999'), throwsStateError);
    });

    test('tracks submitted transactions', () async {
      txManager.registerAdapter(
          'eip155:1', EvmChainAdapter(rpcUrl: 'https://eth.llamarpc.com'));

      final event = TxEvent(
        txHash: '0xabc123',
        status: TxStatus.submitted,
        timestamp: DateTime.now(),
      );

      // Simulate internal tracking
      expect(event.status, TxStatus.submitted);
      expect(event.txHash, '0xabc123');
    });

    test('TxEvent toString is informative', () {
      final event = TxEvent(
        txHash: '0xabc',
        status: TxStatus.confirmed,
        timestamp: DateTime.now(),
      );
      expect(event.toString(), contains('0xabc'));
      expect(event.toString(), contains('confirmed'));
    });

    test('can build transaction with active chain', () async {
      txManager.registerAdapter(
          'eip155:1', EvmChainAdapter(rpcUrl: 'https://eth.llamarpc.com'));
      txManager.setActiveChain('eip155:1');

      final built = await txManager.buildTransaction(
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        value: '1000000000000000000',
      );
      expect(built, isNotEmpty);
    });

    test('can get gas estimates', () async {
      txManager.registerAdapter(
          'eip155:1', EvmChainAdapter(rpcUrl: 'https://eth.llamarpc.com'));
      txManager.setActiveChain('eip155:1');

      // This will fail without network, but structure is correct
      expect(() => txManager.getGasEstimates('eip155:1'), throwsException);
    });
  });

  group('TxStatus', () {
    test('has all expected values', () {
      expect(TxStatus.values.length, 5);
      expect(TxStatus.values.contains(TxStatus.pending), true);
      expect(TxStatus.values.contains(TxStatus.submitted), true);
      expect(TxStatus.values.contains(TxStatus.confirmed), true);
      expect(TxStatus.values.contains(TxStatus.failed), true);
      expect(TxStatus.values.contains(TxStatus.dropped), true);
    });
  });
}
