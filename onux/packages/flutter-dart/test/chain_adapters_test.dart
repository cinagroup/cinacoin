/// Tests for the multi-chain adapter registry and chain adapters.
import 'package:flutter_test/flutter_test.dart';
import 'package:cinacoin/chain_adapters.dart';

void main() {
  group('ChainRegistry', () {
    test('contains 14 chain configurations', () {
      expect(ChainRegistry.chains.length, 14);
    });

    test('can get chain by ID', () {
      final eth = ChainRegistry.get('eip155:1');
      expect(eth, isNotNull);
      expect(eth!.name, 'Ethereum');
      expect(eth.symbol, 'ETH');
      expect(eth.decimals, 18);
    });

    test('can get all chain IDs', () {
      final ids = ChainRegistry.getAllChainIds();
      expect(ids.length, 14);
      expect(ids.contains('eip155:1'), true);
      expect(ids.contains('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'), true);
    });

    test('can filter EVM chains', () {
      final evmChains = ChainRegistry.getEvmChainIds();
      expect(evmChains.contains('eip155:1'), true);
      expect(evmChains.contains('eip155:137'), true);
      expect(evmChains.contains('eip155:42161'), true);
      expect(evmChains.contains('eip155:10'), true);
    });

    test('can filter non-EVM chains', () {
      final nonEvm = ChainRegistry.getNonEvmChainIds();
      expect(nonEvm.contains('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'), true);
      expect(nonEvm.contains('bip122:000000000019d6689c085ae165831e93'), true);
    });

    test('isSupported returns correct values', () {
      expect(ChainRegistry.isSupported('eip155:1'), true);
      expect(ChainRegistry.isSupported('eip155:9999999'), false);
    });

    test('getChainType returns correct types', () {
      expect(ChainRegistry.getChainType('eip155:1'), ChainType.evm);
      expect(ChainRegistry.getChainType('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'),
          ChainType.solana);
      expect(ChainRegistry.getChainType('bip122:000000000019d6689c085ae165831e93'),
          ChainType.bitcoin);
      expect(ChainRegistry.getChainType('tron:0x2b6653dc'), ChainType.tron);
      expect(ChainRegistry.getChainType('cosmos:cosmoshub-4'), ChainType.cosmos);
      expect(ChainRegistry.getChainType('near:near-mainnet'), ChainType.near);
      expect(ChainRegistry.getChainType('sui:sui-mainnet'), ChainType.sui);
      expect(ChainRegistry.getChainType('starknet:SN_MAIN'), ChainType.starknet);
      expect(ChainRegistry.getChainType('hedera:mainnet'), ChainType.hedera);
      expect(ChainRegistry.getChainType('xrpl:0'), ChainType.xrpl);
      expect(
          ChainRegistry.getChainType('polkadot:91b171bb158e2d3848fa23a9f1c25182'),
          ChainType.polkadot);
    });

    test('getAdapter returns correct adapter types', () {
      expect(ChainRegistry.getAdapter('eip155:1'), isA<EvmChainAdapter>());
      expect(ChainRegistry.getAdapter('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'),
          isA<SolanaChainAdapter>());
      expect(ChainRegistry.getAdapter('bip122:000000000019d6689c085ae165831e93'),
          isA<BitcoinChainAdapter>());
      expect(ChainRegistry.getAdapter('tron:0x2b6653dc'), isA<TronChainAdapter>());
      expect(ChainRegistry.getAdapter('cosmos:cosmoshub-4'),
          isA<CosmosChainAdapter>());
      expect(ChainRegistry.getAdapter('near:near-mainnet'), isA<NearChainAdapter>());
      expect(ChainRegistry.getAdapter('sui:sui-mainnet'), isA<SuiChainAdapter>());
      expect(ChainRegistry.getAdapter('starknet:SN_MAIN'),
          isA<StarknetChainAdapter>());
      expect(ChainRegistry.getAdapter('hedera:mainnet'), isA<HederaChainAdapter>());
      expect(ChainRegistry.getAdapter('xrpl:0'), isA<XrplChainAdapter>());
      expect(
          ChainRegistry.getAdapter('polkadot:91b171bb158e2d3848fa23a9f1c25182'),
          isA<PolkadotChainAdapter>());
    });

    test('getAdapter throws for unsupported chain', () {
      expect(() => ChainRegistry.getAdapter('fake:chain'), throwsArgumentError);
    });
  });

  group('ChainConfig', () {
    test('explorer URLs are correct', () {
      final eth = ChainRegistry.get('eip155:1')!;
      expect(eth.txExplorerUrl('0xabc'), 'https://etherscan.io/tx/0xabc');
      expect(eth.addressExplorerUrl('0xdef'), 'https://etherscan.io/address/0xdef');
    });
  });

  group('EvmChainAdapter', () {
    test('isValidAddress validates EVM addresses', () {
      final adapter = EvmChainAdapter(rpcUrl: 'https://eth.llamarpc.com');
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'), false);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), true);
      expect(adapter.isValidAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'), false);
    });

    test('chainId is correct', () {
      final adapter = EvmChainAdapter(
        rpcUrl: 'https://eth.llamarpc.com',
        chainId: 'eip155:1',
      );
      expect(adapter.chainId, 'eip155:1');
      expect(adapter.symbol, 'ETH');
      expect(adapter.decimals, 18);
    });
  });

  group('SolanaChainAdapter', () {
    test('isValidAddress validates Solana addresses', () {
      final adapter = SolanaChainAdapter();
      expect(
          adapter.isValidAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
          true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });

  group('BitcoinChainAdapter', () {
    test('isValidAddress validates Bitcoin addresses', () {
      final adapter = BitcoinChainAdapter();
      expect(adapter.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'), true);
      expect(
          adapter.isValidAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'), true);
      expect(adapter.isValidAddress('3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy'), true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });

  group('TronChainAdapter', () {
    test('isValidAddress validates TRON addresses', () {
      final adapter = TronChainAdapter();
      expect(adapter.isValidAddress('TJCnKsPa7y5oKLPXXLJn8hFgJZkH7XaGQp'), true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });

  group('CosmosChainAdapter', () {
    test('isValidAddress validates Cosmos addresses', () {
      final adapter = CosmosChainAdapter();
      expect(
          adapter.isValidAddress(
              'cosmos1clpqr4nrk4khgkxj78fcwwh6dl3uw4epsluffn'),
          true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });

  group('NearChainAdapter', () {
    test('isValidAddress validates NEAR accounts', () {
      final adapter = NearChainAdapter();
      expect(adapter.isValidAddress('alice.near'), true);
      expect(adapter.isValidAddress('bob.testnet'), true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });

  group('SuiChainAdapter', () {
    test('isValidAddress validates Sui addresses', () {
      final adapter = SuiChainAdapter();
      expect(
          adapter.isValidAddress(
              '0x0000000000000000000000000000000000000000000000000000000000000001'),
          true);
      expect(adapter.isValidAddress('0xshort'), false);
    });
  });

  group('XrplChainAdapter', () {
    test('isValidAddress validates XRPL addresses', () {
      final adapter = XrplChainAdapter();
      expect(adapter.isValidAddress('rN7n3473SaZtG4qVz91S8F9zQ6qZ3p6XrG'), true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });

  group('PolkadotChainAdapter', () {
    test('isValidAddress validates Polkadot addresses', () {
      final adapter = PolkadotChainAdapter();
      expect(
          adapter.isValidAddress(
              '15oF4uVJwmo4TdGW7VfQxNLavjCXviTLT9S1z6hyVnMnJqH'),
          true);
      expect(adapter.isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'), false);
    });
  });
}
