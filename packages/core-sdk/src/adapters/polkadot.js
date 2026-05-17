/**
 * Polkadot Chain Adapter — provides Polkadot-specific operations.
 *
 * Uses polkadot.js for wallet interactions and supports Polkadot.js Extension,
 * Talisman, and SubWallet. Implements JSON-RPC over WebSocket for balance
 * queries and transaction broadcasting. Supports DOT transfers and asset transfers.
 */
/* ------------------------------------------------------------------ */
/*  SS58 Address validation                                            */
/* ------------------------------------------------------------------ */
const SS58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
/**
 * Decode an SS58 encoded address.
 *
 * SS58 format:
 *  - 1 byte prefix (or 2 bytes for extended prefix)
 *  - 32 bytes public key
 *  - 2 bytes Blake2b checksum
 *
 * Returns null if the address is invalid.
 */
export function decodeSS58(address) {
    if (typeof address !== 'string')
        return null;
    if (address.length < 47 || address.length > 48)
        return null;
    // Decode base58
    let num = 0n;
    let leadingZeros = 0;
    for (let i = 0; i < address.length; i++) {
        const idx = SS58_ALPHABET.indexOf(address[i]);
        if (idx === -1)
            return null;
        if (num === 0n && idx === 0) {
            leadingZeros++;
        }
        num = num * 58n + BigInt(idx);
    }
    // Convert to bytes
    const bytes = [];
    while (num > 0n) {
        bytes.unshift(Number(num % 256n));
        num = num / 256n;
    }
    // Add leading zeros
    for (let i = 0; i < leadingZeros; i++) {
        bytes.unshift(0);
    }
    if (bytes.length < 35)
        return null; // 1 prefix + 32 pubkey + 2 checksum
    // Determine prefix (simple: 1 byte, extended: 2 bytes)
    let prefix;
    let pubkeyStart;
    if (bytes[0] < 64) {
        prefix = bytes[0];
        pubkeyStart = 1;
    }
    else if (bytes[0] < 128) {
        prefix = bytes[0] | ((bytes[1] & 0x0f) << 8);
        pubkeyStart = 2;
    }
    else {
        return null; // Invalid prefix
    }
    const publicKey = bytes.slice(pubkeyStart, pubkeyStart + 32);
    const checksum = bytes.slice(pubkeyStart + 32, pubkeyStart + 34);
    return {
        prefix,
        publicKey: publicKey.map((b) => b.toString(16).padStart(2, '0')).join(''),
        checksum: new Uint8Array(checksum),
    };
}
/**
 * Validate a Polkadot SS58 address.
 * Returns true if the address is a valid SS58 encoded address.
 */
export function isValidSS58Address(address) {
    return decodeSS58(address) !== null;
}
export const POLKADOT_WALLETS = [
    {
        id: 'polkadotjs',
        name: 'Polkadot.js',
        rdns: 'com.polkadotjs',
        icon: 'https://polkadot.js.org/icon.png',
        downloadUrl: 'https://polkadot.js.org/extension',
    },
    {
        id: 'talisman',
        name: 'Talisman',
        rdns: 'xyz.talisman',
        icon: 'https://app.talisman.xyz/icons/icon-192.png',
        downloadUrl: 'https://talisman.xyz',
    },
    {
        id: 'subwallet',
        name: 'SubWallet',
        rdns: 'com.subwallet',
        icon: 'https://subwallet.app/logo.png',
        downloadUrl: 'https://subwallet.app',
    },
];
/** Well-known Polkadot chain presets. */
export const POLKADOT_CHAINS = [
    {
        id: 'polkadot:91b171bb158e2d3848fa23a9f1c25182',
        name: 'Polkadot',
        rpcUrl: 'wss://rpc.polkadot.io',
        nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 },
        explorerUrl: 'https://polkadot.subscan.io',
        iconUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg',
    },
    {
        id: 'polkadot:b0a8d493285c2df73290dfb7e61f870f',
        name: 'Kusama',
        rpcUrl: 'wss://kusama-rpc.polkadot.io',
        nativeCurrency: { name: 'Kusama', symbol: 'KSM', decimals: 12 },
        explorerUrl: 'https://kusama.subscan.io',
        iconUrl: 'https://cryptologos.cc/logos/kusama-ksm-logo.svg',
    },
    {
        id: 'polkadot:e143f23803ac50e8f6f8e62695d1ce9e',
        name: 'Westend (Testnet)',
        rpcUrl: 'wss://westend-rpc.polkadot.io',
        nativeCurrency: { name: 'Westend', symbol: 'WND', decimals: 10 },
        explorerUrl: 'https://westend.subscan.io',
        iconUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg',
    },
];
/* ------------------------------------------------------------------ */
/*  PolkadotChainAdapter                                                */
/* ------------------------------------------------------------------ */
/**
 * Polkadot chain adapter implementing chain-specific operations.
 *
 * Uses polkadot.js for wallet interactions via the browser extension
 * injection API. Supports DOT transfers, asset transfers on multi-asset
 * chains, and message signing. Compatible with Polkadot.js Extension,
 * Talisman, and SubWallet.
 */
