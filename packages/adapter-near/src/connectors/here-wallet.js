/**
 * Here Wallet Connector.
 *
 * Interfaces with Here Wallet (herewallet.app) — a mobile-first NEAR wallet
 * with MPC-based key management.
 */
/**
 * Here Wallet connector for NEAR.
 *
 * Provides a standardized interface over Here Wallet (herewallet.app),
 * a mobile-first NEAR wallet that supports both mobile and browser
 * environments via MPC key management.
 */
export class HereWalletConnector {
    constructor() {
        this.id = 'here-wallet';
        this.name = 'Here Wallet';
        this.provider = null;
        this.accountId = null;
    }
    /**
     * Check if Here Wallet is available.
     */
    isAvailable() {
        if (typeof window === 'undefined')
            return false;
        return !!window.hereWallet;
    }
    /**
     * Connect to Here Wallet.
     * On mobile, opens the Here Wallet app.
     * On browser, connects via the Here Wallet web interface.
     * @returns The connected NEAR account id.
     */
    async connect() {
        const provider = this._getProvider();
        if (!provider) {
            throw new Error('Here Wallet is not available. Visit https://www.herewallet.app');
        }
        const account = await provider.connect();
        this.provider = provider;
        this.accountId = account.accountId;
        return account.accountId;
    }
    /**
     * Disconnect from Here Wallet.
     */
    async disconnect() {
        if (this.provider) {
            try {
                await this.provider.disconnect();
            }
            catch {
                // May already be disconnected
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
     * @returns Transaction hash.
     */
    async signTransaction(tx) {
        if (!this.provider)
            throw new Error('Here Wallet not connected');
        const actions = Array.isArray(tx.actions) ? tx.actions : [tx.actions];
        const result = await this._sendActions(actions);
        return result.transactionHash;
    }
    /**
     * Send a NEAR transaction (sign + broadcast).
     * @param tx - NEAR transaction.
     * @returns Transaction result with hash.
     */
    async sendTransaction(tx) {
        if (!this.provider)
            throw new Error('Here Wallet not connected');
        const actions = Array.isArray(tx.actions) ? tx.actions : [tx.actions];
        return this._sendActions(actions);
    }
    /**
     * Sign a message using the connected account.
     * @param message - Message to sign.
     * @param recipient - Optional recipient domain.
     * @returns Signature as a string.
     */
    async signMessage(message, recipient) {
        if (!this.provider)
            throw new Error('Here Wallet not connected');
        const recipientDomain = recipient ?? (typeof window !== 'undefined' ? window.location.host : '');
        const result = await this.provider.signMessage({
            message,
            recipient: recipientDomain,
        });
        return result.signature;
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
        return window.hereWallet ?? null;
    }
    async _sendActions(actions) {
        if (!this.provider)
            throw new Error('Here Wallet not connected');
        if (!this.accountId)
            throw new Error('No account connected');
        // Single transfer: use sendMoney
        if (actions.length === 1 && this._isTransfer(actions[0])) {
            const transfer = actions[0];
            return this.provider.sendMoney({ receiverId: transfer.receiverId, amount: transfer.amount });
        }
        // Multiple actions: use signAndSendTransaction
        const nearActions = actions.map((a) => {
            if (this._isTransfer(a)) {
                return {
                    type: 'Transfer',
                    params: { deposit: a.amount },
                };
            }
            const fc = a;
            return {
                type: 'FunctionCall',
                params: {
                    contractId: fc.contractId,
                    methodName: fc.methodName,
                    args: fc.args ? JSON.parse(fc.args) : {},
                    gas: fc.gas ?? '30000000000000',
                    deposit: fc.deposit,
                },
            };
        });
        return this.provider.signAndSendTransaction({
            receiverId: this._getReceiverId(actions),
            actions: nearActions,
        });
    }
    _isTransfer(action) {
        return 'receiverId' in action && 'amount' in action;
    }
    _getReceiverId(actions) {
        for (const a of actions) {
            if (this._isTransfer(a))
                return a.receiverId;
        }
        // Default to the first function call's contract
        return actions[0].contractId;
    }
}
//# sourceMappingURL=here-wallet.js.map