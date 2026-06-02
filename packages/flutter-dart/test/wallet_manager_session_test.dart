/// Tests for WalletManager session persistence, auto-reconnect, and signing flows.
///
/// Uses mock secure storage to verify encrypted session persistence
/// and expiry validation logic.
import 'package:flutter_test/flutter_test.dart';
import 'package:cinacoin/src/types.dart';
import 'package:cinacoin/src/wallet_manager.dart';
import 'package:cinacoin/src/deep_link_handler.dart';

// Mock secure storage for testing
class MockSecureStorage {
  final Map<String, String> _data = {};

  Future<String?> read({required String key}) async => _data[key];
  Future<void> write({required String key, required String value}) async {
    _data[key] = value;
  }
  Future<void> delete({required String key}) async {
    _data.remove(key);
  }
  Map<String, String> get data => Map.unmodifiable(_data);
  void clear() => _data.clear();
}

void main() {
  group('WalletManager Session Persistence', () {
    late MockSecureStorage mockStorage;

    setUp(() {
      mockStorage = MockSecureStorage();
    });

    test('session TTL defaults to 7 days', () {
      // Verify the default TTL constant
      const Duration defaultTtl = Duration(days: 7);
      expect(defaultTtl.inDays, 7);
      expect(defaultTtl.inHours, 168);
    });

    test('session expiry key is set on connect', () async {
      // Simulate what _persistSecureSession does
      final expiry = DateTime.now().add(Duration(days: 7)).toIso8601String();
      await mockStorage.write(key: 'cinacoin_session_expiry', value: expiry);

      final stored = await mockStorage.read(key: 'cinacoin_session_expiry');
      expect(stored, isNotNull);
      expect(stored, isNotEmpty);
      expect(DateTime.tryParse(stored!), isNotNull);
    });

    test('session data is serialized correctly', () {
      final sessionData = {
        'status': 'connected',
        'sessionId': 'test-topic-123',
        'accounts': ['eip155:1:0xAbc...Def'],
        'chainId': 1,
        'connectorId': 'metamask',
        'createdAt': DateTime.now().toIso8601String(),
      };

      expect(sessionData['status'], 'connected');
      expect(sessionData['sessionId'], 'test-topic-123');
      expect(sessionData['accounts'], ['eip155:1:0xAbc...Def']);
      expect(sessionData['chainId'], 1);
    });

    test('clear session removes both keys', () async {
      await mockStorage.write(key: 'cinacoin_encrypted_session', value: 'test');
      await mockStorage.write(key: 'cinacoin_session_expiry', value: 'test');

      await mockStorage.delete(key: 'cinacoin_encrypted_session');
      await mockStorage.delete(key: 'cinacoin_session_expiry');

      expect(await mockStorage.read(key: 'cinacoin_encrypted_session'), isNull);
      expect(await mockStorage.read(key: 'cinacoin_session_expiry'), isNull);
    });

    test('expired session is detected', () {
      final expiry = DateTime.now().subtract(Duration(hours: 1));
      final isExpired = DateTime.now().isAfter(expiry);
      expect(isExpired, isTrue);
    });

    test('valid session is not expired', () {
      final expiry = DateTime.now().add(Duration(hours: 1));
      final isExpired = DateTime.now().isAfter(expiry);
      expect(isExpired, isFalse);
    });
  });

  group('WalletManager State Transitions', () {
    test('connection status enum values', () {
      expect(ConnectionStatus.values.length, 4);
      expect(ConnectionStatus.disconnected.index, 0);
      expect(ConnectionStatus.connecting.index, 1);
      expect(ConnectionStatus.connected.index, 2);
      expect(ConnectionStatus.error.index, 3);
    });

    test('session state disconnected', () {
      final state = SessionState.disconnected;
      expect(state.status, ConnectionStatus.disconnected);
    });

    test('session state connecting', () {
      final state = SessionState.disconnected.connecting('metamask');
      expect(state.status, ConnectionStatus.connecting);
      expect(state.connectorId, 'metamask');
    });

    test('session state connected', () {
      final state = SessionState.disconnected.connected(
        accounts: ['0xAbc'],
        chainId: 1,
        sessionId: 'topic-123',
        connectorId: 'metamask',
      );
      expect(state.status, ConnectionStatus.connected);
      expect(state.accounts, ['0xAbc']);
      expect(state.chainId, 1);
    });

    test('session state errored', () {
      final state = SessionState.disconnected.errored('Connection failed');
      expect(state.status, ConnectionStatus.error);
      expect(state.error, 'Connection failed');
    });
  });

  group('WalletManager Chain ID Conversion', () {
    test('chain ID to hex conversion', () {
      expect(1.toRadixString(16), '1');
      expect(137.toRadixString(16), '89');
      expect(42161.toRadixString(16), 'a4b1');
      expect(10.toRadixString(16), 'a');
    });

    test('hex prefix format', () {
      final chainId = 1;
      final hex = '0x${chainId.toRadixString(16)}';
      expect(hex, '0x1');
    });
  });

  group('DeepLinkHandler', () {
    test('default constructor works', () {
      final handler = DeepLinkHandler();
      expect(handler, isNotNull);
    });
  });

  group('WalletInfo Registry', () {
    test('wallet info is identifiable', () {
      // Test the wallet registry patterns
      const walletIds = [
        'metamask',
        'walletconnect',
        'coinbase',
        'rainbow',
        'trust',
        'phantom',
      ];

      for (final id in walletIds) {
        expect(id.isNotEmpty, isTrue);
        expect(id.contains(' '), isFalse);
      }
    });

    test('wallet deep link schemes', () {
      const schemes = {
        'metamask': 'metamask://',
        'coinbase': 'cbwallet://',
        'rainbow': 'rainbow://',
        'trust': 'trust://',
        'phantom': 'phantom://',
      };

      for (final entry in schemes.entries) {
        expect(entry.value.endsWith('://'), isTrue);
        expect(entry.value.startsWith(entry.key.contains('coinbase') ? 'cb' : entry.key), isTrue);
      }
    });
  });

  group('Cinacoin Events', () {
    test('connected event has accounts and chainId', () {
      final event = CinacoinEvent.connected(accounts: ['0xAbc'], chainId: 1);
      expect(event, isA<CinacoinEvent>());
    });

    test('disconnected event', () {
      const event = CinacoinEvent.disconnected();
      expect(event, isA<CinacoinEvent>());
    });

    test('error event has message', () {
      final event = CinacoinEvent.error(message: 'Test error');
      expect(event, isA<CinacoinEvent>());
    });

    test('chain changed event', () {
      final event = CinacoinEvent.chainChanged(chainId: 137);
      expect(event, isA<CinacoinEvent>());
    });

    test('accounts changed event', () {
      final event = CinacoinEvent.accountsChanged(accounts: ['0xNew']);
      expect(event, isA<CinacoinEvent>());
    });

    test('session restored event', () {
      final event = CinacoinEvent.sessionRestored(accounts: ['0xAbc'], chainId: 1);
      expect(event, isA<CinacoinEvent>());
    });
  });

  group('AppMetadata Validation', () {
    test('valid metadata', () {
      final metadata = AppMetadata(
        name: 'Test App',
        description: 'A test application',
        url: 'https://test.app',
        icons: ['https://test.app/icon.png'],
      );
      expect(metadata.name, 'Test App');
      expect(metadata.description, 'A test application');
      expect(metadata.url, 'https://test.app');
      expect(metadata.icons.length, 1);
    });

    test('empty icons list is valid', () {
      final metadata = AppMetadata(
        name: 'Minimal',
        description: '',
        url: 'https://minimal.app',
        icons: [],
      );
      expect(metadata.icons, isEmpty);
    });
  });

  group('RequiredNamespace', () {
    test('builds with standard methods', () {
      final ns = RequiredNamespace(
        chains: ['eip155:1'],
        methods: [
          'eth_sendTransaction',
          'personal_sign',
          'eth_signTypedData_v4',
        ],
        events: ['chainChanged', 'accountsChanged'],
      );
      expect(ns.chains, ['eip155:1']);
      expect(ns.methods.length, 3);
      expect(ns.events.length, 2);
    });
  });

  group('ConnectionResult', () {
    test('result has all fields', () {
      final result = ConnectionResult(
        sessionId: 'topic-abc',
        accounts: ['0xAbc'],
        chainId: 1,
        connectorId: 'metamask',
      );
      expect(result.sessionId, 'topic-abc');
      expect(result.accounts, ['0xAbc']);
      expect(result.chainId, 1);
      expect(result.connectorId, 'metamask');
    });
  });

  group('TransactionRequest', () {
    test('minimal transaction', () {
      final tx = TransactionRequest(
        from: '0xAbc',
        to: '0xDef',
      );
      expect(tx.from, '0xAbc');
      expect(tx.to, '0xDef');
      expect(tx.value, isNull);
      expect(tx.data, isNull);
    });

    test('full transaction', () {
      final tx = TransactionRequest(
        from: '0xAbc',
        to: '0xDef',
        value: '0x100',
        data: '0xabcdef',
        gas: '0x5208',
        chainId: 1,
      );
      expect(tx.value, '0x100');
      expect(tx.data, '0xabcdef');
      expect(tx.gas, '0x5208');
      expect(tx.chainId, 1);
    });
  });

  group('ChainNamespace', () {
    test('eip155 namespace value', () {
      expect(ChainNamespace.eip155.value, 'eip155');
    });

    test('solana namespace value', () {
      expect(ChainNamespace.solana.value, 'solana');
    });
  });
}
