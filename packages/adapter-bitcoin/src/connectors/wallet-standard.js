/** Bitcoin feature namespaces recognized by the Wallet Standard */
const BITCOIN_FEATURES = [
    'bitcoin:connect',
    'bitcoin:signMessage',
    'bitcoin:signTransaction',
    'bitcoin:sendTransfer',
    'bitcoin:signPsbt',
    'bitcoin:sendBitcoin',
    'bitcoin:switchNetwork',
];
/**
 * Wallet Standard connector for Bitcoin.
 *
 * Auto-discovers any wallet that implements the Wallet Standard interface
 * with Bitcoin feature support. Uses `window.walletStandard` for discovery.
 *
 * This is the most universal connector — any wallet implementing the
 * Wallet Standard protocol for Bitcoin chains will be detected and
 * usable through this connector.
 *
 * @see https://wallet-standard.com/
 *
 * @example
 * ```ts
 * const ws = new WalletStandardConnector();
 * const wallets = ws.getAvailableWallets();
 * console.log(wallets.map(w => w.name));
 *
 * if (wallets.length > 0) {
 *   const result = await ws.connect();
 *   console.log(result.accounts);
 * }
 * ```
 */
export class WalletStandardConnector {
    constructor() {
        this.id = 'wallet-standard';
        this.name = 'Wallet Standard';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">W</text></svg>';
        this.platforms = ['browser', 'mobile', 'extension'];
        this.supportedFeatures = [
            'bitcoin:connect',
            'bitcoin:signMessage',
            'bitcoin:signTransaction',
            'bitcoin:sendTransfer',
        ];
        this._handlers = new Map();
        this._selectedWallet = null;
        this._connectedAccounts = [];
    }
    // ─── Discovery ───────────────────────────────────────────────────
    /**
     * Get all wallets registered with the Wallet Standard that support Bitcoin.
     *
     * A wallet is considered Bitcoin-compatible if its `chains` array
     * includes a Bitcoin chain identifier (e.g. "bitcoin:mainnet").
     */
    getAvailableWallets() {
        if (typeof window === 'undefined')
            return [];
        const std = window.walletStandard;
        if (!std?.wallets)
            return [];
        return Array.from(std.wallets).filter((wallet) => wallet.chains.some((chain) => chain.startsWith('bitcoin:')));
    }
    /**
     * Check whether any Bitcoin-capable Wallet Standard wallet is available.
     */
    isAvailable() {
        return this.getAvailableWallets().length > 0;
    }
    // ─── Lifecycle ───────────────────────────────────────────────────
    async connect(params) {
        const wallets = this.getAvailableWallets();
        if (wallets.length === 0) {
            throw new Error('No Bitcoin wallets found via Wallet Standard. Install a compatible wallet.');
        }
        // Select the first available wallet; UI integrations can customize this
        this._selectedWallet = wallets[0];
        // Use the bitcoin:connect feature if available
        const connectFeature = this._selectedWallet.features['bitcoin:connect'];
        let accounts;
        if (connectFeature?.connect) {
            const result = await connectFeature.connect(params);
            accounts = result.accounts;
        }
        else {
            // Fallback: use account list from wallet state
            accounts = this._selectedWallet.accounts
                .filter((a) => a.chains.some((c) => c.startsWith('bitcoin:')))
                .map((a) => a.address);
            if (accounts.length === 0) {
                throw new Error(`Wallet "${this._selectedWallet.name}" has no Bitcoin accounts. ` +
                    `It may require interactive connection.`);
            }
        }
        this._connectedAccounts = accounts;
        this._bindWalletEvents();
        return {
            accounts: this._connectedAccounts,
            network: this._inferNetwork(),
        };
    }
    async disconnect() {
        this._selectedWallet = null;
        this._connectedAccounts = [];
        const handlers = this._handlers.get('disconnect') ?? new Set();
        for (const handler of handlers) {
            handler();
        }
    }
    // ─── RPC ─────────────────────────────────────────────────────────
    async request(args) {
        const wallet = this._getWalletOrThrow();
        // Wallet Standard doesn't have a generic request;
        // dispatch to feature-specific implementations
        const feature = wallet.features[`bitcoin:${args.method}`];
        if (!feature || typeof feature[args.method] !== 'function') {
            throw new Error(`Wallet "${wallet.name}" does not support method "${args.method}"`);
        }
        return feature[args.method](...(args.params ?? []));
    }
    async getAccounts() {
        if (this._connectedAccounts.length === 0) {
            // Try to read from wallet state
            const wallet = this._getWalletOrThrow();
            return wallet.accounts
                .filter((a) => a.chains.some((c) => c.startsWith('bitcoin:')))
                .map((a) => a.address);
        }
        return this._connectedAccounts;
    }
    async getNetwork() {
        return this._inferNetwork();
    }
    async switchNetwork(_network) {
        throw new Error('Wallet Standard does not support programmatic network switching for Bitcoin. ' +
            'Reconnect to a wallet configured for the desired network.');
    }
    // ─── Bitcoin-native methods ─────────────────────────────────────
    async signMessage(params) {
        const wallet = this._getWalletOrThrow();
        const feature = wallet.features['bitcoin:signMessage'];
        if (!feature?.signMessage) {
            throw new Error(`Wallet "${wallet.name}" does not support bitcoin:signMessage`);
        }
        return feature.signMessage(params);
    }
    async signPsbt(params) {
        const wallet = this._getWalletOrThrow();
        // Try signTransaction first (generic), then signPsbt (specific)
        const signTxFeature = wallet.features['bitcoin:signTransaction'];
        if (signTxFeature?.signTransaction) {
            return signTxFeature.signTransaction(params);
        }
        const signPsbtFeature = wallet.features['bitcoin:signPsbt'];
        if (signPsbtFeature?.signPsbt) {
            return signPsbtFeature.signPsbt(params);
        }
        throw new Error(`Wallet "${wallet.name}" does not support bitcoin:signTransaction or bitcoin:signPsbt`);
    }
    async sendTransfer(params) {
        const wallet = this._getWalletOrThrow();
        const feature = wallet.features['bitcoin:sendTransfer'];
        if (!feature?.sendTransfer) {
            throw new Error(`Wallet "${wallet.name}" does not support bitcoin:sendTransfer`);
        }
        return feature.sendTransfer(params);
    }
    on(event, handler) {
        if (!this._handlers.has(event)) {
            this._handlers.set(event, new Set());
        }
        this._handlers.get(event).add(handler);
    }
    off(event, handler) {
        this._handlers.get(event)?.delete(handler);
    }
    // ─── Internal ────────────────────────────────────────────────────
    _getWalletOrThrow() {
        if (!this._selectedWallet) {
            throw new Error('No wallet selected. Call connect() first.');
        }
        return this._selectedWallet;
    }
    _inferNetwork() {
        if (!this._selectedWallet)
            return 'mainnet';
        for (const chain of this._selectedWallet.chains) {
            if (chain.startsWith('bitcoin:')) {
                return chain.replace('bitcoin:', '');
            }
        }
        return 'mainnet';
    }
    _bindWalletEvents() {
        if (typeof window === 'undefined')
            return;
        const std = window.walletStandard;
        if (!std)
            return;
        // Listen for wallet accounts changed events
        if (this._selectedWallet && 'on' in this._selectedWallet) {
            // Wallet Standard wallets may emit account changes
        }
        // Fallback: listen to registry changes
        std.on?.((wallets) => {
            const btcWallets = wallets.filter((w) => w.chains.some((c) => c.startsWith('bitcoin:')));
            if (btcWallets.length === 0 && this._selectedWallet) {
                // Previously connected wallet disappeared
                const handlers = this._handlers.get('disconnect') ?? new Set();
                for (const handler of handlers) {
                    handler(new Error('Wallet removed from registry'));
                }
            }
        });
    }
}
//# sourceMappingURL=wallet-standard.js.map