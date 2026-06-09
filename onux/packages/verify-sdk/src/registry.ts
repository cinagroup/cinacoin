/**
 * @module registry
 * KnownDAppRegistry — curated registry of verified dApps across categories.
 */

import type { KnownDAppEntry, DAppCategory, DAppSearchFilters } from './types';

// ─── Registry Data (50+ verified dApps) ──────────────────────────────────────────

const KNOWN_DAPPS: KnownDAppEntry[] = [
  // ── DEX ──
  {
    name: 'Uniswap',
    domain: 'app.uniswap.org',
    chainIds: [1, 10, 56, 137, 42161, 8453, 43114],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://github.com/Uniswap/v3-core/tree/main/audits',
    contracts: {
      1: ['0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'],
      137: ['0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'],
    },
  },
  {
    name: 'PancakeSwap',
    domain: 'pancakeswap.finance',
    chainIds: [56, 1, 43114],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://docs.pancakeswap.finance/code/security',
  },
  {
    name: 'SushiSwap',
    domain: 'sushi.com',
    chainIds: [1, 137, 42161, 43114],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://github.com/sushiswap/sushiswap/tree/develop/audits',
  },
  {
    name: 'Curve Finance',
    domain: 'curve.fi',
    chainIds: [1, 10, 42161],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://curve.fi/audits',
  },
  {
    name: 'Trader Joe',
    domain: 'traderjoexyz.com',
    chainIds: [43114, 1],
    category: 'dex',
    isOfficial: true,
  },
  {
    name: 'QuickSwap',
    domain: 'quickswap.exchange',
    chainIds: [137],
    category: 'dex',
    isOfficial: true,
  },
  {
    name: 'Balancer',
    domain: 'balancer.fi',
    chainIds: [1, 42161, 137],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/audits',
  },
  {
    name: 'GMX',
    domain: 'gmx.io',
    chainIds: [42161, 43114],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://gmx.io/audits',
  },
  {
    name: 'Stargate Finance',
    domain: 'stargate.finance',
    chainIds: [1, 10, 56, 137, 42161, 43114],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://stargateprotocol.gitbook.io/stargate/security/audits',
  },
  {
    name: 'Raydium',
    domain: 'raydium.io',
    chainIds: [101], // Solana
    category: 'dex',
    isOfficial: true,
  },

  // ── Lending ──
  {
    name: 'Aave',
    domain: 'aave.com',
    chainIds: [1, 137, 43114, 42161, 10],
    category: 'lending',
    isOfficial: true,
    auditUrl: 'https://docs.aave.com/developers/security-and-audits',
  },
  {
    name: 'Compound',
    domain: 'compound.finance',
    chainIds: [1],
    category: 'lending',
    isOfficial: true,
    auditUrl: 'https://compound.finance/docs/security',
  },
  {
    name: 'MakerDAO',
    domain: 'makerdao.com',
    chainIds: [1],
    category: 'lending',
    isOfficial: true,
    auditUrl: 'https://security.makerdao.com/',
  },
  {
    name: 'Liquity',
    domain: 'liquity.org',
    chainIds: [1],
    category: 'lending',
    isOfficial: true,
    auditUrl: 'https://github.com/liquity/dev/tree/main/audits',
  },
  {
    name: 'Frax Finance',
    domain: 'frax.finance',
    chainIds: [1, 42161, 43114, 137],
    category: 'lending',
    isOfficial: true,
  },
  {
    name: 'Reflexer',
    domain: 'reflexer.finance',
    chainIds: [1],
    category: 'lending',
    isOfficial: true,
  },
  {
    name: 'Benqi',
    domain: 'benqi.fi',
    chainIds: [43114],
    category: 'lending',
    isOfficial: true,
  },
  {
    name: 'Euler Finance',
    domain: 'euler.finance',
    chainIds: [1],
    category: 'lending',
    isOfficial: true,
  },
  {
    name: 'Morpho',
    domain: 'morpho.org',
    chainIds: [1],
    category: 'lending',
    isOfficial: true,
    auditUrl: 'https://docs.morpho.org/morpho/developers/audits',
  },
  {
    name: 'Radiant Capital',
    domain: 'radiant.capital',
    chainIds: [1, 42161, 56],
    category: 'lending',
    isOfficial: true,
  },

  // ── NFT ──
  {
    name: 'OpenSea',
    domain: 'opensea.io',
    chainIds: [1, 137, 42161],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'Blur',
    domain: 'blur.io',
    chainIds: [1],
    category: 'nft',
    isOfficial: true,
    auditUrl: 'https://blur.io/audits',
  },
  {
    name: 'Rarible',
    domain: 'rarible.com',
    chainIds: [1, 137],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'Foundation',
    domain: 'foundation.app',
    chainIds: [1],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'Zora',
    domain: 'zora.co',
    chainIds: [1, 8453],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'Magic Eden',
    domain: 'magiceden.io',
    chainIds: [1399811149, 1, 56],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'LooksRare',
    domain: 'looksrare.org',
    chainIds: [1],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'X2Y2',
    domain: 'x2y2.io',
    chainIds: [1],
    category: 'nft',
    isOfficial: true,
  },
  {
    name: 'Element Market',
    domain: 'element.market',
    chainIds: [1, 56, 137],
    category: 'nft',
    isOfficial: true,
  },

  // ── Bridge ──
  {
    name: 'Hop Protocol',
    domain: 'hop.exchange',
    chainIds: [1, 10, 42161, 137],
    category: 'bridge',
    isOfficial: true,
    auditUrl: 'https://github.com/hop-protocol/hop/tree/master/audits',
  },
  {
    name: 'Across Protocol',
    domain: 'across.to',
    chainIds: [1, 10, 42161, 8453],
    category: 'bridge',
    isOfficial: true,
  },
  {
    name: 'Synapse Protocol',
    domain: 'synapseprotocol.com',
    chainIds: [1, 56, 43114, 42161, 42220],
    category: 'bridge',
    isOfficial: true,
    auditUrl: 'https://synapseprotocol.com/audits',
  },
  {
    name: 'Wormhole',
    domain: 'wormhole.com',
    chainIds: [1, 43114, 137, 42161, 56],
    category: 'bridge',
    isOfficial: true,
    auditUrl: 'https://github.com/wormhole-foundation/wormhole/blob/main/README.md#security',
  },
  {
    name: 'LayerZero',
    domain: 'layerzero.network',
    chainIds: [1, 56, 137, 43114, 42161, 42220],
    category: 'bridge',
    isOfficial: true,
  },
  {
    name: 'Orbiter Finance',
    domain: 'orbiter.finance',
    chainIds: [1, 10, 42161, 8453],
    category: 'bridge',
    isOfficial: true,
  },
  {
    name: 'Celer Network',
    domain: 'cbridge.celer.network',
    chainIds: [1, 56, 137, 42161],
    category: 'bridge',
    isOfficial: true,
  },
  {
    name: 'Axelar',
    domain: 'axelar.network',
    chainIds: [1, 43114, 42161],
    category: 'bridge',
    isOfficial: true,
    auditUrl: 'https://axelar.network/security',
  },
  {
    name: 'deBridge',
    domain: 'debridge.finance',
    chainIds: [1, 56, 43114, 137],
    category: 'bridge',
    isOfficial: true,
  },
  {
    name: 'Stargate',
    domain: 'stargate.finance',
    chainIds: [1, 10, 56, 137, 42161, 43114],
    category: 'bridge',
    isOfficial: true,
  },

  // ── DAO / Governance ──
  {
    name: 'Snapshot',
    domain: 'snapshot.org',
    chainIds: [1, 137, 42161],
    category: 'dao',
    isOfficial: true,
  },
  {
    name: 'Aragon',
    domain: 'aragon.org',
    chainIds: [1, 137],
    category: 'dao',
    isOfficial: true,
    auditUrl: 'https://github.com/aragon/aragon-core',
  },
  {
    name: 'DAOHaus',
    domain: 'daohaus.club',
    chainIds: [1, 42161],
    category: 'dao',
    isOfficial: true,
  },
  {
    name: 'Tally',
    domain: 'tally.xyz',
    chainIds: [1],
    category: 'dao',
    isOfficial: true,
  },
  {
    name: 'Boardroom',
    domain: 'boardroom.info',
    chainIds: [1, 137],
    category: 'dao',
    isOfficial: true,
  },
  {
    name: 'Commonwealth',
    domain: 'commonwealth.im',
    chainIds: [1],
    category: 'dao',
    isOfficial: true,
  },

  // ── Liquid Staking / Yield ──
  {
    name: 'Lido',
    domain: 'lido.fi',
    chainIds: [1, 137, 100],
    category: 'dao',
    isOfficial: true,
    auditUrl: 'https://github.com/lidofinance/audits',
  },
  {
    name: 'Rocket Pool',
    domain: 'rocketpool.net',
    chainIds: [1],
    category: 'dao',
    isOfficial: true,
    auditUrl: 'https://github.com/rocket-pool/rocketpool/tree/master/audits',
  },
  {
    name: 'Convex Finance',
    domain: 'convex.finance',
    chainIds: [1],
    category: 'dex',
    isOfficial: true,
  },
  {
    name: 'Yearn Finance',
    domain: 'yearn.finance',
    chainIds: [1, 42161],
    category: 'dao',
    isOfficial: true,
    auditUrl: 'https://github.com/yearn/yearn-security/tree/master/audits',
  },
  {
    name: 'Olympus DAO',
    domain: 'olympusdao.finance',
    chainIds: [1, 42161],
    category: 'dao',
    isOfficial: true,
  },
  {
    name: 'dYdX',
    domain: 'dydx.exchange',
    chainIds: [1],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://dydx.exchange/security',
  },
  {
    name: '1inch',
    domain: 'app.1inch.io',
    chainIds: [1, 56, 137, 42161, 10, 43114],
    category: 'dex',
    isOfficial: true,
    auditUrl: 'https://1inch.io/audits',
  },
  {
    name: 'Gitcoin',
    domain: 'gitcoin.co',
    chainIds: [1],
    category: 'dao',
    isOfficial: true,
  },

  // ── Gaming ──
  {
    name: 'Axie Infinity',
    domain: 'axieinfinity.com',
    chainIds: [1, 137],
    category: 'game',
    isOfficial: true,
  },
  {
    name: 'The Sandbox',
    domain: 'sandbox.game',
    chainIds: [1, 137],
    category: 'game',
    isOfficial: true,
  },
  {
    name: 'Decentraland',
    domain: 'decentraland.org',
    chainIds: [1, 137],
    category: 'game',
    isOfficial: true,
  },
  {
    name: 'STEPN',
    domain: 'stepn.com',
    chainIds: [56, 1],
    category: 'game',
    isOfficial: true,
  },
  {
    name: 'Gods Unchained',
    domain: 'godsunchained.com',
    chainIds: [1, 137],
    category: 'game',
    isOfficial: true,
  },
  {
    name: 'Illuvium',
    domain: 'illuvium.io',
    chainIds: [1],
    category: 'game',
    isOfficial: true,
  },
];

