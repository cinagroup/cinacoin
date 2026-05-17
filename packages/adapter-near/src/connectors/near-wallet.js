/**
 * NEAR Official Wallet Connector.
 *
 * Interfaces with the official NEAR Wallet (wallet.near.org) via the
 * NEAR Wallet Selector or direct browser redirect flow.
 */
/**
 * NEAR official wallet connector.
 *
 * Connects to wallet.near.org using the browser redirect flow or
 * Wallet Selector integration.
 */
export class NearWalletConnector {
    constructor() {
        this.id = 'near-wallet';
        this.name = 'NEAR Wallet';
        this.provider = null;
        this.accountId = null;
    }
    /**
     * Check if the NEAR Wallet Selector is available.
     */
    isAvailable() {
        if (typeof window === 'undefined')
            return false;
        return !!window.near || !!window.nearWalletSelector;
    }
    /**
     * Connect to NEAR Wallet.
     * Opens wallet.near.org for approval in browser redirect flow,
     * or uses the Wallet Selector if available.
     * @returns The connected NEAR account id (e.g. "alice.near").
     */
    async connect() {
        const provider = this._getProvider();
        if (!provider) {
            throw new Error('NEAR Wallet Selector not found. Install @near-wallet-selector/core or visit https://wallet.near.org');
        }
        const accounts = await provider.signIn({});
        const accountList = await provider.getAccounts();
        if (!accountList || accountList.length === 0) {
            throw new Error('No accounts returned from NEAR Wallet');
        }
        this.provider = provider;
        this.accountId = accountList[0].accountId;
        return this.accountId;
    }
    /**
     * Disconnect from NEAR Wallet.
     */
    async disconnect() {
        if (this.provider) {
            try {
                await this.provider.signOut();
            }
            catch {
                // May already be signed out
            }
            this.provider = null;
            this.accountId = null;
        }
    }
    /**
     * Get the connected account id.
     */
    getAccountId() {
        return this.accountId;
    }
    /**
     * Sign a NEAR transaction.
     * @param tx - NEAR transaction with function calls or transfer actions.
     * @returns Transaction hash (hex string).
     */
    async signTransaction(tx) {
        if (!this.provider)
            throw new Error('NEAR Wallet not connected');
        const account = await this.provider.account();
        const actions = Array.isArray(tx.actions) ? tx.actions : [tx.actions];
        // Execute each action; the wallet handles signing
        let lastResult = null;
        for (const action of actions) {
            lastResult = await this._executeAction(account, action);
        }
        if (!lastResult) {
            throw new Error('No transaction result returned');
        }
        return lastResult.transactionHash;
    }
    /**
     * Send a NEAR transaction (sign + broadcast).
     * @param tx - NEAR transaction.
     * @returns Transaction result with hash.
     */
    async sendTransaction(tx) {
        if (!this.provider)
            throw new Error('NEAR Wallet not connected');
        const account = await this.provider.account();
        const actions = Array.isArray(tx.actions) ? tx.actions : [tx.actions];
        // For single transfer, use direct sendMoney
        if (actions.length === 1 && this._isTransfer(actions[0])) {
            const transfer = actions[0];
            return account.sendMoney({ receiverId: transfer.receiverId, amount: transfer.amount });
        }
        // For function calls, execute each
        let lastResult = null;
        for (const action of actions) {
            lastResult = await this._executeAction(account, action);
        }
        if (!lastResult) {
            throw new Error('No transaction result returned');
        }
        return lastResult;
    }
    /**
     * Sign a message using the connected account.
     * @param message - Message to sign.
     * @param recipient - Optional recipient domain for security.
     * @returns Signature as a base64 string.
     */
    async signMessage(message, recipient) {
        if (!this.provider)
            throw new Error('NEAR Wallet not connected');
        // NEAR Wallet uses a specific message signing protocol
        const nonce = Buffer.from(Math.random().toString(36).slice(2), 'utf8');
        const recipientDomain = recipient ?? window.location.host;
        // Construct NEAR message signing payload
        const payload = {
            message,
            nonce,
            recipient: recipientDomain,
        };
        // The wallet selector handles message signing via wallet.request
        if (this.provider && 'request' in this.provider) {
            const result = await this.provider.request?.({
                method: 'signMessage',
                params: payload,
            });
            return result?.signature ?? '';
        }
        // Fallback: throw as NEAR Wallet may not support direct message signing
        throw new Error('Message signing not directly supported by NEAR Wallet browser flow. ' +
            'Use a wallet selector with signMessage capability.');
    }
    /** Get the underlying provider for advanced use cases. */
    getProvider() {
        return this.provider;
    }
    /* ---- Private helpers ---- */
    _getProvider() {
        if (this.provider)
            return this.provider;
        if (typeof window === 'undefined')
            return null;
        // Try Wallet Selector first
        if (window.nearWalletSelector?.wallet) {
            return window.nearWalletSelector.wallet;
        }
        // Fallback to direct near provider
        return window.near ?? null;
    }
    _isTransfer(action) {
        return 'receiverId' in action && 'amount' in action;
    }
    async _executeAction(account, action) {
        if (this._isTransfer(action)) {
            return account.sendMoney({ receiverId: action.receiverId, amount: action.amount });
        }
        return account.functionCall({
            contractId: action.contractId,
            methodName: action.methodName,
            args: action.args ? JSON.parse(action.args) : {},
            gas: action.gas,
            amount: action.deposit,
        });
    }
}
//# sourceMappingURL=near-wallet.js.map