/**
 * Suiet Wallet connector.
 *
 * Connects via the `window.suietWallet` injected object provided by
 * the Suiet Wallet browser extension.
 *
 * @module connectors/suiet
 */
/**
 * Connector for the Suiet Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new SuietConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export class SuietConnector {
    constructor() {
        this.id = 'suiet';
        this.name = 'Suiet Wallet';
        this.icon = 'https://suiet.app/favicon.svg';
        this.platforms = ['browser', 'extension'];
        this.supportedFeatures = [
            'sui:connect',
            'sui:signTransaction',
            'sui:signAndExecuteTransaction',
            'sui:signMessage',
            'sui:switchNetwork',
        ];
        this.provider = null;
    }
    /**
     * Resolve the injected Suiet Wallet provider.
     */
    _resolveProvider() {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        // Suiet exposes `window.suietWallet`
        return win.suietWallet ?? null;
    }
    isAvailable() {
        return this._resolveProvider() !== null;
    }
    getAddress() {
        return this.provider?.account ?? null;
    }
    getProvider() {
        return this.provider;
    }
    /**
     * Connect to Suiet Wallet.
     */
    async connect() {
        const provider = this._resolveProvider();
        if (!provider)
            throw new Error('Suiet Wallet not found. Install the Suiet Wallet extension.');
        const result = await provider.connect();
        this.provider = provider;
        this._bindEvents(provider);
        return result;
    }
    /**
     * Disconnect from Suiet Wallet.
     */
    async disconnect() {
        if (this.provider) {
            await this.provider.disconnect();
            this.provider = null;
        }
    }
    async signTransaction(tx) {
        if (!this.provider)
            throw new Error('Not connected. Call connect() first.');
        return this.provider.signTransaction(tx);
    }
    async signAndExecuteTransaction(tx, options) {
        if (!this.provider)
            throw new Error('Not connected. Call connect() first.');
        return this.provider.signAndExecuteTransaction(tx, options);
    }
    /**
     * Subscribe to connector events.
     */
    on(event, handler) {
        if (this.provider) {
            this.provider.on(event, handler);
        }
    }
    /**
     * Unsubscribe from connector events.
     */
    off(event, handler) {
        if (this.provider) {
            this.provider.off(event, handler);
        }
    }
    _bindEvents(provider) {
        provider.on('disconnect', () => {
            this.provider = null;
        });
    }
}
//# sourceMappingURL=suiet.js.map