// ─── KnownDAppRegistry ──────────────────────────────────────────────────────────

export class KnownDAppRegistry {
  /** Internal lookup map: domain → entry. */
  private static _domainMap = new Map<string, KnownDAppEntry>();

  /** Reverse lookup: contract address + chain → entry. */
  private static _contractMap = new Map<string, KnownDAppEntry>();

  static {
    for (const entry of KNOWN_DAPPS) {
      // Domain index
      this._domainMap.set(entry.domain.toLowerCase(), entry);

      // Contract index
      if (entry.contracts) {
        for (const [chainIdStr, addresses] of Object.entries(entry.contracts)) {
          for (const addr of addresses) {
            const key = `${chainIdStr}:${addr.toLowerCase()}`;
            this._contractMap.set(key, entry);
          }
        }
      }
    }
  }

  /**
   * Look up a dApp by its domain.
   */
  static getDAppByDomain(domain: string): KnownDAppEntry | undefined {
    return this._domainMap.get(domain.toLowerCase());
  }

  /**
   * Look up a dApp by contract address and chain ID.
   */
  static getDAppByContract(address: string, chainId: number): KnownDAppEntry | undefined {
    return this._contractMap.get(`${chainId}:${address.toLowerCase()}`);
  }

  /**
   * Search dApps with optional filters.
   */
  static searchDApps(
    query: string = '',
    filters?: DAppSearchFilters
  ): KnownDAppEntry[] {
    let results = [...KNOWN_DAPPS];
    const q = query.toLowerCase().trim();

    if (q) {
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.domain.toLowerCase().includes(q)
      );
    }

