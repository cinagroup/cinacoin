/**
 * EVM Chain Adapter — provides chain-specific operations using viem.
 *
 * Supports standard EVM chains (Ethereum, Polygon, BSC, Arbitrum, etc.)
 * through viem's client API.
 */
/**
 * EVM adapter wraps a connector with EVM-specific operations.
 *
 * It translates generic connector calls into EVM-specific JSON-RPC
 * methods and provides viem-based utilities.
 */
export class EvmAdapter {
    constructor() {
        this.connector = null;
        this.chains = [];
    }
    /**
     * Register supported EVM chains.
     */
    registerChains(chains) {
        this.chains = chains;
    }
    /**
     * Set the active connector.
     */
    setConnector(connector) {
        this.connector = connector;
    }
    /** Get the current connector. */
    getConnector() {
        return this.connector;
    }
    /** Get the underlying provider or throw. */
    provider() {
        if (!this.connector)
            throw new Error('No connector set');
        const p = this.connector.getProvider();
        if (!p)
            throw new Error('Provider not available');
        return p;
    }
    /**
     * Get the native balance for an address.
     * @param address - Ethereum address.
     * @returns Balance in wei (hex string).
     */
    async getBalance(address) {
        return (await this.provider().request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
        }));
    }
    /**
     * Call a contract read method.
     * @param params - Call parameters.
     * @returns Result data (hex string).
     */
    async call(params) {
        return (await this.provider().request({
            method: 'eth_call',
            params: [
                {
                    to: params.to,
                    data: params.data,
                    from: params.from,
                    value: params.value,
                },
                params.blockNumber ?? 'latest',
            ],
        }));
    }
    /**
     * Estimate gas for a transaction.
     * @param tx - Transaction parameters.
     * @returns Gas estimate (hex string).
     */
    async estimateGas(tx) {
        return (await this.provider().request({
            method: 'eth_estimateGas',
            params: [
                {
                    from: tx.from,
                    to: tx.to,
                    data: tx.data,
                    value: tx.value,
                },
            ],
        }));
    }
    /**
     * Get the current gas price.
     * @returns Gas price in wei (hex string).
     */
    async getGasPrice() {
        return (await this.provider().request({
            method: 'eth_gasPrice',
        }));
    }
    /**
     * Get a transaction by hash.
     * @param hash - Transaction hash.
     * @returns Transaction data.
     */
    async getTransaction(hash) {
        return this.provider().request({
            method: 'eth_getTransactionByHash',
            params: [hash],
        });
    }
    /**
     * Get a transaction receipt.
     * @param hash - Transaction hash.
     * @returns Receipt data.
     */
    async getTransactionReceipt(hash) {
        return this.provider().request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
        });
    }
    /**
     * Get the current block number.
     * @returns Block number (decimal).
     */
    async getBlockNumber() {
        const hex = (await this.provider().request({
            method: 'eth_blockNumber',
        }));
        return parseInt(hex, 16);
    }
    /**
     * Get ERC-20 token balance for an address.
     * @param tokenAddress - ERC-20 contract address.
     * @param userAddress - User wallet address.
     * @returns Token balance (as a bigint-compatible hex string).
     */
    async getTokenBalance(tokenAddress, userAddress) {
        // ERC-20 balanceOf function selector + padded address
        const data = '0x70a08231' +
            userAddress.slice(2).padStart(64, '0').toLowerCase();
        return this.call({
            to: tokenAddress,
            data,
        });
    }
    /**
     * Format a transaction into a signable format.
     * @param tx - Transaction request.
     * @returns Formatted transaction for signing.
     */
    formatTransaction(tx) {
        const formatted = {};
        if (tx.from)
            formatted.from = tx.from;
        if (tx.to)
            formatted.to = tx.to;
        if (tx.value)
            formatted.value = tx.value;
        if (tx.data)
            formatted.data = tx.data;
        if (tx.gas)
            formatted.gas = tx.gas;
        if (tx.gasPrice)
            formatted.gasPrice = tx.gasPrice;
        if (tx.maxFeePerGas)
            formatted.maxFeePerGas = tx.maxFeePerGas;
        if (tx.maxPriorityFeePerGas)
            formatted.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
        if (tx.nonce)
            formatted.nonce = tx.nonce;
        if (tx.chainId)
            formatted.chainId = `0x${tx.chainId.toString(16)}`;
        return formatted;
    }
    /**
     * Find a chain by ID.
     */
    findChain(chainId) {
        return this.chains.find((c) => {
            try {
                const id = parseInt(c.id, 16) || parseInt(c.id, 10);
                return id === chainId;
            }
            catch {
                return false;
            }
        });
    }
}
//# sourceMappingURL=evm.js.map