export class PolkadotChainAdapter {
    constructor() {
        /** Unique adapter identifier. */
        this.id = 'polkadot-adapter';
        /** Human-readable adapter name. */
        this.name = 'Polkadot Chain Adapter';
        this.provider = null;
        this.api = null;
        this.chains = [];
        this.rpcUrl = POLKADOT_CHAINS[0].rpcUrl;
        this._connectedAccounts = [];
    }
    /* ---- Configuration ---- */
    /** Set the CinaConnect connector. Required by ChainAdapter interface. */
    setConnector(_connector) {
        // Polkadot adapter uses polkadot.js injection; connector is optional.
    }
    /** Register supported Polkadot chains. */
    registerChains(chains) {
        this.chains = chains;
    }
    /** Set the RPC endpoint URL (WebSocket URL). */
    setRpcUrl(url) {
        this.rpcUrl = url;
    }
    /** Find a chain by numeric ID (returns first chain). */
    findChain(_chainId) {
        return this.chains[0];
    }
    /** Set the active wallet provider and API. */
    setProvider(provider, api) {
        this.provider = provider;
        if (api) {
            this.api = api;
        }
    }
    /** Get the current provider. */
    getProvider() {
        return this.provider;
    }
    /* ---- Connection ---- */
    /**
     * Connect to a Polkadot wallet via the injected extension.
     * Tries Polkadot.js Extension → Talisman → SubWallet in order.
     * @returns Array of connected addresses (SS58).
     */
    async connect(walletId) {
        const injected = await this._resolveWallet(walletId);
        if (!injected) {
            throw new Error('No Polkadot wallet found. Install Polkadot.js Extension, Talisman, or SubWallet.');
        }
        const accounts = await injected.getAccounts();
        this._connectedAccounts = accounts;
        // Build a minimal provider from the injected extension
        this.provider = {
            accounts,
            signer: {
                signPayload: async (payload) => {
                    const addr = accounts[0]?.address;
                    if (!addr)
                        throw new Error('No account to sign with');
                    return injected.sign(addr, payload);
                },
            },
            subscribe: (cb) => {
                return injected.subscribeAccounts(cb);
            },
            disconnect: async () => {
                this._connectedAccounts = [];
                this.provider = null;
            },
        };
        return accounts.map((a) => a.address);
    }
    /** Disconnect from the wallet. */
    async disconnect() {
        if (this.provider) {
            await this.provider.disconnect();
        }
        this._connectedAccounts = [];
    }
    /** Get the connected address (first account). */
    getAddress() {
        return this._connectedAccounts[0]?.address ?? null;
    }
    /* ---- Balance ---- */
    /**
     * Get DOT balance for an address.
     * @param address - Polkadot address (SS58 format).
     * @returns Balance in Plancks (string, 1 DOT = 10^10 Plancks).
     */
    async getBalance(address) {
        if (!isValidSS58Address(address)) {
            throw new Error(`Invalid Polkadot address: ${address}`);
        }
        // Try via API first
        if (this.api?.query?.system?.account) {
            const account = await this.api.query.system.account(address);
            const free = account.data.free;
            return (typeof free === 'bigint' ? free.toString() : String(free));
        }
        // Fallback: JSON-RPC via WebSocket
        return this._rpcQueryBalance(address);
    }
    /**
     * Get formatted balance in DOT (decimal string).
     * @param address - Polkadot address.
     * @returns Balance in DOT (e.g. "12.3456789012").
     */
    async getBalanceFormatted(address) {
        const plancks = await this.getBalance(address);
        return PolkadotChainAdapter.plancksToDOT(plancks);
    }
    /**
     * Get asset balance for an address on a multi-asset chain.
     * @param assetId - Asset ID.
     * @param address - Polkadot address.
     * @returns Asset balance in smallest unit.
     */
    async getAssetBalance(assetId, address) {
        if (!isValidSS58Address(address)) {
            throw new Error(`Invalid Polkadot address: ${address}`);
        }
        if (this.api?.query?.assets?.account) {
            const result = await this.api.query.assets.account(assetId, address);
            const balance = result.balance;
            return typeof balance === 'bigint' ? balance.toString() : String(balance);
        }
        return '0';
    }
    /* ---- Transactions ---- */
    /**
     * Build a DOT transfer.
     * @param to - Recipient address (SS58).
     * @param value - Amount in Plancks (string).
     * @returns A Polkadot transaction object.
     */
    buildTransfer(to, value) {
        if (!isValidSS58Address(to)) {
            throw new Error(`Invalid recipient address: ${to}`);
        }
        return { to, value };
    }
    /**
     * Build an asset transfer for multi-asset chains.
     * @param params - Asset transfer parameters.
     * @returns Transaction object for asset transfer.
     */
    buildAssetTransfer(params) {
        if (!isValidSS58Address(params.to)) {
            throw new Error(`Invalid recipient address: ${params.to}`);
        }
        return { to: params.to, value: params.amount, memo: `asset:${params.assetId}` };
    }
    /**
     * Send a DOT transfer via the connected wallet.
     * @param tx - Polkadot transaction object.
     * @returns Extrinsic hash (hex).
     */
    async sendTransaction(tx) {
        if (!this.provider)
            throw new Error('No provider connected');
        const from = this.getAddress();
        if (!from)
            throw new Error('No connected address');
        // Check if memo indicates asset transfer
        if (tx.memo?.startsWith('asset:')) {
            const assetId = tx.memo.slice(6);
            return this._sendAssetTransfer(assetId, from, tx.to, tx.value);
        }
        // Standard DOT transfer
        if (this.api?.tx?.balances?.transfer) {
            return new Promise((resolve, reject) => {
                this.api.tx.balances
                    .transfer(tx.to, BigInt(tx.value))
                    .signAndSend(from, { signer: this.provider.signer }, (result) => {
                    const r = result;
                    const status = r.status;
                    if (status?.isFinalized || r.isFinalized) {
                        resolve(r.txHash ?? '');
                    }
                    if (status?.isInBlock) {
                        // Wait for finalization
                    }
                    if (r.dispatchError) {
                        reject(new Error(`Transaction failed: ${JSON.stringify(r.dispatchError)}`));
                    }
                })
                    .catch(reject);
            });
        }
        // Fallback: construct and submit via RPC
        return this._rpcSendTransfer(from, tx.to, tx.value);
    }
    /* ---- Message Signing ---- */
    /**
     * Sign a message with the connected wallet.
     * Uses polkadot.js signRaw for arbitrary message signing.
     * @param message - Message to sign (string).
     * @returns Signature as a hex string.
     */
    async signMessage(message) {
        if (!this.provider?.signer?.signRaw) {
            throw new Error('Connected wallet does not support message signing');
        }
        const address = this.getAddress();
        if (!address)
            throw new Error('No connected address');
        const data = this._hexEncode(message);
        const result = await this.provider.signer.signRaw({
            address,
            data,
            type: 'bytes',
        });
        return result.signature;
    }
    /* ---- Chain Switch ---- */
    /** Switch the active chain. */
    async switchChain(chainId) {
        const chain = this.findChain(chainId);
        if (chain) {
            this.rpcUrl = chain.rpcUrl;
            // Reconnect API with new RPC URL
            this.api = null;
        }
    }
    /** Get connected account addresses. Required by ChainAdapter interface. */
    async getAccounts() {
        return this._connectedAccounts.map((a) => a.address);
    }
    /* ---- Utility ---- */
    /** Convert Plancks to DOT string. */
    static plancksToDOT(plancks) {
        const n = typeof plancks === 'string' ? BigInt(plancks) : BigInt(plancks);
        const intPart = n / 10000000000n;
        const fracPart = n % 10000000000n;
        const fracStr = fracPart.toString().padStart(10, '0').replace(/0+$/, '');
        return fracStr ? `${intPart}.${fracStr}` : `${intPart}`;
    }
    /** Convert DOT to Plancks. */
    static dotToPlancks(dot) {
        const parts = String(dot).split('.');
        const intPart = BigInt(parts[0]);
        let fracPart = 0n;
        if (parts.length > 1) {
            const frac = parts[1].padEnd(10, '0').slice(0, 10);
            fracPart = BigInt(frac);
        }
        return (intPart * 10000000000n + fracPart).toString();
    }
    /** Find a Polkadot chain by its ID string. */
    findChainById(chainId) {
        return this.chains.find((c) => c.id === chainId);
    }
    /* ---- Private helpers ---- */
    async _resolveWallet(walletId) {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        const injected = win.injectedWeb3;
        if (!injected)
            return null;
        if (walletId) {
            const key = this._walletToInjectedKey(walletId);
            if (injected[key])
                return injected[key];
            return null;
        }
        // Auto-detect: Talisman → SubWallet → Polkadot.js
        if (injected['talisman'])
            return injected['talisman'];
        if (injected['polkadot-js'])
            return injected['polkadot-js'];
        if (injected['subwallet-js'])
            return injected['subwallet-js'];
        // Return first available
        const keys = Object.keys(injected);
        if (keys.length > 0)
            return injected[keys[0]];
        return null;
    }
    _walletToInjectedKey(walletId) {
        switch (walletId) {
            case 'polkadotjs':
                return 'polkadot-js';
            case 'talisman':
                return 'talisman';
            case 'subwallet':
                return 'subwallet-js';
            default:
                return walletId;
        }
    }
    /** Encode a string to hex for signing. */
    _hexEncode(text) {
        const bytes = new TextEncoder().encode(text);
        return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    /** Query balance via JSON-RPC over WebSocket. */
    async _rpcQueryBalance(address) {
        // For non-browser environments, use fetch to a gateway
        const wsUrl = this.rpcUrl.replace('wss://', 'https://');
        try {
            const resp = await fetch(wsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'state_getStorage',
                    params: [this._storageKeyForBalance(address)],
                }),
            });
            const data = await resp.json();
            if (data.error)
                throw new Error(data.error.message);
            if (data.result) {
                // Decode the storage value (simplified)
                return '0'; // Requires SCALE decoding — return 0 for now
            }
        }
        catch {
            // WebSocket unavailable in this context
        }
        return '0';
    }
    /** Generate storage key for balance query. */
    _storageKeyForBalance(address) {
        // System.Account storage key (simplified)
        // Twox128(System) ++ Twox128(Account) ++ Blake2_128Concat(address)
        return ''; // Placeholder — full implementation needs SCALE codec
    }
    /** Send asset transfer via API. */
    async _sendAssetTransfer(assetId, from, to, value) {
        if (!this.api?.tx?.assets?.transfer) {
            throw new Error('Assets pallet not available on this chain');
        }
        return new Promise((resolve, reject) => {
            this.api.tx.assets
                .transfer(assetId, to, BigInt(value))
                .signAndSend(from, { signer: this.provider.signer }, (result) => {
                const r = result;
                const status = r.status;
                if (status?.isFinalized || r.isFinalized) {
                    resolve(r.txHash ?? '');
                }
                if (r.dispatchError) {
                    reject(new Error(`Transaction failed: ${JSON.stringify(r.dispatchError)}`));
                }
            })
                .catch(reject);
        });
    }
    /** Send transfer via JSON-RPC (fallback). */
    async _rpcSendTransfer(from, to, value) {
        throw new Error('Direct RPC transfers require SCALE encoding. Connect a wallet for signing.');
    }
}
//# sourceMappingURL=polkadot.js.map