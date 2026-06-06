/**
 * Leap wallet connector for Cosmos SDK chains.
 *
 * Detects `window.leap` and provides the same `CosmosWalletConnector`
 * interface as the Keplr connector. Leap supports a subset of Cosmos
 * chains plus additional networks like Terra and Neutron.
 *
 * @see https://docs.leapwallet.io/cosmos/leap-extension/api
 */
/* ------------------------------------------------------------------ */
/*  LeapConnector                                                       */
/* ------------------------------------------------------------------ */
/**
 * Leap wallet connector implementing `CosmosWalletConnector`.
 *
 * API surface is identical to KeplrConnector, making it trivially
 * swappable in user code.
 */
export class LeapConnector {
    constructor() {
        /** @inheritdoc */
        this.id = 'leap';
        /** @inheritdoc */
        this.name = 'Leap';
        this._leap = null;
        this._connectedChainId = null;
    }
    /* ---- Availability ---- */
    /**
     * Check whether the Leap extension is installed.
     *
     * Looks for `window.leap` in browser environments.
     * Returns `false` in SSR / Node.js contexts.
     */
    isAvailable() {
        if (typeof window === 'undefined')
            return false;
        const win = window;
        return typeof win.leap === 'object' && win.leap !== null;
    }
    /**
     * Retrieve the Leap provider from `window.leap`.
     *
     * @param timeoutMs - Max wait time in ms (default 5000).
     * @returns The Leap provider.
     */
    async getProvider(timeoutMs = 5000) {
        if (this._leap)
            return this._leap;
        if (typeof window === 'undefined') {
            throw new Error('Leap is only available in browser environments');
        }
        const win = window;
        const leap = win.leap;
        if (leap) {
            this._leap = leap;
            return leap;
        }
        // Wait for injection
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                window.removeEventListener('leap_keystorechange', handler);
                reject(new Error('Leap not found after timeout'));
            }, timeoutMs);
            const handler = () => {
                const found = window.leap;
                if (found) {
                    clearTimeout(timeout);
                    window.removeEventListener('leap_keystorechange', handler);
                    this._leap = found;
                    resolve(found);
                }
            };
            window.addEventListener('leap_keystorechange', handler);
        });
    }
    /* ---- Connection ---- */
    /**
     * Connect to Leap and enable access for the specified chain.
     *
     * @param chainId - Cosmos chain ID (e.g. "cosmoshub-4").
     * @returns Connected address and chain ID.
     */
    async connect(chainId) {
        const leap = await this.getProvider();
        await leap.enable(chainId);
        const key = await leap.getKey(chainId);
        this._connectedChainId = chainId;
        return {
            address: key.bech32Address,
            chainId,
        };
    }
    /**
     * Disconnect from Leap.
     */
    async disconnect() {
        const leap = await this.getProvider();
        await leap.disconnect();
        this._leap = null;
        this._connectedChainId = null;
    }
    /* ---- Accounts ---- */
    /**
     * Get accounts available on the given chain.
     *
     * @param chainId - Cosmos chain ID.
     * @returns Array of account objects.
     */
    async getAccounts(chainId) {
        const leap = await this.getProvider();
        const signer = leap.getOfflineSigner(chainId);
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
        const leap = await this.getProvider();
        const signer = leap.getOfflineSigner(chainId);
        return signer.getChainId();
    }
    /* ---- Signing ---- */
    /**
     * Sign a Cosmos SignDoc (proto-based transaction).
     *
     * Uses Leap's `signDirect` method for ADR-036 compliant signing.
     *
     * @param signerAddress - Bech32 address of the signer.
     * @param signDoc - Transaction document to sign.
     * @returns Signature and signed document.
     */
    async sign(signerAddress, signDoc) {
        const leap = await this.getProvider();
        const chainId = signDoc.chainId;
        const signer = leap.getOfflineSigner(chainId);
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
     * @param signerAddress - Bech32 address of the signer.
     * @param data - Data to sign.
     * @returns Signature bytes.
     */
    async signArbitrary(signerAddress, data) {
        const leap = await this.getProvider();
        const chainId = this._getConnectedChainId();
        return leap.signArbitrary(chainId, signerAddress, data);
    }
    /* ---- Transfer ---- */
    /**
     * Send a token transfer through Leap.
     *
     * Returns a structured payload for CosmosAdapter to build the full
     * transaction via @cosmjs/stargate.
     *
     * @param chainId - Target chain ID.
     * @param recipient - Recipient bech32 address.
     * @param amount - Amount in smallest unit.
     * @param denom - Token denomination.
     * @param memo - Optional memo.
     * @returns JSON-encoded transfer payload.
     */
    async sendTransfer(chainId, recipient, amount, denom, memo) {
        const leap = await this.getProvider();
        await leap.enable(chainId);
        const signer = leap.getOfflineSigner(chainId);
        const accounts = await signer.getAccounts();
        const fromAddress = accounts[0]?.address;
        if (!fromAddress) {
            throw new Error('No accounts available on chain');
        }
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
     * Suggest a custom chain to Leap.
     *
     * @param chainInfo - Chain configuration.
     */
    async suggestChain(chainInfo) {
        const leap = await this.getProvider();
        await leap.experimentalSuggestChain(chainInfo);
    }
    /* ---- Events ---- */
    /**
     * Listen for Leap keystore change events.
     *
     * @param handler - Event handler callback.
     */
    onKeystoreChange(handler) {
        if (typeof window !== 'undefined') {
            window.addEventListener('leap_keystorechange', handler);
        }
    }
    /**
     * Remove a keystore change event listener.
     */
    offKeystoreChange(handler) {
        if (typeof window !== 'undefined') {
            window.removeEventListener('leap_keystorechange', handler);
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
//# sourceMappingURL=leap.js.map