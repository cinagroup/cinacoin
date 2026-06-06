/**
 * Martian Wallet connector.
 *
 * Connects via the `window.martian` injected object provided by the
 * Martian Wallet browser extension.
 *
 * @module connectors/martian
 */
/**
 * Connector for the Martian Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new MartianConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export class MartianConnector {
    constructor() {
        this.id = 'martian';
        this.name = 'Martian Wallet';
        this.icon = 'https://martianwallet.xyz/favicon.svg';
        this.platforms = ['browser', 'extension'];
        this.supportedFeatures = [
            'sui:connect',
            'sui:signTransaction',
            'sui:signAndExecuteTransaction',
            'sui:signMessage',
        ];
        this.provider = null;
    }
    /**
     * Resolve the injected Martian Wallet provider.
     */
    _resolveProvider() {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        // Martian exposes `window.martian`
        return win.martian ?? null;
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
     * Connect to Martian Wallet.
     */
    async connect() {
        const provider = this._resolveProvider();
        if (!provider)
            throw new Error('Martian Wallet not found. Install the Martian Wallet extension.');
        const result = await provider.connect();
        this.provider = provider;
        this._bindEvents(provider);
        return result;
    }
    /**
     * Disconnect from Martian Wallet.
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
//# sourceMappingURL=martian.js.map