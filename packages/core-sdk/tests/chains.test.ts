/**
 * core-sdk/tests/chains.test.ts
 *
 * Tests for chain configuration — EVM chains (ETH, Arbitrum, Base),
 * multi-chain support, and Chain type validation.
 */

import type { Chain, ChainNamespace, ChainReference } from '../src/types.js';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

// ---------------------------------------------------------------------------
// Fixtures: common chain definitions
// ---------------------------------------------------------------------------

const ETH_MAINNET: Chain = {
  id: 'eip155:1',
  name: 'Ethereum',
  rpcUrl: 'https://eth.llamarpc.com',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://etherscan.io',
};

const ARBITRUM: Chain = {
  id: 'eip155:42161',
  name: 'Arbitrum One',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://arbiscan.io',
};

const BASE: Chain = {
  id: 'eip155:8453',
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://basescan.org',
};

const POLYGON: Chain = {
  id: 'eip155:137',
  name: 'Polygon',
  rpcUrl: 'https://polygon-rpc.com',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  explorerUrl: 'https://polygonscan.com',
};

const OPTIMISM: Chain = {
  id: 'eip155:10',
  name: 'Optimism',
  rpcUrl: 'https://mainnet.optimism.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://optimistic.etherscan.io',
};

const BSC: Chain = {
  id: 'eip155:56',
  name: 'BNB Smart Chain',
  rpcUrl: 'https://bsc-dataseed.binance.org',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  explorerUrl: 'https://bscscan.com',
};

const AVALANCHE: Chain = {
  id: 'eip155:43114',
  name: 'Avalanche C-Chain',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  explorerUrl: 'https://snowtrace.io',
};

// Non-EVM chains
const SOLANA: Chain = {
  id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  name: 'Solana',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
};

const BITCOIN: Chain = {
  id: 'bip122:000000000019d6689c085ae165831e93',
  name: 'Bitcoin',
  rpcUrl: '',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function testEthMainnet() {
  assert(ETH_MAINNET.name === 'Ethereum', 'name');
  assert(ETH_MAINNET.rpcUrl.startsWith('https'), 'rpcUrl should be https');
  assert(ETH_MAINNET.nativeCurrency?.symbol === 'ETH', 'symbol should be ETH');
  assert(ETH_MAINNET.nativeCurrency?.decimals === 18, 'decimals should be 18');
  assert(ETH_MAINNET.id === 'eip155:1', 'CAIP-2 id');
  assert(ETH_MAINNET.explorerUrl?.includes('etherscan'), 'explorer URL');
  console.log('✓ ETH mainnet');
}

function testArbitrum() {
  assert(ARBITRUM.id === 'eip155:42161', 'Arbitrum chain id');
  assert(ARBITRUM.name === 'Arbitrum One', 'Arbitrum name');
  assert(ARBITRUM.nativeCurrency?.symbol === 'ETH', 'Arb uses ETH');
  console.log('✓ Arbitrum');
}

function testBase() {
  assert(BASE.id === 'eip155:8453', 'Base chain id');
  assert(BASE.rpcUrl.includes('base.org'), 'Base RPC URL');
  assert(BASE.nativeCurrency?.symbol === 'ETH', 'Base uses ETH');
  console.log('✓ Base');
}

function testPolygon() {
  assert(POLYGON.id === 'eip155:137', 'Polygon chain id');
  assert(POLYGON.nativeCurrency?.symbol === 'MATIC', 'Polygon uses MATIC');
  console.log('✓ Polygon');
}

function testOptimism() {
  assert(OPTIMISM.id === 'eip155:10', 'Optimism chain id');
  assert(OPTIMISM.nativeCurrency?.symbol === 'ETH', 'Optimism uses ETH');
  console.log('✓ Optimism');
}

function testBSC() {
  assert(BSC.id === 'eip155:56', 'BSC chain id');
  assert(BSC.nativeCurrency?.symbol === 'BNB', 'BSC uses BNB');
  console.log('✓ BSC');
}

function testAvalanche() {
  assert(AVALANCHE.id === 'eip155:43114', 'Avalanche chain id');
  assert(AVALANCHE.nativeCurrency?.symbol === 'AVAX', 'AVAX uses AVAX');
  console.log('✓ Avalanche');
}

function testNonEVMChains() {
  assert(SOLANA.id.startsWith('solana:'), 'Solana CAIP-2 namespace');
  assert(BITCOIN.id.startsWith('bip122:'), 'Bitcoin CAIP-2 namespace');
  console.log('✓ Non-EVM chains');
}

function testChainNamespace() {
  const namespaces: ChainNamespace[] = [
    'eip155', 'solana', 'bip121', 'bip122', 'tron', 'ton', 'polkadot',
  ];
  assert(namespaces.length === 7, '7 namespaces defined');
  assert(namespaces.includes('eip155'), 'eip155 present');
  assert(namespaces.includes('solana'), 'solana present');
  assert(namespaces.includes('ton'), 'ton present');
  console.log('✓ ChainNamespace types');
}

function testChainReference() {
  const ref: ChainReference = { namespace: 'eip155', reference: '1' };
  assert(ref.namespace === 'eip155', 'namespace');
  assert(ref.reference === '1', 'reference');
  console.log('✓ ChainReference');
}

function testChainRegistryLookup() {
  // Simulate a chain registry lookup
  const registry: Record<string, Chain> = {
    '1': ETH_MAINNET,
    '42161': ARBITRUM,
    '8453': BASE,
    '137': POLYGON,
    '10': OPTIMISM,
    '56': BSC,
    '43114': AVALANCHE,
  };

  // Extract numeric chainId from CAIP-2 id
  function getChainById(chainId: string): Chain | undefined {
    const num = chainId.split(':').pop();
    return registry[num!];
  }

  assert(getChainById('eip155:1')?.name === 'Ethereum', 'lookup ETH');
  assert(getChainById('eip155:42161')?.name === 'Arbitrum One', 'lookup ARB');
  assert(getChainById('eip155:8453')?.name === 'Base', 'lookup BASE');
  assert(getChainById('eip155:999') === undefined, 'unknown chain');
  console.log('✓ Chain registry lookup');
}

function testAllChainsHaveRequiredFields() {
  const chains = [ETH_MAINNET, ARBITRUM, BASE, POLYGON, OPTIMISM, BSC, AVALANCHE, SOLANA, BITCOIN];
  for (const chain of chains) {
    assert(!!chain.id, `${chain.name} should have id`);
    assert(!!chain.name, `${chain.name} should have name`);
    assert(!!chain.rpcUrl || chain.rpcUrl === '', `${chain.name} should have rpcUrl`);
    assert(!!chain.nativeCurrency, `${chain.name} should have nativeCurrency`);
    assert(typeof chain.nativeCurrency!.decimals === 'number', `${chain.name} decimals should be number`);
  }
  console.log('✓ All chains have required fields');
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run() {
  const tests = [
    testEthMainnet,
    testArbitrum,
    testBase,
    testPolygon,
    testOptimism,
    testBSC,
    testAvalanche,
    testNonEVMChains,
    testChainNamespace,
    testChainReference,
    testChainRegistryLookup,
    testAllChainsHaveRequiredFields,
  ];

  let passed = 0;
  let failed = 0;

  for (const fn of tests) {
    try {
      fn();
      passed++;
    } catch (e: any) {
      console.error(`✗ ${fn.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed (${tests.length} total)`);
  if (failed > 0) process.exit(1);
}

run();