    if (filters) {
      if (filters.category !== undefined) {
        results = results.filter((e) => e.category === filters.category);
      }
      if (filters.chainId !== undefined) {
        results = results.filter((e) => e.chainIds.includes(filters.chainId!));
      }
      if (filters.isOfficial !== undefined) {
        results = results.filter((e) => e.isOfficial === filters.isOfficial);
      }
    }

    return results;
  }

  /**
   * Get all dApps in a specific category.
   */
  static getDAppsByCategory(category: DAppCategory): KnownDAppEntry[] {
    return KNOWN_DAPPS.filter((e) => e.category === category);
  }

  /**
   * Get all registered dApps.
   */
  static getAll(): KnownDAppEntry[] {
    return [...KNOWN_DAPPS];
  }

  /**
   * Get count of registered dApps.
   */
  static count(): number {
    return KNOWN_DAPPS.length;
  }

  /**
   * Get all registered categories with counts.
   */
  static getCategoryCounts(): Record<DAppCategory, number> {
    const counts: Record<string, number> = {};
    for (const d of KNOWN_DAPPS) {
      counts[d.category] = (counts[d.category] || 0) + 1;
    }
    return counts as Record<DAppCategory, number>;
  }

  /**
   * Check if a domain is in the registry.
   */
  static isKnownDomain(domain: string): boolean {
    return this._domainMap.has(domain.toLowerCase());
  }

  /**
   * Check if a contract is officially verified.
   */
  static isVerifiedContract(address: string, chainId: number): boolean {
    return this._contractMap.has(`${chainId}:${address.toLowerCase()}`);
  }
}
