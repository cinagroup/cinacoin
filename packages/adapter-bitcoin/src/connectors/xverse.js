/**
 * Xverse Wallet connector for native Bitcoin (+ Stacks support).
 *
 * Detects `window.xverse.bitcoin` and wraps it with the standard
 * {@link BitcoinConnector} interface. Xverse supports both Bitcoin
 * Ordinals and Stacks — this connector covers Bitcoin operations
 * while exposing Stacks through the `request()` interface.
 *
 * @see https://www.xverse.app/
 *
 * @example
 * ```ts
 * const xverse = new XverseConnector();
 * if (xverse.isAvailable()) {
 *   const result = await xverse.connect();
 *   console.log(result.accounts); // ["bc1q...", ...]
 * }
 * ```
 */
export class XverseConnector {
    constructor() {
        this.id = 'xverse';
        this.name = 'Xverse Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="%231E1E2C"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="%236C5DD3" font-family="sans-serif" font-weight="bold">X</text></svg>';
        this.platforms = ['browser', 'mobile', 'extension'];
        this.supportedFeatures = [
            'bitcoin:connect',
            'bitcoin:signMessage',
            'bitcoin:signPsbt',
            'bitcoin:signTransaction',
            'bitcoin:sendTransfer',
            'bitcoin:switchNetwork',
            'bitcoin:ordinals',
            'bitcoin:brc20',
        ];
        this._handlers = new Map();
        this._provider = null;
        this._connectedAccounts = [];
        this._captureProvider();
    }
    // ─── Availability ────────────────────────────────────────────────
    isAvailable() {
        this._captureProvider();
        return this._provider !== null;
    }
    // ─── Lifecycle ───────────────────────────────────────────────────
    async connect(_params) {
        const provider = this._getProviderOrThrow();
        // Try convenience method first, fall back to request
        let accounts;
        try {
            accounts = await this._requestAccounts(provider);
        }
        catch {
            // Fallback: getAccount returns structured address info
            const account = await this._getAccount(provider);
            accounts = account.addresses
                .filter((a) => a.type === 'payment' || a.type === 'ordinals')
                .map((a) => a.address);
            if (accounts.length === 0 && account.addresses.length > 0) {
                accounts = account.addresses.map((a) => a.address);
            }
        }
        this._connectedAccounts = accounts;
        this._bindProviderEvents(provider);
        return {
            accounts: this._connectedAccounts,
            network: 'mainnet', // Xverse defaults to mainnet
            provider: provider,
        };
    }
    async disconnect() {
        this._connectedAccounts = [];
        const handlers = this._handlers.get('disconnect') ?? new Set();
        for (const handler of handlers) {
            handler();
        }
    }
    // ─── RPC ─────────────────────────────────────────────────────────
    async request(args) {
        const provider = this._getProviderOrThrow();
        return provider.request(args);
    }
    async getAccounts() {
        if (this._connectedAccounts.length > 0) {
            return this._connectedAccounts;
        }
        const provider = this._getProviderOrThrow();
        const account = await this._getAccount(provider);
        return account.addresses.map((a) => a.address);
    }
    async getNetwork() {
        return 'mainnet';
    }
    async switchNetwork(network) {
        const provider = this._getProviderOrThrow();
        await provider.request({
            method: 'wallet_switchNetwork',
            params: [network],
        });
    }
    // ─── Bitcoin-native methods ─────────────────────────────────────
    async signMessage(params) {
        const provider = this._getProviderOrThrow();
        const signature = (await provider.request({
            method: 'wallet_signMessage',
            params: [params.message, params.address],
        }));
        return { signature };
    }
    async signPsbt(params) {
        const provider = this._getProviderOrThrow();
        const psbt = (await provider.request({
            method: 'wallet_signPsbt',
            params: [
                params.psbt,
                {
                    signInputs: params.signInputs,
                    broadcast: false,
                },
            ],
        }));
        return { psbt };
    }
    async sendTransfer(params) {
        const provider = this._getProviderOrThrow();
        const txid = (await provider.request({
            method: 'wallet_sendTransfer',
            params: [
                {
                    recipient: params.recipient,
                    amount: params.amount,
                    feeRate: params.feeRate,
                },
            ],
        }));
        return { txid };
    }
    // ─── Stacks Integration ──────────────────────────────────────────
    /**
     * Get Stacks addresses through the Xverse provider.
     *
     * Xverse uses the same `window.xverse` surface for Stacks operations.
     */
    async getStacksAccount() {
        const provider = this._getProviderOrThrow();
        return provider.request({
            method: 'wallet_getStxAccount',
        });
    }
    /**
     * Sign a Stacks transaction through Xverse.
     */
    async signStacksTransaction(params) {
        const provider = this._getProviderOrThrow();
        return provider.request({
            method: 'wallet_signStxTransaction',
            params: [params.transaction],
        });
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
    _captureProvider() {
        if (this._provider)
            return;
        if (typeof window === 'undefined')
            return;
        const win = window;
        if (win.xverse?.bitcoin) {
            this._provider = win.xverse.bitcoin;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('Xverse Wallet not found. Install Xverse: https://www.xverse.app/');
        }
        return this._provider;
    }
    async _requestAccounts(provider) {
        if (provider.requestAccounts) {
            return provider.requestAccounts();
        }
        return (await provider.request({
            method: 'wallet_requestAccounts',
        }));
    }
    async _getAccount(provider) {
        if (provider.getAccount) {
            return provider.getAccount();
        }
        return (await provider.request({
            method: 'wallet_getAccount',
        }));
    }
    _bindProviderEvents(provider) {
        provider.on('accountsChanged', (accounts) => {
            const handlers = this._handlers.get('accountsChanged') ?? new Set();
            for (const handler of handlers) {
                handler(accounts);
            }
        });
        provider.on('networkChanged', (network) => {
            const handlers = this._handlers.get('networkChanged') ?? new Set();
            for (const handler of handlers) {
                handler(network);
            }
        });
        provider.on('disconnect', (error) => {
            const handlers = this._handlers.get('disconnect') ?? new Set();
            for (const handler of handlers) {
                handler(error);
            }
        });
    }
}
//# sourceMappingURL=xverse.js.map