/**
 * Leather Wallet connector for native Bitcoin.
 *
 * Detects `window.leather.bitcoin` and wraps it with the standard
 * {@link BitcoinConnector} interface.
 *
 * Leather also supports Stacks — this connector focuses on Bitcoin functionality
 * while exposing the Stacks integration surface via `request()` calls.
 *
 * @see https://leather.io/
 *
 * @example
 * ```ts
 * const leather = new LeatherConnector();
 * if (leather.isAvailable()) {
 *   const result = await leather.connect();
 *   console.log(result.accounts);
 * }
 * ```
 */
export class LeatherConnector {
    constructor() {
        this.id = 'leather';
        this.name = 'Leather Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="%233D5AFE"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="white" font-family="sans-serif" font-weight="bold">L</text></svg>';
        this.platforms = ['browser', 'extension'];
        this.supportedFeatures = [
            'bitcoin:connect',
            'bitcoin:signMessage',
            'bitcoin:signPsbt',
            'bitcoin:sendTransfer',
            'bitcoin:signTransaction',
            'bitcoin:ordinals',
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
        // Leather uses `getAddress` to request connection and retrieve addresses
        const response = (await provider.request({
            method: 'getAddress',
            params: { purpose: 'ordinals' },
        }));
        // Leather defaults to mainnet
        const network = 'mainnet';
        this._bindProviderEvents(provider);
        return { accounts: [response.address], network, provider: provider };
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
        // Leather expects `params` as a Record, not an array
        const leatherParams = {};
        if (args.params && Array.isArray(args.params)) {
            args.params.forEach((p, i) => {
                leatherParams[`arg${i}`] = p;
            });
        }
        return provider.request({ method: args.method, params: leatherParams });
    }
    async getAccounts() {
        const provider = this._getProviderOrThrow();
        const response = (await provider.request({
            method: 'getAddresses',
        }));
        return response.addresses.map((a) => a.address);
    }
    async getNetwork() {
        // Leather doesn't have a native network getter for Bitcoin; default to mainnet
        return 'mainnet';
    }
    async switchNetwork(_network) {
        throw new Error('Leather Wallet does not support programmatic network switching for Bitcoin. ' +
            'Please change the network in the extension settings.');
    }
    // ─── Bitcoin-native methods ─────────────────────────────────────
    async signMessage(params) {
        const provider = this._getProviderOrThrow();
        const response = (await provider.request({
            method: 'signMessage',
            params: {
                message: params.message,
                address: params.address,
            },
        }));
        return { signature: response.signature };
    }
    async signPsbt(params) {
        const provider = this._getProviderOrThrow();
        const response = (await provider.request({
            method: 'signPsbt',
            params: {
                psbt: params.psbt,
                signInputs: params.signInputs,
            },
        }));
        return { psbt: response.psbt };
    }
    async sendTransfer(params) {
        const provider = this._getProviderOrThrow();
        const response = (await provider.request({
            method: 'sendTransfer',
            params: {
                address: params.recipient,
                amount: params.amount,
                feeRate: params.feeRate,
            },
        }));
        return { txid: response.txid };
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
        if (win.leather?.bitcoin) {
            this._provider = win.leather.bitcoin;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('Leather Wallet not found. Install the Leather browser extension: https://leather.io/');
        }
        return this._provider;
    }
    _bindProviderEvents(provider) {
        provider.on('addressesChanged', (addresses) => {
            const handlers = this._handlers.get('accountsChanged') ?? new Set();
            for (const handler of handlers) {
                handler(addresses);
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
// ─── Stacks Integration Helper ──────────────────────────────────────
/**
 * Send a Stacks request through Leather.
 *
 * Leather uses the same `window.leather` surface for Stacks operations.
 * This helper provides typed access to Stacks-specific methods.
 *
 * @param leather Connector instance
 * @param method Stacks method name (e.g. 'stx_getAddress', 'stx_signMessage')
 * @param params Method parameters
 * @returns Typed response
 */
export async function leatherStacksRequest(leather, method, params) {
    return leather.request({
        method,
        params: params ? Object.values(params) : undefined,
    });
}
//# sourceMappingURL=leather.js.map