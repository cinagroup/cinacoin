/**
 * Hedera network identifiers used across wallet connectors.
 */
export type HederaNetwork = 'mainnet' | 'testnet' | 'previewnet';
/**
 * Supported feature flags that a Hedera connector may advertise.
 */
export type HederaFeature = 'hedera:connect' | 'hedera:signTransaction' | 'hedera:executeTransaction' | 'hedera:getBalance' | 'hedera:transferHbar' | 'hedera:transferToken' | 'hedera:contractCall' | 'hedera:switchNetwork' | 'hedera:signMessage';
/**
 * Platform environments a connector may run in.
 */
export type HederaPlatform = 'browser' | 'mobile' | 'extension';
/**
 * Shape of a Hedera provider injected by a wallet extension.
 *
 * Each wallet (HashPack, Blade, Kantara) exposes a slightly different
 * API; this interface captures the minimal common surface.
 */
export interface HederaProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    isHashPack?: boolean;
    isBlade?: boolean;
    isKantara?: boolean;
}
/**
 * Map of connector lifecycle and state-change events.
 */
export interface HederaConnectorEvents {
    accountsChanged: (accounts: string[]) => void;
    networkChanged: (network: string) => void;
    disconnect: (error?: Error) => void;
}
/**
 * Connection result returned from {@link HederaConnector.connect}.
 */
export interface HederaConnectionResult {
    /** Connected Hedera account ID(s), e.g. "0.0.12345" */
    accounts: string[];
    /** Network the wallet is on */
    network: HederaNetwork;
    /** Raw provider reference */
    provider?: HederaProvider;
}
/**
 * HBAR transfer parameters.
 */
export interface HbarTransferParams {
    /** Recipient account ID or alias */
    recipient: string;
    /** Amount in tinybar */
    amount: string;
    /** Optional memo */
    memo?: string;
}
/**
 * Hedera token (HTS) transfer parameters.
 */
export interface TokenTransferParams {
    /** Token ID, e.g. "0.0.123456" */
    tokenId: string;
    /** Recipient account ID */
    recipient: string;
    /** Amount (atomic units) */
    amount: string;
    /** Optional memo */
    memo?: string;
}
/**
 * Smart contract call parameters.
 */
export interface ContractCallParams {
    /** Contract ID, e.g. "0.0.789012" */
    contractId: string;
    /** Encoded function call data (hex) */
    functionParameters: string;
    /** Optional gas limit (tinybar) */
    gas?: number;
    /** Optional HBAR amount to send with the call */
    amount?: string;
}
/**
 * Core interface every Hedera wallet connector must implement.
 *
 * Modeled after the EIP-6963 discovery pattern, extended with
 * Hedera-native methods (signTransaction, executeTransaction, etc.).
 */
export interface HederaConnector {
    /** Unique machine-readable id (e.g. "hashpack", "blade", "kantara") */
    id: string;
    /** Human-readable display name */
    name: string;
    /** Icon — SVG data URI, URL, or emoji */
    icon: string;
    /** Environments this connector works in */
    platforms: HederaPlatform[];
    /** Feature flags this connector supports */
    supportedFeatures: HederaFeature[];
    connect(params?: {
        network?: HederaNetwork;
    }): Promise<HederaConnectionResult>;
    disconnect(): Promise<void>;
    request<T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }): Promise<T>;
    getAccounts(): Promise<string[]>;
    getNetwork(): Promise<HederaNetwork>;
    switchNetwork(network: HederaNetwork): Promise<void>;
    isAvailable(): boolean;
    /**
     * Sign a Hedera transaction without executing it.
     * @param params Serialized transaction bytes (base64 or hex)
     * @returns Signed transaction bytes
     */
    signTransaction(params: {
        transaction: string;
    }): Promise<{
        signedTransaction: string;
    }>;
    /**
     * Execute a signed transaction on the Hedera network.
     * @param params Serialized signed transaction
     * @returns Transaction receipt / transaction ID
     */
    executeTransaction(params: {
        transaction: string;
    }): Promise<{
        transactionId: string;
    }>;
    /**
     * Get the HBAR balance of an account.
     * @param accountId Account ID (defaults to connected account if omitted)
     * @returns Balance in tinybar
     */
    getBalance(accountId?: string): Promise<{
        balance: string;
        unit: 'tinybar';
    }>;
    /**
     * Transfer HBAR to another account.
     */
    transferHbar(params: HbarTransferParams): Promise<{
        transactionId: string;
    }>;
    /**
     * Transfer an HTS token to another account.
     */
    transferToken(params: TokenTransferParams): Promise<{
        transactionId: string;
    }>;
    /**
     * Call a Hedera smart contract function.
     */
    contractCall(params: ContractCallParams): Promise<{
        transactionId: string;
    }>;
    on<E extends keyof HederaConnectorEvents>(event: E, handler: HederaConnectorEvents[E]): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off<E extends keyof HederaConnectorEvents>(event: E, handler: HederaConnectorEvents[E]): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
}
/**
 * Map of connector id → connector instance for registry patterns.
 */
export type ConnectorRegistry = Map<string, HederaConnector>;
/**
 * EIP-6963–style provider announcement payload for Hedera wallets.
 */
export interface EIP6963HederaProviderDetail {
    info: {
        uuid: string;
        name: string;
        icon: string;
        rdns: string;
    };
    provider: HederaProvider;
}
//# sourceMappingURL=types.d.ts.map