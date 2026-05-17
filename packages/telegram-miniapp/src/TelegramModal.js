/**
 * Telegram-native wallet modal.
 *
 * Displays a wallet connection modal using Telegram's native UI
 * components (MainButton, showAlert, showConfirm) for a seamless
 * Mini App experience.
 */
import { TelegramProvider } from './TelegramProvider.js';
/**
 * TelegramModal: Native-feeling wallet selection modal.
 *
 * Uses Telegram's MainButton and native dialogs to present
 * a wallet selection flow optimized for Mini Apps.
 */
export class TelegramModal {
    /**
     * Create a new TelegramModal.
     *
     * @param config - Modal configuration.
     */
    constructor(config = {}) {
        /** Selected wallet ID. */
        this.selectedWallet = null;
        this.provider = new TelegramProvider({ webApp: config.webApp });
        this.title = config.title ?? 'Connect Wallet';
        this.wallets = config.wallets ?? [];
    }
    /**
     * Initialize the modal.
     *
     * @returns True if available.
     */
    async initialize() {
        return this.provider.initialize();
    }
    /**
     * Show the wallet selection modal.
     *
     * Sets up the main button to cycle through wallet options.
     *
     * @returns Promise resolving to selected wallet ID or null if cancelled.
     */
    show() {
        return new Promise((resolve) => {
            if (this.wallets.length === 0) {
                this.provider.showAlert('No wallets available');
                resolve(null);
                return;
            }
            let index = 0;
            // Show first option
            this.updateMainButton(index);
            const handleClick = () => {
                if (index < this.wallets.length - 1) {
                    index++;
                    this.updateMainButton(index);
                    this.provider.triggerHaptic('light');
                }
                else {
                    // Last wallet selected
                    const wallet = this.wallets[index];
                    this.selectedWallet = wallet.id;
                    this.cleanup();
                    this.provider.triggerHaptic('success');
                    resolve(wallet.id);
                }
            };
            this.provider.onMainButtonClick(handleClick);
        });
    }
    /**
     * Show a confirm dialog before connecting.
     *
     * @param walletName - Name of wallet to connect.
     * @returns True if user confirms.
     */
    async confirmConnection(walletName) {
        return this.provider.showConfirm(`Connect to ${walletName}?`);
    }
    /**
     * Get available wallet options.
     *
     * @returns Array of wallet options.
     */
    getWalletOptions() {
        return [...this.wallets];
    }
    /**
     * Get the selected wallet ID.
     *
     * @returns Wallet ID or null.
     */
    getSelectedWallet() {
        return this.selectedWallet;
    }
    /**
     * Get the provider instance.
     *
     * @returns TelegramProvider.
     */
    getProvider() {
        return this.provider;
    }
    /** Update main button text and color for current index. */
    updateMainButton(index) {
        const wallet = this.wallets[index];
        const text = `${wallet.name} (${index + 1}/${this.wallets.length})`;
        this.provider.setMainButtonText(text);
        this.provider.showMainButton();
    }
    /** Clean up button and listeners. */
    cleanup() {
        this.provider.hideMainButton();
    }
}
//# sourceMappingURL=TelegramModal.js.map