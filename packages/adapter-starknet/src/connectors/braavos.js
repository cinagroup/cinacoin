/**
 * Braavos Wallet Connector.
 *
 * Interfaces with the Braavos browser extension and mobile wallet for Starknet.
 * Braavos natively supports account abstraction with hardware-enclave signing.
 */
/**
 * Braavos wallet connector for Starknet.
 *
 * Provides a standardized interface over the Braavos browser extension / mobile wallet,
 * leveraging Starknet's native account abstraction through the Braavos account
 * contract with hardware-enclave security.
 */
export class BraavosConnector {
    constructor() {
        this.id = 'braavos';
        this.name = 'Braavos';
        this.provider = null;
        this.accountAddress = null;
    }
    /**
     * Check if the Braavos extension is installed.
     */
    isInstalled() {
        if (typeof window === 'undefined')
            return false;
        return !!window.braavos;
    }
    /**
     * Connect to Braavos wallet.
     * @returns The connected Starknet account address.
     */
    async connect() {
        const provider = this._getProvider();
        if (!provider) {
            throw new Error('Braavos wallet is not installed. Install it from https://braavos.app/');
        }
        const account = await provider.enable({ starknetVersion: 'v5' });
        this.provider = provider;
        this.accountAddress = account.address;
        return account.address;
    }
    /**
     * Disconnect from Braavos wallet.
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
            throw new Error('Braavos not connected');
        const account = this.provider.account;
        if (!account)
            throw new Error('No account available from Braavos');
        return account.execute(calls, {});
    }
    /**
     * Execute a Starknet transaction on the connected wallet.
     * Leverages native account abstraction — the wallet's account contract
     * handles fee estimation, nonce management, and validation.
     */
    async executeTransaction(calls, details) {
        if (!this.provider)
            throw new Error('Braavos not connected');
        const account = this.provider.account;
        if (!account)
            throw new Error('No account available from Braavos');
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
            throw new Error('Braavos not connected');
        const account = this.provider.account;
        if (!account)
            throw new Error('No account available from Braavos');
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
        return window.braavos ?? null;
    }
}
//# sourceMappingURL=braavos.js.map