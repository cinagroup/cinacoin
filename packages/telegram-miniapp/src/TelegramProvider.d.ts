/**
 * Telegram WebApp wallet provider.
 *
 * Adapts the Telegram WebApp environment to the EIP-1193 provider interface,
 * enabling wallet operations inside Telegram Mini Apps.
 *
 * @packageDocumentation
 */
import type { TelegramProviderConfig, TelegramWebAppData, TelegramUser, TelegramWalletState } from './types.js';
/**
 * TelegramProvider adapts Telegram WebApp to a wallet provider interface.
 *
 * It parses initData, extracts user info, and provides EIP-1193-compatible
 * request handling for wallet operations within Telegram Mini Apps.
 */
export declare class TelegramProvider {
    /** Telegram WebApp instance (may be mocked). */
    private _webApp;
    /** Parsed WebApp data. */
    private _data;
    /** Whether the provider has been initialized. */
    private _initialized;
    /** Whether the provider is ready. */
    private _ready;
    /** Currently connected wallet address. */
    private _account;
    /** Current chain ID. */
    private _chainId;
    /** Current wallet state. */
    private _state;
    /** Event listeners. */
    private _listeners;
    /** Supported chains. */
    private readonly _chains;
    /** App name. */
    readonly appName: string;
    /** RPC URL. */
    private readonly _rpcUrl?;
    constructor(config?: TelegramProviderConfig);
    /** Initialize the provider (legacy API). */
    initialize(): Promise<boolean>;
    /** Initialize the provider (new API). */
    init(): Promise<TelegramWebAppData | null>;
    /** Check if the provider is available. */
    isAvailable(): boolean;
    /** Check if initialized. */
    isInitialized(): boolean;
    /** Connect the wallet. */
    connect(account: `0x${string}`, chainId?: number): TelegramWalletState;
    /** Disconnect the wallet. */
    disconnect(): void;
    /** Get current connection state. */
    getState(): TelegramWalletState;
    /** Get parsed Telegram WebApp data. */
    get webAppData(): TelegramWebAppData | null;
    /** Get the Telegram user. */
    get user(): TelegramUser | null;
    /** Get raw user from webApp initDataUnsafe (before initialization). */
    private _getRawUser;
    /** Get user data (legacy API). */
    getUser(): TelegramUser | undefined;
    /** Get display name. */
    getDisplayName(): string;
    /** Get user ID. */
    getUserId(): number | undefined;
    /** Check if premium user. */
    isPremiumUser(): boolean;
    getColorScheme(): 'light' | 'dark';
    getPlatform(): string;
    getVersion(): string;
    /** Get the current account address. */
    get account(): `0x${string}` | null;
    /** Get the current chain ID. */
    get chainId(): number;
    /** Check if running inside Telegram. */
    get isInTelegram(): boolean;
    /** Check if ready. */
    get isReady(): boolean;
    /** Get Farcaster context (always null for Telegram). */
    get context(): null;
    /** Check if running inside Farcaster. */
    get isInFarcaster(): boolean;
    getInitData(): string;
    getRpcUrl(): string;
    getChainId(): number;
    setAccount(address: `0x${string}`): void;
    switchChain(chainId: number): void;
    getSupportedChains(): number[];
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    showAlert(message: string): void;
    showConfirm(message: string): Promise<boolean>;
    openLink(url: string): void;
    openTelegramLink(url: string): void;
    triggerHaptic(type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy'): void;
    hapticImpact(style?: string): void;
    hapticNotification(type?: string): void;
    closeApp(): void;
    /** Close the Telegram Mini App (alias). */
    close(): void;
    setMainButtonText(text: string): void;
    showMainButton(): void;
    hideMainButton(): void;
    onMainButtonClick(callback: () => void): void;
    on(event: string, callback: (...args: unknown[]) => void): () => void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    private _detectWebApp;
    private _parseInitData;
    private _handleRequestAccounts;
    private _handleAccounts;
    private _emit;
}
//# sourceMappingURL=TelegramProvider.d.ts.map