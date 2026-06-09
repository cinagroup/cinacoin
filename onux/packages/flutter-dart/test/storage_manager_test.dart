/// Tests for the StorageManager.
import 'package:flutter_test/flutter_test.dart';
import 'package:cinacoin/storage_manager.dart';

void main() {
  group('SessionData', () {
    test('can serialize to JSON', () {
      final data = SessionData(
        topic: 'test-topic-123',
        accounts: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
        chainId: 1,
        connectorId: 'metamask',
        createdAt: DateTime.now().toIso8601String(),
      );

      final json = data.toJson();
      expect(json['topic'], 'test-topic-123');
      expect(json['accounts'], ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0']);
      expect(json['chainId'], 1);
      expect(json['connectorId'], 'metamask');
      expect(json['isConnected'], true);
    });

    test('can deserialize from JSON', () {
      final json = {
        'topic': 'test-topic-456',
        'accounts': ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
        'chainId': 137,
        'connectorId': 'walletconnect',
        'isConnected': true,
        'createdAt': '2024-01-01T00:00:00.000Z',
      };

      final data = SessionData.fromJson(json);
      expect(data.topic, 'test-topic-456');
      expect(data.accounts.length, 1);
      expect(data.chainId, 137);
      expect(data.connectorId, 'walletconnect');
    });

    test('toString is informative', () {
      final data = SessionData(
        topic: 'abc',
        accounts: ['0x123'],
        chainId: 1,
        connectorId: 'test',
        createdAt: '2024-01-01',
      );
      expect(data.toString(), contains('abc'));
      expect(data.toString(), contains('1'));
    });
  });
}
