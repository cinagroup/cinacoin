/**
 * Official Sui Wallet connector.
 *
 * Connects via the `window.sui` injected object provided by the
 * official Sui Wallet browser extension.
 *
 * @module connectors/sui-wallet
 */
/**
 * Connector for the official Sui Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new SuiWalletConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export class SuiWalletConnector {
    constructor() {
        this.id = 'sui-wallet';
        this.name = 'Sui Wallet';
        this.icon = 'https://sui.io/favicon.svg';
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
     * Resolve the injected provider.
     */
    _resolveProvider() {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        // Official Sui Wallet exposes `window.sui`
        return win.sui ?? null;
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
     * Connect to Sui Wallet.
     * Opens the wallet approval UI if not already connected.
     */
    async connect() {
        const provider = this._resolveProvider();
        if (!provider)
            throw new Error('Sui Wallet not found. Install the Sui Wallet extension.');
        const result = await provider.connect();
        this.provider = provider;
        // Set up event forwarding
        this._bindEvents(provider);
        return result;
    }
    /**
     * Disconnect from Sui Wallet.
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
//# sourceMappingURL=sui-wallet.js.map