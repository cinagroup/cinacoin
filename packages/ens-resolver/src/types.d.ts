/**
 * ENS Resolver Types
 */
export interface ENSRecord {
    key: string;
    value: string;
}
export interface ENSProfile {
    address: string | null;
    name: string | null;
    avatar: string | null;
    url: string | null;
    description: string | null;
    email: string | null;
    github: string | null;
    twitter: string | null;
    discord: string | null;
    records: ENSRecord[];
}
export interface ENSResolverConfig {
    /** Ethereum RPC URL or viem client */
    rpcUrl?: string;
    /** Cache TTL in milliseconds (default: 5 minutes) */
    cacheTtlMs?: number;
    /** Maximum cache entries (default: 1000) */
    maxCacheEntries?: number;
    /** Chain ID for ENS (default: 1 for mainnet) */
    chainId?: number;
}
export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}
export interface ENSContracts {
    registry: string;
    resolver: string;
    reverseRegistrar: string;
}
export type ChainId = 1 | 11155111 | 10 | 137 | 8453 | 42161;
export declare const ENS_CHAIN_CONFIG: Record<ChainId, ENSContracts>;
export declare const ENS_ERRORS: {
    readonly RESOLVE_FAILED: "ENS_RESOLVE_FAILED";
    readonly LOOKUP_FAILED: "ENS_LOOKUP_FAILED";
    readonly AVATAR_NOT_FOUND: "ENS_AVATAR_NOT_FOUND";
    readonly INVALID_NAME: "ENS_INVALID_NAME";
    readonly INVALID_ADDRESS: "ENS_INVALID_ADDRESS";
    readonly RPC_ERROR: "ENS_RPC_ERROR";
    readonly CACHE_ERROR: "ENS_CACHE_ERROR";
};
export type ENSErrorCode = (typeof ENS_ERRORS)[keyof typeof ENS_ERRORS];
export declare class ENSResolverError extends Error {
    code: ENSErrorCode;
    details?: unknown;
    constructor(code: ENSErrorCode, message: string, details?: unknown);
}
//# sourceMappingURL=types.d.ts.map