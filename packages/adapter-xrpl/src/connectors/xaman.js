/**
 * Xaman (formerly Xumm) wallet connector for the XRP Ledger.
 *
 * Detects `window.xaman` (or legacy `window.xumm`) and wraps it with
 * the standard {@link XrplConnector} interface.
 *
 * Xaman uses a payload-based flow: you submit a transaction payload,
 * the user approves it in the wallet, and you receive the signed result.
 *
 * @see https://xaman.app/
 *
 * @example
 * ```ts
 * const xaman = new XamanConnector();
 * if (xaman.isAvailable()) {
 *   const result = await xaman.connect();
 *   console.log(result.accounts); // ["rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH"]
 * }
 * ```
 */
export class XamanConnector {
    constructor() {
        this.id = 'xaman';
        this.name = 'Xaman Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">X</text></svg>';
        this.platforms = ['browser', 'mobile', 'extension'];
        this.supportedFeatures = [
            'xrpl:connect',
            'xrpl:signTransaction',
            'xrpl:sendXRP',
            'xrpl:getBalance',
            'xrpl:accountSettings',
            'xrpl:trustLine',
            'xrpl:nftMint',
            'xrpl:nftBurn',
            'xrpl:signMessage',
            'xrpl:switchNetwork',
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
        const result = (await provider.request({
            method: 'connect',
            params: { network: params?.network ?? 'mainnet' },
        }));
        this._bindProviderEvents(provider);
        return {
            accounts: [result.account.address],
            network: result.network,
            provider: provider,
        };
    }
    async disconnect() {
        const provider = this._provider;
        if (provider) {
            try {
                await provider.request({ method: 'disconnect' });
            }
            catch {
                // Xaman may not support programmatic disconnect
            }
        }
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
        const result = (await provider.request({
            method: 'getAccount',
        }));
        return [result.address];
    }
    async getNetwork() {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'getNetwork',
        }));
        return result.network;
    }
    async switchNetwork(network) {
        const provider = this._getProviderOrThrow();
        await provider.request({
            method: 'switchNetwork',
            params: { network },
        });
    }
    // ─── XRPL-native methods ────────────────────────────────────────
    async signTransaction(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'sign',
            params: {
                txjson: params.transaction,
            },
        }));
        return {
            signedTransaction: result.signedTransaction,
            txBlob: result.txBlob,
        };
    }
    async sendXRP(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'sendXRP',
            params: {
                destination: params.destination,
                amount: params.amount,
                destinationTag: params.destinationTag,
                memo: params.memo,
            },
        }));
        return { transactionHash: result.transactionHash };
    }
    async getBalance(address) {
        const provider = this._getProviderOrThrow();
        const account = address ?? (await this.getAccounts())[0];
        const result = (await provider.request({
            method: 'getBalance',
            params: { address: account },
        }));
        return { balance: result.balance, unit: 'drops' };
    }
    async updateAccountSettings(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'accountSet',
            params: {
                requireDestTag: params.requireDestTag,
                requireAuth: params.requireAuth,
                disallowIncomingXrp: params.disallowIncomingXrp,
                domain: params.domain,
                emailHash: params.emailHash,
                regularKey: params.regularKey,
                transferFee: params.transferFee,
            },
        }));
        return { transactionHash: result.transactionHash };
    }
    async setTrustLine(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'trustSet',
            params: {
                counterparty: params.counterparty,
                currency: params.currency,
                limit: params.limit,
                qualityIn: params.qualityIn,
                qualityOut: params.qualityOut,
            },
        }));
        return { transactionHash: result.transactionHash };
    }
    async mintNFT(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'nftMint',
            params: {
                tokenTaxon: params.tokenTaxon,
                uri: params.uri,
                transferFee: params.transferFee,
                flags: params.flags,
            },
        }));
        return { nftId: result.nftId, transactionHash: result.transactionHash };
    }
    async burnNFT(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'nftBurn',
            params: {
                nftId: params.nftId,
            },
        }));
        return { transactionHash: result.transactionHash };
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
        if (win.xaman) {
            this._provider = win.xaman;
        }
        else if (win.xumm) {
            // Legacy Xumm name
            this._provider = win.xumm;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('Xaman Wallet not found. Install the Xaman app: https://xaman.app/');
        }
        return this._provider;
    }
    _bindProviderEvents(provider) {
        provider.on('accountChanged', (account) => {
            const handlers = this._handlers.get('accountsChanged') ?? new Set();
            for (const handler of handlers) {
                handler(account);
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
/**
 * Announce the Xaman XRPL provider via EIP-6963 event.
 */
export function announceXamanEIP6963() {
    if (typeof window === 'undefined')
        return;
    const win = window;
    if (!win.xaman && !win.xumm)
        return;
    const provider = win.xaman ?? win.xumm;
    const detail = {
        info: {
            uuid: crypto.randomUUID(),
            name: 'Xaman Wallet',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">X</text></svg>',
            rdns: 'app.xaman',
        },
        provider: provider,
    };
    window.addEventListener('eip6963:requestProvider', () => {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    });
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
}
//# sourceMappingURL=xaman.js.map