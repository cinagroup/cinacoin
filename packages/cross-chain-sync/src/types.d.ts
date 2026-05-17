/**
 * Cross-Chain Sync Type Definitions
 */
/** Supported chain families */
export type ChainFamily = "evm" | "solana" | "bitcoin" | "ton" | "tron" | "polkadot";
/** Base account info for any chain */
export interface ChainAccount {
    chain: ChainFamily;
    chainId?: number;
    address: string;
    label?: string;
    addedAt: number;
    lastSyncedAt?: number;
}
/** Unified identity across chains */
export interface UnifiedIdentity {
    /** Unique user identity hash */
    identityHash: string;
    /** Linked accounts */
    accounts: ChainAccount[];
    /** Primary account (user-designated) */
    primaryAccount?: ChainAccount;
    /** Metadata */
    metadata: Record<string, string>;
    /** Created timestamp */
    createdAt: number;
    /** Last updated timestamp */
    updatedAt: number;
}
/** Cross-chain state to sync */
export interface CrossChainState {
    identity: UnifiedIdentity;
    /** Session state per chain */
    sessions: Record<string, SessionState>;
    /** Preferences */
    preferences: Record<string, string>;
    /** Last sync timestamp */
    lastSyncedAt: number;
}
/** Session state on a specific chain */
export interface SessionState {
    chain: ChainFamily;
    chainId?: number;
    address: string;
    /** Session key (if using session keys) */
    sessionKey?: string;
    /** Session expiry */
    expiresAt: number;
    /** Arbitrary data */
    data: Record<string, string>;
}
/** Sync result */
export interface SyncResult {
    success: boolean;
    syncedChains: ChainFamily[];
    failedChains: ChainFamily[];
    errors: Record<string, string>;
    syncedAt: number;
}
/** Linking proof — evidence that two accounts belong to the same user */
export interface LinkingProof {
    /** Primary account address */
    sourceAddress: string;
    /** Source chain */
    sourceChain: ChainFamily;
    /** Target account address */
    targetAddress: string;
    /** Target chain */
    targetChain: ChainFamily;
    /** Signature proving ownership */
    signature: string;
    /** Message that was signed */
    message: string;
    /** Timestamp */
    createdAt: number;
}
/** Storage backend interface */
export interface StateStorage {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map