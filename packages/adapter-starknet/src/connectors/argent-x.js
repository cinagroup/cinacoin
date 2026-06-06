/**
 * Argent X Wallet Connector.
 *
 * Interfaces with the Argent X browser extension wallet for Starknet.
 * Argent X natively supports account abstraction via the Argent account contract.
 */
/**
 * Argent X wallet connector for Starknet.
 *
 * Provides a standardized interface over the Argent X browser extension,
 * leveraging Starknet's native account abstraction through the Argent
 * account contract.
 */
export class ArgentXConnector {
    constructor() {
        this.id = 'argent-x';
        this.name = 'Argent X';
        this.provider = null;
        this.accountAddress = null;
    }
    /**
     * Check if the Argent X extension is installed.
     */
    isInstalled() {
        if (typeof window === 'undefined')
            return false;
        return !!window.argentX;
    }
    /**
     * Connect to Argent X wallet.
     * @returns The connected Starknet account address.
     */
    async connect() {
        const provider = this._getProvider();
        if (!provider) {
            throw new Error('Argent X wallet is not installed. Install it from https://www.argent.xyz/argent-x/');
        }
        const account = await provider.enable({ starknetVersion: 'v5' });
        this.provider = provider;
        this.accountAddress = account.address;
        return account.address;
    }
    /**
     * Disconnect from Argent X wallet.
     */
    async disconnect() {
        if (this.provider) {
            try {
                await this.provider.disconnect();
            }
            catch {
                // Wallet may already be disconnected
            }
            this.provider = null;
            this.accountAddress = null;
        }
    }
    /**
     * Get the connected account address.
     */
    getAccount() {
        return this.accountAddress;
    }
    /**
     * Sign a Starknet transaction (does not broadcast).
     */
    async signTransaction(calls) {
        if (!this.provider)
            throw new Error('Argent X not connected');
        const account = this.provider.account;
        if (!account)
            throw new Error('No account available from Argent X');
        return account.execute(calls, {});
    }
    /**
     * Execute a Starknet transaction on the connected wallet.
     * Leverages native account abstraction — the wallet's account contract
     * handles fee estimation, nonce management, and validation.
     */
    async executeTransaction(calls, details) {
        if (!this.provider)
            throw new Error('Argent X not connected');
        const account = this.provider.account;
        if (!account)
            throw new Error('No account available from Argent X');
        // Auto-estimate maxFee if not provided
        let maxFee = details?.maxFee;
        if (!maxFee) {
            const feeEstimate = await account.estimateFee(calls);
            maxFee = feeEstimate.suggestedMaxFee;
        }
        const result = await account.execute(calls, {
            maxFee,
            nonce: details?.nonce,
            version: details?.version,
        });
        return { transactionHash: result.transaction_hash };
    }
    /**
     * Sign a message using the connected account.
     */
    async signMessage(message) {
        if (!this.provider)
            throw new Error('Argent X not connected');
        const account = this.provider.account;
        if (!account)
            throw new Error('No account available from Argent X');
        const result = await account.signMessage(typeof message === 'string' ? { domain: {}, types: {}, message: { content: message } } : message);
        return JSON.stringify(result);
    }
    /** Get the underlying provider for advanced use cases. */
    getProvider() {
        return this.provider;
    }
    _getProvider() {
        if (this.provider)
            return this.provider;
        if (typeof window === 'undefined')
            return null;
        return window.argentX ?? null;
    }
}
//# sourceMappingURL=argent-x.js.map