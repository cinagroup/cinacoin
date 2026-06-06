/**
 * Built-in connector that detects window.ethereum and similar injected providers.
 *
 * Supports EIP-6963 multi-wallet discovery for wallets that announce themselves
 * via the `eip6963:announceProvider` mechanism.
 */
export class InjectedConnector {
    constructor() {
        this.id = 'injected';
        this.name = 'Injected Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%233B82F6" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>';
        this.type = 'injected';
        /** Active event listeners stored for cleanup */
        this._handlers = new Map();
        /** Cached provider reference */
        this._provider = null;
        /** Discovered EIP-6963 providers */
        this._eip6963Providers = new Map();
        /** Whether init() has been called */
        this._initialized = false;
        this._listenForEIP6963();
    }
    // ─── Lifecycle ──────────────────────────────────────────────────
    /**
     * Initialize the connector by capturing the current injected provider.
     */
    async init() {
        if (this._initialized)
            return;
        const win = typeof window !== 'undefined' ? window : undefined;
        if (win?.ethereum) {
            this._provider = win.ethereum;
        }
        this._initialized = true;
    }
    /**
     * Request connection from the injected provider.
     *
     * Triggers the wallet's permission prompt and returns connected accounts.
     */
    async connect(_params) {
        const provider = this._getProviderOrThrow();
        // eth_requestAccounts triggers the wallet connection UI
        const accounts = (await provider.request({
            method: 'eth_requestAccounts',
        }));
        const chainId = (await provider.request({
            method: 'eth_chainId',
        }));
        // Wire up runtime event listeners
        this._bindProviderEvents(provider);
        return { accounts, chainId, provider };
    }
    /**
     * Disconnect is a no-op for injected providers since the wallet
     * lives in the browser. We fire a disconnect event for consistency.
     */
    async disconnect() {
        const handlers = this._handlers.get('disconnect') ?? new Set();
        for (const handler of handlers) {
            handler();
        }
    }
    // ─── Provider interaction ───────────────────────────────────────
    /**
     * Forward a JSON-RPC request to the injected provider.
     */
    async request(args) {
        const provider = this._getProviderOrThrow();
        return provider.request(args);
    }
    async getAccounts() {
        const provider = this._getProviderOrThrow();
        return (await provider.request({
            method: 'eth_accounts',
        }));
    }
    async getChainId() {
        const provider = this._getProviderOrThrow();
        return (await provider.request({
            method: 'eth_chainId',
        }));
    }
    /**
     * Check whether an ethereum provider is available in the current window.
     */
    isAvailable() {
        if (typeof window === 'undefined')
            return false;
        return !!window?.ethereum || this._eip6963Providers.size > 0;
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
    // ─── EIP-6963 ──────────────────────────────────────────────────
    /**
     * Listen for EIP-6963 provider announcements to discover wallets
     * that don't set window.ethereum directly.
     */
    _listenForEIP6963() {
        if (typeof window === 'undefined')
            return;
        const handler = (event) => {
            const detail = event.detail;
            if (detail?.info?.uuid) {
                this._eip6963Providers.set(detail.info.uuid, detail);
                // If no provider yet, adopt the first one discovered
                if (!this._provider) {
                    this._provider = detail.provider;
                }
            }
        };
        window.addEventListener('eip6963:announceProvider', handler);
        // Ask all wallets to announce themselves
        window.dispatchEvent(new Event('eip6963:requestProvider'));
    }
    // ─── Internal ───────────────────────────────────────────────────
    _getProviderOrThrow() {
        if (!this._provider) {
            throw new Error('No injected provider found. Ensure a wallet extension is installed and the connector has been initialized.');
        }
        return this._provider;
    }
    /**
     * Bind runtime events from the provider to our internal event system.
     */
    _bindProviderEvents(provider) {
        provider.on('accountsChanged', (accounts) => {
            const handlers = this._handlers.get('accountsChanged') ?? new Set();
            for (const handler of handlers) {
                handler(accounts);
            }
        });
        provider.on('chainChanged', (chainId) => {
            const handlers = this._handlers.get('chainChanged') ?? new Set();
            for (const handler of handlers) {
                handler(chainId);
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
//# sourceMappingURL=injected.js.map