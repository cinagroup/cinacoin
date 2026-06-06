/**
 * Keplr wallet connector for Cosmos SDK chains.
 *
 * Detects `window.keplr` and provides a uniform `CosmosWalletConnector`
 * interface for signing transactions, querying accounts, and sending
 * token transfers across all Cosmos SDK chains supported by Keplr.
 *
 * @see https://docs.keplr.app/api/
 */
/* ------------------------------------------------------------------ */
/*  KeplrConnector                                                      */
/* ------------------------------------------------------------------ */
/**
 * Keplr wallet connector implementing `CosmosWalletConnector`.
 *
 * Wraps the Keplr browser extension API to provide chain-agnostic
 * signing, transfer, and account querying capabilities.
 */
export class KeplrConnector {
    constructor() {
        /** @inheritdoc */
        this.id = 'keplr';
        /** @inheritdoc */
        this.name = 'Keplr';
        this._keplr = null;
        this._connectedChainId = null;
    }
    /* ---- Availability ---- */
    /**
     * Check whether the Keplr extension is installed.
     *
     * In browser environments, looks for `window.keplr`.
     * Returns `false` in SSR / Node.js contexts.
     */
    isAvailable() {
        if (typeof window === 'undefined')
            return false;
        const win = window;
        return typeof win.keplr === 'object' && win.keplr !== null;
    }
    /**
     * Retrieve the Keplr provider from `window.keplr`.
     *
     * Waits for the `keplr_keystorechange` event to ensure the extension
     * has fully initialized before returning the provider.
     *
     * @param timeoutMs - Max wait time in ms (default 5000).
     * @returns The Keplr provider.
     */
    async getProvider(timeoutMs = 5000) {
        if (this._keplr)
            return this._keplr;
        if (typeof window === 'undefined') {
            throw new Error('Keplr is only available in browser environments');
        }
        const win = window;
        const keplr = win.keplr;
        if (keplr) {
            this._keplr = keplr;
            return keplr;
        }
        // Keplr may not be injected yet — wait for it
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                window.removeEventListener('keplr_keystorechange', handler);
                reject(new Error('Keplr not found after timeout'));
            }, timeoutMs);
            const handler = () => {
                const found = window.keplr;
                if (found) {
                    clearTimeout(timeout);
                    window.removeEventListener('keplr_keystorechange', handler);
                    this._keplr = found;
                    resolve(found);
                }
            };
            window.addEventListener('keplr_keystorechange', handler);
        });
    }
    /* ---- Connection ---- */
    /**
     * Connect to Keplr and enable access for the specified chain.
     *
     * Prompts the user to approve the connection if not already granted.
     *
     * @param chainId - Cosmos chain ID (e.g. "cosmoshub-4").
     * @returns Connected address and chain ID.
     */
    async connect(chainId) {
        const keplr = await this.getProvider();
        await keplr.enable(chainId);
        const key = await keplr.getKey(chainId);
        this._connectedChainId = chainId;
        return {
            address: key.bech32Address,
            chainId,
        };
    }
    /**
     * Disconnect from Keplr and revoke all chain permissions.
     */
    async disconnect() {
        const keplr = await this.getProvider();
        await keplr.disconnect();
        this._keplr = null;
        this._connectedChainId = null;
    }
    /* ---- Accounts ---- */
    /**
     * Get accounts available on the given chain.
     *
     * @param chainId - Cosmos chain ID.
     * @returns Array of account objects with address, algo, and pubkey.
     */
    async getAccounts(chainId) {
        const keplr = await this.getProvider();
        const signer = keplr.getOfflineSigner(chainId);
        const accounts = await signer.getAccounts();
        return accounts.map((a) => ({
            address: a.address,
            algo: a.algo,
            pubkey: a.pubKey,
        }));
    }
    /**
     * Get the current chain ID from the offline signer.
     *
     * @param chainId - The chain to query.
     * @returns Chain ID string.
     */
    async getChainId(chainId) {
        const keplr = await this.getProvider();
        const signer = keplr.getOfflineSigner(chainId);
        return signer.getChainId();
    }
    /* ---- Signing ---- */
    /**
     * Sign a Cosmos SignDoc (proto-based transaction).
     *
     * Uses Keplr's `signDirect` method for ADR-036 compliant signing.
     *
     * @param signerAddress - Bech32 address of the signer.
     * @param signDoc - Transaction document to sign.
     * @returns Signature and signed document.
     */
    async sign(signerAddress, signDoc) {
        const keplr = await this.getProvider();
        const chainId = signDoc.chainId;
        const signer = keplr.getOfflineSigner(chainId);
        const result = await signer.signDirect(signerAddress, {
            bodyBytes: signDoc.bodyBytes,
            authInfoBytes: signDoc.authInfoBytes,
            chainId: signDoc.chainId,
            accountNumber: BigInt(signDoc.accountNumber),
        });
        return {
            signature: result.signature,
            signed: {
                bodyBytes: result.signed.bodyBytes,
                authInfoBytes: result.signed.authInfoBytes,
                chainId: result.signed.chainId,
                accountNumber: Number(result.signed.accountNumber),
            },
        };
    }
    /**
     * Sign arbitrary text/data (off-chain message signing).
     *
     * Uses Keplr's `signArbitrary` method. Useful for authentication
     * and data integrity verification.
     *
     * @param signerAddress - Bech32 address of the signer.
     * @param data - Data to sign (string or bytes).
     * @returns Signature bytes.
     */
    async signArbitrary(signerAddress, data) {
        const keplr = await this.getProvider();
        const chainId = this._getConnectedChainId();
        return keplr.signArbitrary(chainId, signerAddress, data);
    }
    /* ---- Transfer ---- */
    /**
     * Send a token transfer through Keplr.
     *
     * Delegates to the wallet's built-in transfer flow.
     *
     * @param chainId - Target chain ID.
     * @param recipient - Recipient bech32 address.
     * @param amount - Amount in smallest unit (string).
     * @param denom - Token denomination (e.g. "uatom").
     * @param memo - Optional memo / note.
     * @returns Transaction hash.
     */
    async sendTransfer(chainId, recipient, amount, denom, memo) {
        const keplr = await this.getProvider();
        await keplr.enable(chainId);
        // Construct a minimal MsgSend and broadcast via sendTx.
        // The full transaction building (signing, encoding, broadcasting)
        // is handled by CosmosAdapter using @cosmjs/stargate.
        // This connector method provides the raw Keplr primitives.
        const signer = keplr.getOfflineSigner(chainId);
        const accounts = await signer.getAccounts();
        const fromAddress = accounts[0]?.address;
        if (!fromAddress) {
            throw new Error('No accounts available on chain');
        }
        // Return a structured payload that CosmosAdapter can use to build
        // the full transaction via @cosmjs/stargate.
        return JSON.stringify({
            chainId,
            fromAddress,
            toAddress: recipient,
            amount: [{ denom, amount }],
            memo: memo ?? '',
        });
    }
    /* ---- Chain Suggestions ---- */
    /**
     * Suggest a custom chain to Keplr.
     *
     * Useful for chains not included in Keplr's default registry.
     *
     * @param chainInfo - Chain configuration.
     */
    async suggestChain(chainInfo) {
        const keplr = await this.getProvider();
        await keplr.experimentalSuggestChain(chainInfo);
    }
    /* ---- Events ---- */
    /**
     * Listen for Keplr keystore change events.
     *
     * Fires when the user switches accounts or chains in the extension.
     *
     * @param handler - Event handler callback.
     */
    onKeystoreChange(handler) {
        if (typeof window !== 'undefined') {
            window.addEventListener('keplr_keystorechange', handler);
        }
    }
    /**
     * Remove a keystore change event listener.
     */
    offKeystoreChange(handler) {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keplr_keystorechange', handler);
        }
    }
    /* ---- Private helpers ---- */
    /** Get the connected chain ID, throwing if not connected. */
    _getConnectedChainId() {
        if (!this._connectedChainId) {
            throw new Error('Not connected. Call connect() first.');
        }
        return this._connectedChainId;
    }
}
//# sourceMappingURL=keplr.js.map