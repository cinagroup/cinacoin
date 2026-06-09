/// Tests for the SignerManager.
import 'package:flutter_test/flutter_test.dart';
import 'package:cinacoin/signer_manager.dart';

void main() {
  group('SignerManager - SIWE', () {
    test('generates SIWE message correctly', () {
      final message = SignerManager.generateSiweMessage(
        domain: 'example.com',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        nonce: 'abc123',
        uri: 'https://example.com',
        statement: 'Sign in to the app',
        chainId: 1,
      );

      expect(message, contains('example.com wants you to sign in'));
      expect(message, contains('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'));
      expect(message, contains('URI: https://example.com'));
      expect(message, contains('Version: 1'));
      expect(message, contains('Chain ID: 1'));
      expect(message, contains('Nonce: abc123'));
      expect(message, contains('Issued At:'));
    });

    test('generates SIWE without optional fields', () {
      final message = SignerManager.generateSiweMessage(
        domain: 'example.com',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        nonce: 'abc123',
      );

      expect(message, contains('example.com wants you to sign in'));
      expect(message, contains('URI: https://example.com'));
      expect(message, contains('Version: 1'));
      expect(message, contains('Nonce: abc123'));
      expect(message, isNot(contains('Chain ID:')));
    });
  });

  group('SignerManager - EIP-712 Builder', () {
    test('builds typed data JSON correctly', () {
      final typedData = SignerManager.buildTypedData(
        domain: const Eip712Domain(
          name: 'MyApp',
          version: '1',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        ),
        types: {
          'Person': [
            const Eip712Field(name: 'name', type: 'string'),
            const Eip712Field(name: 'wallet', type: 'address'),
          ],
        },
        primaryType: 'Person',
        message: {
          'name': 'Alice',
          'wallet': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        },
      );

      expect(typedData, contains('"primaryType":"Person"'));
      expect(typedData, contains('"name":"Alice"'));
      expect(typedData, contains('"name":"MyApp"'));
      expect(typedData, contains('"version":"1"'));
    });
  });

  group('SignerManager - hashMessage', () {
    test('computes EIP-191 hash', () {
      // Create a minimal SignerManager for hash testing
      final signer = SignerManager(
        requestFn: ({
          required String method,
          required List<dynamic> params,
          String? topic,
          String? chainId,
        }) async => '0x',
        sessionTopicGetter: () => 'test-topic',
        chainIdGetter: () => 1,
        accountsGetter: () => ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
      );

      final hash = signer.hashMessage('Hello World');
      expect(hash.startsWith('0x'), true);
      expect(hash.length, 66); // 0x + 64 hex chars

      signer.dispose();
    });
  });

  group('SignerManager - verifySignature', () {
    late SignerManager signer;

    setUp(() {
      signer = SignerManager(
        requestFn: ({
          required String method,
          required List<dynamic> params,
          String? topic,
          String? chainId,
        }) async => '0x',
        sessionTopicGetter: () => 'test-topic',
        chainIdGetter: () => 1,
        accountsGetter: () => ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'],
      );
    });

    tearDown(() => signer.dispose());

    test('validates signature format', () {
      // Valid format: 0x + 130 hex chars
      expect(
        signer.verifySignature(
          message: 'test',
          signature:
              '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          expectedAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        ),
        true,
      );
    });

    test('rejects invalid signature format', () {
      expect(
        signer.verifySignature(
          message: 'test',
          signature: 'invalid',
          expectedAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        ),
        false,
      );
    });
  });

  group('Eip712Domain', () {
    test('can be constructed with partial fields', () {
      const domain = Eip712Domain(name: 'Test', version: '1');
      expect(domain.name, 'Test');
      expect(domain.version, '1');
      expect(domain.chainId, isNull);
    });
  });

  group('Eip712Field', () {
    test('stores name and type', () {
      const field = Eip712Field(name: 'balance', type: 'uint256');
      expect(field.name, 'balance');
      expect(field.type, 'uint256');
    });
  });
}
