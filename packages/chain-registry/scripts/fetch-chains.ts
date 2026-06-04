/**
 * fetch-chains.ts — Fetches chain data from chainid.network and generates src/chains.ts.
 *
 * Usage: pnpm fetch-chains
 *
 * This script:
 * 1. Downloads chains.json from chainid.network
 * 2. Filters to EVM chains (chainId fits in uint256, has at least 1 RPC URL, not deprecated)
 * 3. Categorizes each chain
 * 4. Generates a TypeScript file with 100+ chain entries
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, '..', 'src', 'chains.ts');

const CHAINLIST_URL = 'https://chainid.network/chains.json';

/** Known L2 / sidechain identifiers for category detection. */
const L2_PATTERNS = ['arbitrum', 'optimism', 'base', 'zksync', 'scroll', 'linea', 'polygon zkevm', 'mantle', 'blast', 'mode', 'fraxtal', 'lyra', 'orderly', 'lisk', 'kroma', 'manta', 'metal', 'zora', 'ancient8', 'bob', 'cyber', 'degen', 'ink', 'sophon', 'swell', 'taiko', 'unichain', 'world chain', 'real', 'xai', 'zklink', 'zircuit', 'corn', 'soneium', 'shape', 'abstract', 'blessed', 'camp', 'lumia'];
const SIDECHAIN_PATTERNS = ['palm', 'ronin', 'immutable', 'skale', 'avalanche', 'harmony', 'aurora', 'moonbeam', 'moonriver', 'fuse', 'celo', 'gnosis', 'syscoin', 'emerald', 'metis', 'boba', 'evmos', 'milkomeda', 'astar', 'shiden', 'dogechain', 'godwoken', 'oasys', 'wanchain', 'theta', 'vechain', 'telos', 'wemix', 'kava', 'cronos', 'step', 'rsk', 'rootstock', 'elastos', 'karura', 'acala', 'clover'];
const GAMING_PATTERNS = ['degen', 'xai', 'playdapp', 'treasure', 'fun', 'game', 'gaming', 'immortal', 'nakachain', 'polygon supernet', 'tiltyard'];
const DEFI_PATTERNS = ['mantle', 'frax', 'fraxtal', 'lyra', 'sommelier', 'real', 'linea'];

