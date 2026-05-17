/**
 * Injected provider transport — communicates with browser wallet extensions
 * via the EIP-1193 interface.
 *
 * This is the standard way to connect to MetaMask, Rabby, and other
 * injected wallet providers.
 */
import { Connector } from '../connector.js';
/**
 * InjectedProvider wraps a browser-injected EIP-1193 provider.
 *
 * It acts as both a Connector and a transport layer for direct
 * wallet-to-dApp communication without a relay.
 */
export class InjectedProvider extends Connector {
    /**
     * Create an injected provider connector.
     * @param id - Unique identifier (e.g., 'io.metamask').
     * @param name - Display name.
     * @param icon - Icon URL or data URI.
     * @param provider - Optional EIP-1193 provider instance. If not provided, will auto-detect.
     */
    constructor(id, name, icon, provider) {
        super();
        this.type = 'injected';
        this._provider = null;
        this._installed = false;
        this.id = id;
        this.name = name;
        this.icon = icon;
        this._provider = provider ?? null;
        if (this._provider) {
            this._installed = true;
            this.setupEventListeners();
        }
        else {
            this._installed = this.detectProvider();
        }
    }
    get installed() {
        return this._installed;
    }
    /** Detect if the provider is available in window.ethereum. */
    detectProvider() {
        if (typeof window === 'undefined' || !window.ethereum) {
            return false;
        }
        // Check if this specific provider is among the detected providers
        const providers = this.getDetectedProviders();
        const match = providers.find((p) => {
            const obj = p;
            return obj.isMetaMask || obj.isRabby || obj.rdns === this.id;
        });
        if (match) {
            this._provider = match;
            this.setupEventListeners();
            return true;
        }
        // Fallback: use window.ethereum directly
        this._provider = window.ethereum;
        this.setupEventListeners();
        return true;
    }
    /** Get all detected EIP-1193 providers. */
    getDetectedProviders() {
        if (typeof window === 'undefined' || !window.ethereum) {
            return [];
        }
        // EIP-6963: providers may be at window.ethereum.providers
        const providers = window.ethereum.providers;
        if (Array.isArray(providers)) {
            return providers;
        }
        // Fallback: single provider at window.ethereum
        return [window.ethereum];
    }
    /** Set up event listeners for chain/account changes. */
    setupEventListeners() {
        if (!this._provider)
            return;
        this._provider.on('accountsChanged', (accounts) => {
            this.emit('accountsChanged', accounts);
        });
        this._provider.on('chainChanged', (chainId) => {
            const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
            this.emit('chainChanged', id);
        });
        this._provider.on('disconnect', () => {
            this.emit('disconnect');
        });
    }
    async connect(params) {
        if (!this._provider) {
            throw new Error(`${this.name} is not installed`);
        }
        try {
            // Request accounts — triggers wallet popup
            const accounts = (await this._provider.request({
                method: 'eth_requestAccounts',
            }));
            const chainIdHex = (await this._provider.request({
                method: 'eth_chainId',
            }));
            const chainId = parseInt(chainIdHex, 16);
            const sessionId = `injected-${this.id}-${Date.now()}`;
            return {
                sessionId,
                accounts,
                chainId,
                connectorId: this.id,
            };
        }
        catch (error) {
            throw this.wrapError(error);
        }
    }
    async disconnect() {
        // Injected providers don't have a formal disconnect
        // We just clean up our local state
        this.emit('disconnect');
    }
    async getAccounts() {
        if (!this._provider)
            throw new Error('Not connected');
        return (await this._provider.request({
            method: 'eth_accounts',
        }));
    }
    async getChainId() {
        if (!this._provider)
            throw new Error('Not connected');
        const hex = (await this._provider.request({
            method: 'eth_chainId',
        }));
        return parseInt(hex, 16);
    }
    async switchChain(chainId) {
        if (!this._provider)
            throw new Error('Not connected');
        try {
            await this._provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
        }
        catch (error) {
            // Error code 4902 = chain not added to wallet
            const err = error;
            if (err.code === 4902) {
                throw new Error(`Chain ${chainId} is not configured in ${this.name}. Please add it manually.`);
            }
            throw this.wrapError(error);
        }
    }
    async signMessage(message) {
        if (!this._provider)
            throw new Error('Not connected');
        return (await this._provider.request({
            method: 'personal_sign',
            params: [message, (await this.getAccounts())[0]],
        }));
    }
    async signTransaction(tx) {
        if (!this._provider)
            throw new Error('Not connected');
        return (await this._provider.request({
            method: 'eth_signTransaction',
            params: [tx],
        }));
    }
    /** Get the raw EIP-1193 provider for advanced usage. */
    getProvider() {
        return this._provider;
    }
    wrapError(error) {
        if (error instanceof Error)
            return error;
        const msg = typeof error === 'string' ? error : JSON.stringify(error);
        return new Error(msg);
    }
}
//# sourceMappingURL=injected.js.map