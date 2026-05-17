/**
 * XRPL network identifiers used across wallet connectors.
 */
export type XrplNetwork = 'mainnet' | 'testnet' | 'devnet' | 'amm-devnet';
/**
 * Supported feature flags that an XRPL connector may advertise.
 */
export type XrplFeature = 'xrpl:connect' | 'xrpl:signTransaction' | 'xrpl:sendXRP' | 'xrpl:getBalance' | 'xrpl:accountSettings' | 'xrpl:trustLine' | 'xrpl:nftMint' | 'xrpl:nftBurn' | 'xrpl:signMessage' | 'xrpl:switchNetwork';
/**
 * Platform environments a connector may run in.
 */
export type XrplPlatform = 'browser' | 'mobile' | 'extension' | 'hardware';
/**
 * Shape of an XRPL provider injected by a wallet extension or app.
 *
 * Each wallet (Xaman/Xumm, Fireblocks, Ledger) exposes a slightly
 * different API; this interface captures the minimal common surface.
 */
export interface XrplProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    isXaman?: boolean;
    isFireblocks?: boolean;
    isLedger?: boolean;
}
/**
 * Map of connector lifecycle and state-change events.
 */
export interface XrplConnectorEvents {
    accountsChanged: (accounts: string[]) => void;
    networkChanged: (network: string) => void;
    disconnect: (error?: Error) => void;
}
/**
 * Connection result returned from {@link XrplConnector.connect}.
 */
export interface XrplConnectionResult {
    /** Connected XRPL classic address(es), e.g. "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH" */
    accounts: string[];
    /** Network the wallet is on */
    network: XrplNetwork;
    /** Raw provider reference */
    provider?: XrplProvider;
}
/**
 * XRP send parameters.
 */
export interface XrpSendParams {
    /** Recipient classic address */
    destination: string;
    /** Amount in drops (1 XRP = 1,000,000 drops) */
    amount: string;
    /** Optional destination tag */
    destinationTag?: number;
    /** Optional memo */
    memo?: string;
}
/**
 * Account settings update parameters.
 */
export interface AccountSettingsParams {
    /** Require a destination tag for incoming payments */
    requireDestTag?: boolean;
    /** Require authorization for trust lines */
    requireAuth?: boolean;
    /** Disallow incoming XRP */
    disallowIncomingXrp?: boolean;
    /** Set the account's domain */
    domain?: string;
    /** Set the account's email hash */
    emailHash?: string;
    /** Set a new regular key */
    regularKey?: string;
    /** Set the transfer fee (basis points, 0-50000) */
    transferFee?: number;
    /** Set the mint flag on an issued currency */
    mintFlag?: boolean;
    /** Set the freeze flag on an issued currency */
    freezeFlag?: boolean;
    /** Enable the No Free flag */
    noFreezeFlag?: boolean;
    /** Enable the default ripple flag */
    defaultRippleFlag?: boolean;
    /** Enable the deposit auth flag */
    depositAuthFlag?: boolean;
    /** Enable the disallow incoming flag */
    disallowIncomingFlag?: boolean;
}
/**
 * Trust line parameters.
 */
export interface TrustLineParams {
    /** Counterparty classic address */
    counterparty: string;
    /** Currency code (3-letter or 40-char hex) */
    currency: string;
    /** Maximum amount to trust */
    limit: string;
    /** Optional quality settings */
    qualityIn?: number;
    qualityOut?: number;
}
/**
 * NFT minting parameters.
 */
export interface NftMintParams {
    /** NFT token taxon (arbitrary identifier, 0-2^32-1) */
    tokenTaxon: number;
    /** URI of the NFT content (hex-encoded) */
    uri?: string;
    /** Transfer fee (basis points, 0-50000) */
    transferFee?: number;
    /** NFT flags (bitmask) */
    flags?: number;
}
/**
 * NFT burning parameters.
 */
export interface NftBurnParams {
    /** NFT ID (hex string) */
    nftId: string;
}
/**
 * Core interface every XRPL wallet connector must implement.
 *
 * Modeled after the EIP-6963 discovery pattern, extended with
 * XRPL-native methods (sendXRP, trustLine, nftMint, etc.).
 */
export interface XrplConnector {
    /** Unique machine-readable id (e.g. "xaman", "fireblocks", "ledger") */
    id: string;
    /** Human-readable display name */
    name: string;
    /** Icon — SVG data URI, URL, or emoji */
    icon: string;
    /** Environments this connector works in */
    platforms: XrplPlatform[];
    /** Feature flags this connector supports */
    supportedFeatures: XrplFeature[];
    connect(params?: {
        network?: XrplNetwork;
    }): Promise<XrplConnectionResult>;
    disconnect(): Promise<void>;
    request<T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }): Promise<T>;
    getAccounts(): Promise<string[]>;
    getNetwork(): Promise<XrplNetwork>;
    switchNetwork(network: XrplNetwork): Promise<void>;
    isAvailable(): boolean;
    /**
     * Sign an XRPL transaction.
     * @param params Serialized transaction JSON
     * @returns Signed transaction
     */
    signTransaction(params: {
        transaction: Record<string, unknown>;
    }): Promise<{
        signedTransaction: Record<string, unknown>;
        txBlob: string;
    }>;
    /**
     * Send XRP to another address.
     */
    sendXRP(params: XrpSendParams): Promise<{
        transactionHash: string;
    }>;
    /**
     * Get the XRP balance of an account.
     * @param address Classic address (defaults to connected account if omitted)
     * @returns Balance in drops
     */
    getBalance(address?: string): Promise<{
        balance: string;
        unit: 'drops';
    }>;
    /**
     * Update account settings.
     */
    updateAccountSettings(params: AccountSettingsParams): Promise<{
        transactionHash: string;
    }>;
    /**
     * Set or remove a trust line.
     */
    setTrustLine(params: TrustLineParams): Promise<{
        transactionHash: string;
    }>;
    /**
     * Mint a new NFT on the XRP Ledger.
     */
    mintNFT(params: NftMintParams): Promise<{
        nftId: string;
        transactionHash: string;
    }>;
    /**
     * Burn an NFT on the XRP Ledger.
     */
    burnNFT(params: NftBurnParams): Promise<{
        transactionHash: string;
    }>;
    on<E extends keyof XrplConnectorEvents>(event: E, handler: XrplConnectorEvents[E]): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off<E extends keyof XrplConnectorEvents>(event: E, handler: XrplConnectorEvents[E]): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
}
/**
 * Map of connector id → connector instance for registry patterns.
 */
export type XrplConnectorRegistry = Map<string, XrplConnector>;
/**
 * EIP-6963–style provider announcement payload for XRPL wallets.
 */
export interface EIP6963XrplProviderDetail {
    info: {
        uuid: string;
        name: string;
        icon: string;
        rdns: string;
    };
    provider: XrplProvider;
}
//# sourceMappingURL=types.d.ts.map