function getCategory(name: string, parentType?: string): 'l2' | 'sidechain' | 'testnet' | 'mainnet' | 'gaming' | 'defi' {
  const lower = name.toLowerCase();

  // Check gaming first (overlaps with L2)
  if (GAMING_PATTERNS.some(p => lower.includes(p))) return 'gaming';
  // Check DeFi
  if (DEFI_PATTERNS.some(p => lower.includes(p))) return 'defi';
  // Check L2
  if (parentType === 'L2' || L2_PATTERNS.some(p => lower.includes(p))) return 'l2';
  // Check sidechain
  if (SIDECHAIN_PATTERNS.some(p => lower.includes(p))) return 'sidechain';
  // Testnets
  if (lower.includes('testnet') || lower.includes('testnet') || lower.includes('devnet') || lower.includes('test') || lower.includes('goerli') || lower.includes('sepolia') || lower.includes('holesky') || lower.includes('mumbai') || lower.includes('amoy') || lower.includes('fuji') || lower.includes('tbsc') || lower.includes('bnbt') || lower.includes('taiko') && lower.includes('alpha') || lower.includes('alpha') || lower.includes('beta') || lower.includes('jove') || lower.includes('staging') || lower.includes('canary') || lower.includes('volta') || lower.includes('baobab') || lower.includes('alfajores')) return 'testnet';

  return 'mainnet';
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

interface ChainSource {
  name: string;
  chain: string;
  chainId: number;
  shortName: string;
  networkId?: number;
  nativeCurrency?: { name: string; symbol: string; decimals: number };
  rpc?: string[];
  rpcUrls?: string[];
  explorers?: { url: string }[];
  infoURL?: string;
  status?: string;
  parent?: { type: string };
}

async function fetchChains(): Promise<ChainSource[]> {
  const res = await fetch(CHAINLIST_URL);
  if (!res.ok) throw new Error(`Failed to fetch chains: ${res.status} ${res.statusText}`);
  return res.json();
}

function generate(chains: ChainSource[]): string {
  // Filter: must have chainId, at least 1 RPC URL, not deprecated
  const valid = chains.filter(c => {
    if (!c.chainId) return false;
    const rpcs = c.rpc ?? [];
    if (rpcs.length === 0) return false;
    if (c.status === 'deprecated') return false;
    return true;
  });

  // Sort by chainId ascending
  valid.sort((a, b) => a.chainId - b.chainId);

  // Take up to 150 to keep file manageable
  const selected = valid.slice(0, 150);

  const entries = selected.map(c => {
    const rpcs = (c.rpc ?? []).filter((r: string) => !r.includes('${'));
    const explorer = c.explorers?.[0]?.url ?? '';
    const parentType = c.parent?.type;
    const category = getCategory(c.name, parentType);
    const testnet = category === 'testnet';
    const native = c.nativeCurrency ?? { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
    const icon = c.infoURL ? c.infoURL.replace(/^https?:\/\//, '').split('/')[0] : '';

    return `  {
    id: ${c.chainId},
    name: '${escapeString(c.name)}',
    shortName: '${escapeString(c.shortName || c.chain)}',
    rpcUrls: [${rpcs.slice(0, 5).map((r: string) => `'${escapeString(r)}'`).join(', ')}],
    nativeCurrency: { name: '${escapeString(native.name)}', symbol: '${escapeString(native.symbol)}', decimals: ${native.decimals} },
    blockExplorer: '${escapeString(explorer)}',
    icon: '${escapeString(icon)}',
    testnet: ${testnet},
    category: '${category}' as const,
  }`;
  });

  const header = `/**
 * EVM Chain Registry — Auto-generated from chainid.network.
 *
 * DO NOT EDIT MANUALLY. Run \`pnpm fetch-chains\` to regenerate.
 *
 * Generated: ${new Date().toISOString()}
 * Chain count: ${selected.length}
 */

import type { ChainRegistryEntry, ChainCategory } from './types.js';

/* ------------------------------------------------------------------ */
/*  Chain Registry Data                                                */
/* ------------------------------------------------------------------ */

export const CHAIN_REGISTRY: ChainRegistryEntry[] = [
${entries.join(',\n')}
];

/* ------------------------------------------------------------------ */
/*  Lookup Maps                                                        */
/* ------------------------------------------------------------------ */

/** Map from numeric chain ID to registry entry. */
export const CHAIN_BY_ID: Map<number, ChainRegistryEntry> = new Map(
  CHAIN_REGISTRY.map(c => [c.id, c])
);

/** Map from lowercase chain name to registry entry. */
export const CHAIN_BY_NAME: Map<string, ChainRegistryEntry> = new Map(
  CHAIN_REGISTRY.map(c => [c.name.toLowerCase(), c])
);

/* ------------------------------------------------------------------ */
/*  Search & Filter Helpers                                            */
/* ------------------------------------------------------------------ */

/** Search chains by name or shortName (fuzzy match). */
export function searchChains(query: string): ChainRegistryEntry[] {
  const q = query.toLowerCase();
  return CHAIN_REGISTRY.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.category.includes(q) ||
      String(c.id).includes(q),
  );
}

/** Get all chains matching a category. */
export function getChainsByCategory(category: ChainCategory): ChainRegistryEntry[] {
  return CHAIN_REGISTRY.filter(c => c.category === category);
}
`;

  return header;
}

async function main() {
  console.log('🔗 Fetching chain data from chainid.network...');
  const chains = await fetchChains();
  console.log(`📦 Received ${chains.length} chains`);

  const output = generate(chains);
  writeFileSync(OUT_FILE, output, 'utf-8');

  const lines = output.split('\n').length;
  console.log(`✅ Generated ${OUT_FILE} (${lines} lines)`);

  // Count
  const count = (output.match(/id: \d+/g) ?? []).length;
  console.log(`📊 Total chains in registry: ${count}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
