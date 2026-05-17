/**
 * OKX Wallet Bitcoin connector.
 *
 * OKX Wallet supports dual EVM/Bitcoin mode. This connector targets
 * `window.okxwallet.btc` — the Bitcoin-specific provider — while
 * correctly handling the dual-mode environment.
 *
 * @see https://www.okx.com/web3
 *
 * @example
 * ```ts
 * const okxBtc = new OKXBitcoinConnector();
 * if (okxBtc.isAvailable()) {
 *   const result = await okxBtc.connect();
 *   console.log(result.accounts); // ["bc1q...", ...]
 * }
 * ```
 */
export class OKXBitcoinConnector {
    constructor() {
        this.id = 'okx-btc';
        this.name = 'OKX Wallet (Bitcoin)';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">OKX</text></svg>';
        this.platforms = ['browser', 'mobile', 'extension'];
        this.supportedFeatures = [
            'bitcoin:connect',
            'bitcoin:signMessage',
            'bitcoin:signPsbt',
            'bitcoin:sendBitcoin',
            'bitcoin:sendTransfer',
            'bitcoin:switchNetwork',
        ];
        this._handlers = new Map();
        this._provider = null;
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
        const accounts = (await provider.request({
            method: 'wallet_requestAccounts',
        }));
        const network = (await provider.request({
            method: 'wallet_getNetwork',
        }));
        this._bindProviderEvents(provider);
        return { accounts, network, provider: provider };
    }
    async disconnect() {
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
        const provider = this._getProviderOrThrow();
        return (await provider.request({
            method: 'wallet_getAccounts',
        }));
    }
    async getNetwork() {
        const provider = this._getProviderOrThrow();
        return (await provider.request({
            method: 'wallet_getNetwork',
        }));
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
            params: [params.message],
        }));
        return { signature };
    }
    async signPsbt(params) {
        const provider = this._getProviderOrThrow();
        const psbt = (await provider.request({
            method: 'wallet_signPsbt',
            params: [params.psbt, { signInputs: params.signInputs }],
        }));
        return { psbt };
    }
    async sendTransfer(params) {
        const provider = this._getProviderOrThrow();
        const txid = (await provider.request({
            method: 'wallet_sendBitcoin',
            params: [params.recipient, params.amount, params.feeRate],
        }));
        return { txid };
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
        // OKX dual-mode: btc provider sits alongside ethereum
        // Must check btc specifically, NOT ethereum
        if (win.okxwallet?.btc) {
            this._provider = win.okxwallet.btc;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('OKX Wallet Bitcoin provider not found. Install OKX Wallet and ensure the Bitcoin network is selected: https://www.okx.com/web3');
        }
        return this._provider;
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
//# sourceMappingURL=okx.js.map