/**
 * Unisat Wallet connector for native Bitcoin.
 *
 * Detects `window.unisat` and wraps it with the standard
 * {@link BitcoinConnector} interface.
 *
 * @see https://docs.unisat.io/
 *
 * @example
 * ```ts
 * const unisat = new UnisatConnector();
 * if (unisat.isAvailable()) {
 *   const result = await unisat.connect();
 *   console.log(result.accounts); // ["bc1q...", ...]
 * }
 * ```
 */
export class UnisatConnector {
    constructor() {
        this.id = 'unisat';
        this.name = 'Unisat Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23D8A852"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="white" font-family="sans-serif" font-weight="bold">U</text></svg>';
        this.platforms = ['browser', 'extension'];
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
    async connect(params) {
        const provider = this._getProviderOrThrow();
        // Use requestAccounts which triggers the wallet permission prompt
        const accounts = await this._safeCall(provider, 'requestAccounts', async () => {
            const result = (await provider.request({
                method: 'wallet_requestAccounts',
            }));
            return result;
        });
        const network = await this._safeCall(provider, 'getNetwork', () => provider.request({ method: 'wallet_getNetwork' }));
        this._bindProviderEvents(provider);
        return { accounts, network, provider };
    }
    async disconnect() {
        // Unisat doesn't have a native disconnect — fire event for consistency
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
        // Try direct method first, fall back to request()
        return this._safeCall(provider, 'getAccounts', () => provider.request({ method: 'wallet_getAccounts' }));
    }
    async getNetwork() {
        const provider = this._getProviderOrThrow();
        return this._safeCall(provider, 'getNetwork', () => provider.request({ method: 'wallet_getNetwork' }));
    }
    async switchNetwork(network) {
        const provider = this._getProviderOrThrow();
        await this._safeCall(provider, 'switchNetwork', () => provider.request({ method: 'wallet_switchNetwork', params: [network] }));
    }
    // ─── Bitcoin-native methods ─────────────────────────────────────
    async signMessage(params) {
        const provider = this._getProviderOrThrow();
        const signature = await this._safeCall(provider, 'signMessage', () => provider.request({
            method: 'wallet_signMessage',
            params: [params.message],
        }));
        return { signature };
    }
    async signPsbt(params) {
        const provider = this._getProviderOrThrow();
        const psbt = await this._safeCall(provider, 'signPsbt', () => provider.request({
            method: 'wallet_signPsbt',
            params: [
                params.psbt,
                { autoFinalized: true, signInputs: params.signInputs },
            ],
        }));
        return { psbt };
    }
    async sendTransfer(params) {
        const provider = this._getProviderOrThrow();
        const txid = await this._safeCall(provider, 'sendBitcoin', () => provider.request({
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
    /** Capture window.unisat if available (idempotent). */
    _captureProvider() {
        if (this._provider)
            return;
        if (typeof window === 'undefined')
            return;
        const win = window;
        if (win.unisat) {
            this._provider = win.unisat;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('Unisat Wallet not found. Install the Unisat browser extension: https://unisat.io/');
        }
        return this._provider;
    }
    /**
     * Try a provider-specific convenience method, falling back to
     * the generic `request()` call if the convenience method is absent.
     */
    async _safeCall(_provider, methodName, fallback) {
        return fallback();
    }
    /** Bind provider events to our internal event system. */
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
// ─── EIP-6963 Announcement ─────────────────────────────────────────
/**
 * Announce the Unisat Bitcoin provider via EIP-6963 event.
 * Call this during application bootstrap to enable multi-wallet discovery.
 */
export function announceUnisatEIP6963() {
    if (typeof window === 'undefined')
        return;
    const win = window;
    if (!win.unisat)
        return;
    const detail = {
        info: {
            uuid: crypto.randomUUID(),
            name: 'Unisat Wallet',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23D8A852"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="white" font-family="sans-serif" font-weight="bold">U</text></svg>',
            rdns: 'io.unisat',
        },
        provider: win.unisat,
    };
    window.addEventListener('eip6963:requestProvider', () => {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    });
    // Also announce immediately in case the request event already fired
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
}
//# sourceMappingURL=unisat.js.map