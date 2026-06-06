/**
 * HashPack Wallet connector for Hedera Hashgraph.
 *
 * Detects `window.hedera.hashpack` and wraps it with the standard
 * {@link HederaConnector} interface.
 *
 * @see https://www.hashpack.app/
 *
 * @example
 * ```ts
 * const hashpack = new HashPackConnector();
 * if (hashpack.isAvailable()) {
 *   const result = await hashpack.connect();
 *   console.log(result.accounts); // ["0.0.12345"]
 * }
 * ```
 */
export class HashPackConnector {
    constructor() {
        this.id = 'hashpack';
        this.name = 'HashPack Wallet';
        this.icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">HP</text></svg>';
        this.platforms = ['browser', 'extension'];
        this.supportedFeatures = [
            'hedera:connect',
            'hedera:signTransaction',
            'hedera:executeTransaction',
            'hedera:getBalance',
            'hedera:transferHbar',
            'hedera:transferToken',
            'hedera:contractCall',
            'hedera:switchNetwork',
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
            accounts: [result.account],
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
                // HashPack may not support programmatic disconnect
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
        return [result.account];
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
            method: 'changeNetwork',
            params: { network },
        });
    }
    // ─── Hedera-native methods ──────────────────────────────────────
    async signTransaction(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'signTransaction',
            params: {
                transactionData: params.transaction,
            },
        }));
        return { signedTransaction: result.signedTransaction };
    }
    async executeTransaction(params) {
        const provider = this._getProviderOrThrow();
        const result = (await provider.request({
            method: 'executeTransaction',
            params: {
                transactionData: params.transaction,
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
        if (win.hedera?.hashpack) {
            this._provider = win.hedera.hashpack;
        }
    }
    _getProviderOrThrow() {
        this._captureProvider();
        if (!this._provider) {
            throw new Error('HashPack Wallet not found. Install the HashPack browser extension: https://www.hashpack.app/');
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
 * Announce the HashPack Hedera provider via EIP-6963 event.
 */
export function announceHashPackEIP6963() {
    if (typeof window === 'undefined')
        return;
    const win = window;
    if (!win.hedera?.hashpack)
        return;
    const detail = {
        info: {
            uuid: crypto.randomUUID(),
            name: 'HashPack Wallet',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">HP</text></svg>',
            rdns: 'app.hashpack',
        },
        provider: win.hedera.hashpack,
    };
    window.addEventListener('eip6963:requestProvider', () => {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    });
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
}
//# sourceMappingURL=hashpack.js.map