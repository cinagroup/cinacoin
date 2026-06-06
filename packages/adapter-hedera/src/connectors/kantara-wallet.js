/**
 * Kantara Wallet connector for Hedera Hashgraph.
 *
 * Detects `window.kantara` and wraps it with the standard
 * {@link HederaConnector} interface.
 *
 * @see https://kantarawallet.com/
 *
 * @example
 * ```ts
 * const kantara = new KantaraWalletConnector();
 * if (kantara.isAvailable()) {
 *   const result = await kantara.connect();
 *   console.log(result.accounts); // ["0.0.12345"]
 * }
 * ```
 */
export class KantaraWalletConnector {
    constructor() {
        this.id = 'kantara';
        this.name = 'Kantara Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%237C3AED"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">K</text></svg>';
        this.platforms = ['browser', 'mobile', 'extension'];
        this.supportedFeatures = [
            'hedera:connect',
            'hedera:signTransaction',
            'hedera:executeTransaction',
            'hedera:getBalance',
            'hedera:transferHbar',
            'hedera:transferToken',
            'hedera:contractCall',
            'hedera:signMessage',
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
            accounts: result.accounts,
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
                // Kantara may not support programmatic disconnect
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
            method: 'getAccounts',
        }));
        return result.accounts;
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
    // ─── Hedera-native methods ──────────────────────────────────────
    async signTransaction(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'signTransaction',
            params: {
                transactionBytes: params.transaction,
            },
        }));
        return { signedTransaction: result.signedTransactionBytes };
    }
    async executeTransaction(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'executeTransaction',
            params: {
                transactionBytes: params.transaction,
            },
        }));
        return { transactionId: result.transactionId };
    }
    async getBalance(accountId) {
        const provider = this._getProviderOrThrow();
        const account = accountId ?? (await this.getAccounts())[0];
        const result = (await provider.request({
            method: 'getBalance',
            params: { accountId: account },
        }));
        return { balance: result.balance, unit: 'tinybar' };
    }
    async transferHbar(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'transferHbar',
            params: {
                recipient: params.recipient,
                amount: params.amount,
                memo: params.memo,
            },
        }));
        return { transactionId: result.transactionId };
    }
    async transferToken(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'transferToken',
            params: {
                tokenId: params.tokenId,
                recipient: params.recipient,
                amount: params.amount,
                memo: params.memo,
            },
        }));
        return { transactionId: result.transactionId };
    }
    async contractCall(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'contractCall',
            params: {
                contractId: params.contractId,
                functionParameters: params.functionParameters,
                gas: params.gas,
                amount: params.amount,
            },
        }));
        return { transactionId: result.transactionId };
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
        if (win.kantara) {
            this._provider = win.kantara;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('Kantara Wallet not found. Install the Kantara Wallet extension: https://kantarawallet.com/');
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
/**
 * Announce the Kantara Hedera provider via EIP-6963 event.
 */
export function announceKantaraEIP6963() {
    if (typeof window === 'undefined')
        return;
    const win = window;
    if (!win.kantara)
        return;
    const detail = {
        info: {
            uuid: crypto.randomUUID(),
            name: 'Kantara Wallet',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%237C3AED"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">K</text></svg>',
            rdns: 'com.kantarawallet',
        },
        provider: win.kantara,
    };
    window.addEventListener('eip6963:requestProvider', () => {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    });
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
}
//# sourceMappingURL=kantara-wallet.js.map