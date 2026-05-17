/**
 * MockChains — Pre-built mock chain configurations for testing.
 *
 * Provides realistic chain data (mainnet, testnets, L2s) and a utility
 * to generate arbitrary chain configs.
 */
export interface ChainConfig {
    id: number;
    idHex: string;
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrl?: string;
}
export declare const MOCK_CHAINS: Record<string, ChainConfig>;
/** Get chain by id (number or hex string) */
export declare function getChainById(id: number | string): ChainConfig | undefined;
/** Get chain by key name */
export declare function getChainByKey(key: string): ChainConfig | undefined;
/** Generate a custom chain config */
export declare function createMockChain(overrides: Partial<ChainConfig> & {
    id: number;
    name: string;
}): ChainConfig;
/** Return all chain configs as an array */
export declare function allMockChains(): ChainConfig[];
//# sourceMappingURL=MockChains.d.ts.map