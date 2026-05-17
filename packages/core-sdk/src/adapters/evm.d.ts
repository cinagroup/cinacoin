/**
 * EVM Chain Adapter — provides chain-specific operations using viem.
 *
 * Supports standard EVM chains (Ethereum, Polygon, BSC, Arbitrum, etc.)
 * through viem's client API.
 */
import type { Connector } from '../connector.js';
import type { TransactionRequest, Chain } from '../types.js';
/**
 * EVM adapter wraps a connector with EVM-specific operations.
 *
 * It translates generic connector calls into EVM-specific JSON-RPC
 * methods and provides viem-based utilities.
 */
export declare class EvmAdapter {
    private connector;
    private chains;
    /**
     * Register supported EVM chains.
     */
    registerChains(chains: Chain[]): void;
    /**
     * Set the active connector.
     */
    setConnector(connector: Connector): void;
    /** Get the current connector. */
    getConnector(): Connector | null;
    /** Get the underlying provider or throw. */
    private provider;
    /**
     * Get the native balance for an address.
     * @param address - Ethereum address.
     * @returns Balance in wei (hex string).
     */
    getBalance(address: string): Promise<string>;
    /**
     * Call a contract read method.
     * @param params - Call parameters.
     * @returns Result data (hex string).
     */
    call(params: EthCallParams): Promise<string>;
    /**
     * Estimate gas for a transaction.
     * @param tx - Transaction parameters.
     * @returns Gas estimate (hex string).
     */
    estimateGas(tx: Partial<TransactionRequest>): Promise<string>;
    /**
     * Get the current gas price.
     * @returns Gas price in wei (hex string).
     */
    getGasPrice(): Promise<string>;
    /**
     * Get a transaction by hash.
     * @param hash - Transaction hash.
     * @returns Transaction data.
     */
    getTransaction(hash: string): Promise<unknown>;
    /**
     * Get a transaction receipt.
     * @param hash - Transaction hash.
     * @returns Receipt data.
     */
    getTransactionReceipt(hash: string): Promise<unknown>;
    /**
     * Get the current block number.
     * @returns Block number (decimal).
     */
    getBlockNumber(): Promise<number>;
    /**
     * Get ERC-20 token balance for an address.
     * @param tokenAddress - ERC-20 contract address.
     * @param userAddress - User wallet address.
     * @returns Token balance (as a bigint-compatible hex string).
     */
    getTokenBalance(tokenAddress: string, userAddress: string): Promise<string>;
    /**
     * Format a transaction into a signable format.
     * @param tx - Transaction request.
     * @returns Formatted transaction for signing.
     */
    formatTransaction(tx: TransactionRequest): Record<string, unknown>;
    /**
     * Find a chain by ID.
     */
    findChain(chainId: number): Chain | undefined;
}
/** Parameters for an eth_call. */
export interface EthCallParams {
    /** Target contract address. */
    to: string;
    /** Encoded function call data. */
    data?: string;
    /** Caller address. */
    from?: string;
    /** ETH value to send (hex). */
    value?: string;
    /** Block number (default: 'latest'). */
    blockNumber?: string;
}
//# sourceMappingURL=evm.d.ts.map