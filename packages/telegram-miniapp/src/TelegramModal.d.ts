/**
 * Telegram-native wallet modal.
 *
 * Displays a wallet connection modal using Telegram's native UI
 * components (MainButton, showAlert, showConfirm) for a seamless
 * Mini App experience.
 */
import type { TelegramWebApp } from './types.js';
import { TelegramProvider } from './TelegramProvider.js';
/** Wallet option displayed in the modal. */
export interface WalletOption {
    /** Unique wallet identifier. */
    id: string;
    /** Display name. */
    name: string;
    /** Icon URL or emoji. */
    icon: string;
    /** Whether it's recommended. */
    recommended?: boolean;
}
/** Modal configuration. */
export interface TelegramModalConfig {
    /** Title shown in the modal. */
    title?: string;
    /** Wallet options to display. */
    wallets?: WalletOption[];
    /** Custom TelegramWebApp (for testing). */
    webApp?: TelegramWebApp;
}
/**
 * TelegramModal: Native-feeling wallet selection modal.
 *
 * Uses Telegram's MainButton and native dialogs to present
 * a wallet selection flow optimized for Mini Apps.
 */
export declare class TelegramModal {
    /** Provider instance. */
    private provider;
    /** Modal title. */
    private title;
    /** Available wallets. */
    private wallets;
    /** Selected wallet ID. */
    private selectedWallet;
    /**
     * Create a new TelegramModal.
     *
     * @param config - Modal configuration.
     */
    constructor(config?: TelegramModalConfig);
    /**
     * Initialize the modal.
     *
     * @returns True if available.
     */
    initialize(): Promise<boolean>;
    /**
     * Show the wallet selection modal.
     *
     * Sets up the main button to cycle through wallet options.
     *
     * @returns Promise resolving to selected wallet ID or null if cancelled.
     */
    show(): Promise<string | null>;
    /**
     * Show a confirm dialog before connecting.
     *
     * @param walletName - Name of wallet to connect.
     * @returns True if user confirms.
     */
    confirmConnection(walletName: string): Promise<boolean>;
    /**
     * Get available wallet options.
     *
     * @returns Array of wallet options.
     */
    getWalletOptions(): WalletOption[];
    /**
     * Get the selected wallet ID.
     *
     * @returns Wallet ID or null.
     */
    getSelectedWallet(): string | null;
    /**
     * Get the provider instance.
     *
     * @returns TelegramProvider.
     */
    getProvider(): TelegramProvider;
    /** Update main button text and color for current index. */
    private updateMainButton;
    /** Clean up button and listeners. */
    private cleanup;
}
//# sourceMappingURL=TelegramModal.d.ts.map