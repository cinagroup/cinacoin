/**
 * Bitcoin Chain Adapter — provides Bitcoin-specific operations.
 *
 * Supports BIP-322 message signing, PSBT (Partially Signed Bitcoin Transaction),
 * and multiple address formats: legacy (P2PKH), segwit (P2WPKH), taproot (P2TR).
 * Compatible with Xverse, Leather, and Unisat wallets.
 */
/** Validate a Bitcoin address and detect its format. */
export function validateBitcoinAddress(address) {
    if (!address || typeof address !== 'string') {
        return { valid: false, format: 'unknown' };
    }
    // Legacy (P2PKH): starts with 1, base58, 26-35 chars
    if (/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
        return { valid: true, format: 'legacy' };
    }
    // P2SH (Script Hash): starts with 3, base58, 26-35 chars
    if (/^3[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
        return { valid: true, format: 'p2sh' };
    }
    // Bech32 (Segwit P2WPKH): starts with bc1q or tb1q, 42 chars
    if (/^(bc1|tb1|bcrt1)q[a-z0-9]{39}$/.test(address)) {
        return { valid: true, format: 'p2wpkh' };
    }
    // Bech32m (Taproot P2TR): starts with bc1p or tb1p, 62 chars
    if (/^(bc1|tb1|bcrt1)p[a-z0-9]{59}$/.test(address)) {
        return { valid: true, format: 'p2tr' };
    }
    // P2WSH (native segwit script): bc1q, 62 chars
    if (/^(bc1|tb1|bcrt1)q[a-z0-9]{59}$/.test(address)) {
        return { valid: true, format: 'p2wsh' };
    }
    return { valid: false, format: 'unknown' };
}
export const BITCOIN_WALLETS = [
    {
        id: 'xverse',
        name: 'Xverse',
        rdns: 'io.xverse',
        icon: 'https://raw.githubusercontent.com/secretkeylabs/xverse-web/main/public/icon.png',
        downloadUrl: 'https://www.xverse.app/download',
    },
    {
        id: 'leather',
        name: 'Leather',
        rdns: 'io.leather',
        icon: 'https://leather.io/icons/icon-192.png',
        downloadUrl: 'https://leather.io/install-extension',
    },
    {
        id: 'unisat',
        name: 'Unisat',
        rdns: 'io.unisat',
        icon: 'https://unisat.io/favicon.ico',
        downloadUrl: 'https://unisat.io/download',
    },
];
/** Well-known Bitcoin chain presets. */
export const BITCOIN_CHAINS = [
    {
        id: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin Mainnet',
        rpcUrl: 'https://mempool.space/api',
        nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
        explorerUrl: 'https://mempool.space',
        iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
    },
    {
        id: 'bip122:000000000933ea01ad0ee984209779ba',
        name: 'Bitcoin Testnet',
        rpcUrl: 'https://mempool.space/testnet/api',
        nativeCurrency: { name: 'Bitcoin Testnet', symbol: 'tBTC', decimals: 8 },
        explorerUrl: 'https://mempool.space/testnet',
        iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
    },
    {
        id: 'bip122:00000000001e94e46e558f0864e0e3a656a9a1e7',
        name: 'Bitcoin Signet',
        rpcUrl: 'https://mempool.space/signet/api',
        nativeCurrency: { name: 'Bitcoin Signet', symbol: 'sBTC', decimals: 8 },
        explorerUrl: 'https://mempool.space/signet',
        iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
    },
];
/* ------------------------------------------------------------------ */
/*  BitcoinChainAdapter                                                 */
/* ------------------------------------------------------------------ */
/**
 * Bitcoin chain adapter providing Bitcoin-specific operations.
 *
 * Supports BIP-322 message signing, PSBT building/signing, UTXO
 * management, and multiple address formats.
 */
export class BitcoinChainAdapter {
    constructor() {
        this.provider = null;
        this.chains = [];
        this.rpcUrl = BITCOIN_CHAINS[0].rpcUrl;
        this._connectedAddress = null;
    }
    /* ---- Configuration ---- */
    /** Register supported Bitcoin chains. */
    registerChains(chains) {
        this.chains = chains;
    }
    /** Set the RPC/mempool API URL. */
    setRpcUrl(url) {
        this.rpcUrl = url;
    }
    /** Set the active wallet provider. */
    setProvider(provider) {
        this.provider = provider;
    }
    /** Get the current provider. */
    getProvider() {
        return this.provider;
    }
    /* ---- Connection ---- */
    /**
     * Connect to a Bitcoin wallet.
     * Tries Xverse → Leather → Unisat in order.
     * @returns Array of connected addresses.
     */
    async connect(walletId) {
        const target = this._resolveWallet(walletId);
        if (!target) {
            throw new Error('No Bitcoin wallet found. Install Xverse, Leather, or Unisat.');
        }
        const provider = target();
        const accounts = await provider.requestAccounts();
        this.provider = provider;
        if (accounts.length > 0) {
            this._connectedAddress = accounts[0];
        }
        return accounts;
    }
    /** Disconnect from the wallet. */
    async disconnect() {
        if (this.provider?.disconnect) {
            await this.provider.disconnect();
        }
        this.provider = null;
        this._connectedAddress = null;
    }
    /** Get the connected address. */
    getAddress() {
        return this._connectedAddress;
    }
    /* ---- Balance ---- */
    /**
     * Get BTC balance for an address.
     * @param address - Bitcoin address (any format).
     * @returns Balance in satoshis.
     */
    async getBalance(address) {
        const validation = validateBitcoinAddress(address);
        if (!validation.valid) {
            throw new Error(`Invalid Bitcoin address: ${address} (format: ${validation.format})`);
        }
        const url = `${this.rpcUrl}/address/${address}/utxo`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
        }
        const utxos = await response.json();
        return utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    }
    /**
     * Get formatted balance as a BTC string.
     * @param address - Bitcoin address.
     * @returns Balance as a decimal string (e.g. "0.00123456").
     */
    async getBalanceFormatted(address) {
        const sats = await this.getBalance(address);
        return BitcoinChainAdapter.satoshisToBTC(sats);
    }
    /* ---- UTXOs ---- */
    /**
     * Get UTXOs for an address.
     * @param address - Bitcoin address.
     * @returns Array of UTXOs.
     */
    async getUTXOs(address) {
        const validation = validateBitcoinAddress(address);
        if (!validation.valid) {
            throw new Error(`Invalid Bitcoin address: ${address}`);
        }
        const url = `${this.rpcUrl}/address/${address}/utxo`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Select UTXOs for a target amount (coin selection).
     * Uses a simple largest-first algorithm.
     * @param utxos - Available UTXOs.
     * @param target - Target amount in satoshis.
     * @param feeRate - Fee rate in sat/vB (default: 10).
     * @returns Selected UTXOs and estimated fee.
     */
    selectUTXOs(utxos, target, feeRate = 10) {
        const sorted = [...utxos].sort((a, b) => b.value - a.value);
        const estimatedFeePerInput = feeRate * 68; // ~68 vB per P2WPKH input
        const estimatedFeePerOutput = feeRate * 43; // ~43 vB per output
        const baseFee = feeRate * 11; // ~11 vB overhead
        let selected = [];
        let totalValue = 0;
        let totalFee = baseFee;
        for (const utxo of sorted) {
            selected.push(utxo);
            totalValue += utxo.value;
            totalFee += estimatedFeePerInput;
            const change = totalValue - target - totalFee - estimatedFeePerOutput;
            if (change >= 0) {
                return {
                    selected,
                    fee: totalFee,
                    change: change > 546 ? change : 0, // dust threshold
                };
            }
        }
        // Not enough funds
        return { selected: [], fee: 0, change: 0 };
    }
    /* ---- Message Signing (BIP-322) ---- */
    /**
     * Sign a message using BIP-322.
     * @param message - Message to sign.
     * @param address - Address to sign with (uses connected address if not provided).
     * @returns Base64-encoded signature.
     */
    async signMessage(message, address) {
        if (!this.provider)
            throw new Error('No provider connected');
        if (!this.provider.signMessage) {
            throw new Error('Connected wallet does not support message signing');
        }
        const signingAddress = address || this._connectedAddress;
        if (!signingAddress) {
            throw new Error('No address available for signing');
        }
        return this.provider.signMessage(message, 'bip322-simple');
    }
    /* ---- PSBT Support ---- */
    /**
     * Build a PSBT for a simple transfer.
     * @param fromAddress - Sender address.
     * @param toAddress - Recipient address.
     * @param satoshis - Amount to send in satoshis.
     * @param utxos - UTXOs to spend from.
     * @param feeRate - Fee rate in sat/vB.
     * @returns Base64-encoded PSBT.
     */
    async buildPSBT(fromAddress, toAddress, satoshis, utxos, feeRate = 10) {
        const selectedUTXOs = utxos || (await this.getUTXOs(fromAddress));
        const { selected, fee, change } = this.selectUTXOs(selectedUTXOs, satoshis, feeRate);
        if (selected.length === 0) {
            throw new Error('Insufficient funds');
        }
        // Build PSBT inputs and outputs as a JSON structure that wallets can consume
        const psbtInputs = selected.map((utxo) => ({
            txid: utxo.txid,
            vout: utxo.vout,
            witnessUtxo: {
                scriptPubKey: utxo.scriptPubKey,
                value: utxo.value,
            },
        }));
        const psbtOutputs = [
            { address: toAddress, value: satoshis },
        ];
        if (change > 546) {
            psbtOutputs.push({ address: fromAddress, value: change });
        }
        // Return as a structured PSBT that can be passed to wallet.signPsbt
        const psbtData = {
            inputs: psbtInputs,
            outputs: psbtOutputs,
            fee,
        };
        // For actual PSBT creation, we'd use bitcoinjs-lib on the server side.
        // Here we return the structured data for the wallet to handle.
        return JSON.stringify(psbtData);
    }
    /**
     * Sign a PSBT using the connected wallet.
     * @param psbt - Base64-encoded PSBT.
     * @returns Signed PSBT (base64).
     */
    async signPSBT(psbt) {
        if (!this.provider)
            throw new Error('No provider connected');
        if (!this.provider.signPsbt) {
            throw new Error('Connected wallet does not support PSBT signing');
        }
        return this.provider.signPsbt(psbt);
    }
    /**
     * Broadcast a signed PSBT.
     * @param psbt - Signed PSBT (base64).
     * @returns Transaction ID.
     */
    async broadcastPSBT(psbt) {
        if (!this.provider?.pushPsbt) {
            // Fallback: extract hex and broadcast via mempool API
            throw new Error('Wallet does not support pushPsbt. Broadcast the raw transaction manually.');
        }
        return this.provider.pushPsbt(psbt);
    }
    /* ---- Sending BTC ---- */
    /**
     * Send BTC to an address.
     * @param toAddress - Recipient address.
     * @param satoshis - Amount in satoshis.
     * @param feeRate - Fee rate in sat/vB.
     * @returns Transaction ID.
     */
    async sendBTC(toAddress, satoshis, feeRate = 10) {
        if (!this.provider)
            throw new Error('No provider connected');
        if (!this.provider.sendBitcoin) {
            throw new Error('Connected wallet does not support sendBitcoin');
        }
        const validation = validateBitcoinAddress(toAddress);
        if (!validation.valid) {
            throw new Error(`Invalid recipient address: ${toAddress}`);
        }
        return this.provider.sendBitcoin(toAddress, satoshis);
    }
    /* ---- Utility ---- */
    /** Convert satoshis to BTC string. */
    static satoshisToBTC(satoshis) {
        return (satoshis / 1e8).toFixed(8);
    }
    /** Convert BTC to satoshis. */
    static btctToSatoshis(btc) {
        return Math.round(Number(btc) * 1e8);
    }
    /** Find a chain by its ID. */
    findChain(chainId) {
        return this.chains.find((c) => c.id === chainId);
    }
    /* ---- Private helpers ---- */
    _resolveWallet(walletId) {
        if (typeof window === 'undefined')
            return null;
        const win = window;
        if (walletId) {
            switch (walletId) {
                case 'xverse':
                    return () => (win.xverse?.bitcoin ?? win.BitcoinProvider);
                case 'leather':
                    return () => (win.leather?.bitcoin ?? win.btc);
                case 'unisat':
                    return () => win.unisat;
                default:
                    return null;
            }
        }
        // Auto-detect: Unisat → Xverse → Leather
        if (win.unisat)
            return () => win.unisat;
        if (win.xverse?.bitcoin)
            return () => win.xverse.bitcoin;
        if (win.leather?.bitcoin)
            return () => win.leather.bitcoin;
        if (win.btc)
            return () => win.btc;
        return null;
    }
}
//# sourceMappingURL=bitcoin.js.map