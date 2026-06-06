/**
 * Ethos Wallet connector.
 *
 * Connects via the `window.ethosWallet` injected object provided by
 * the Ethos Wallet browser extension.
 *
 * @module connectors/ethos
 */
/**
 * Connector for the Ethos Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new EthosConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export class EthosConnector {
    constructor() {
        this.id = 'ethos';
        this.name = 'Ethos Wallet';
        this.icon = 'https://ethoswallet.xyz/favicon.svg';
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
     * Resolve the injected Ethos Wallet provider.
     */
    _resolveProvider() {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        // Ethos exposes `window.ethosWallet`
        return win.ethosWallet ?? null;
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
     * Connect to Ethos Wallet.
     */
    async connect() {
        const provider = this._resolveProvider();
        if (!provider)
            throw new Error('Ethos Wallet not found. Install the Ethos Wallet extension.');
        const result = await provider.connect();
        this.provider = provider;
        this._bindEvents(provider);
        return result;
    }
    /**
     * Disconnect from Ethos Wallet.
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
//# sourceMappingURL=ethos.js.map