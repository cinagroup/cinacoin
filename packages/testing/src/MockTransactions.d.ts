/**
 * MockTransactions — Mock transaction generation and management for testing.
 *
 * Generates deterministic mock transactions, receipts, and supports
 * simulating pending / confirmed / failed states.
 */
export interface MockTxParams {
    from?: string;
    to?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
    data?: string;
    nonce?: number;
    chainId?: string;
}
export interface MockTransaction {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    gas: string;
    gasPrice: string;
    data: string;
    nonce: number;
    chainId: string;
    blockNumber: null;
    blockHash: null;
    transactionIndex: null;
}
export interface MockTxReceipt {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string | null;
    cumulativeGasUsed: string;
    gasUsed: string;
    status: "0x0" | "0x1";
    logs: MockLog[];
    logsBloom: string;
    contractAddress: string | null;
    effectiveGasPrice: string;
    type: string;
}
export interface MockLog {
    address: string;
    blockHash: string;
    blockNumber: number;
    data: string;
    logIndex: number;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: number;
}
export type TxStatus = "pending" | "confirmed" | "failed" | "reverted";
/** Create a mock pending transaction */
export declare function createMockTransaction(params?: MockTxParams): MockTransaction;
/** Create a mock confirmed receipt */
export declare function createMockReceipt(tx: MockTransaction, status?: TxStatus): MockTxReceipt;
/** Create a mock event log */
export declare function createMockLog(txHash: string, address?: string, topics?: string[], data?: string): MockLog;
/** Reset the internal counter (useful between test runs) */
export declare function resetTxCounter(): void;
/**
 * Simulate a transaction lifecycle.
 * Returns the receipt after an optional delay.
 */
export declare function simulateTransaction(params?: MockTxParams, status?: TxStatus, delayMs?: number): Promise<{
    tx: MockTransaction;
    receipt: MockTxReceipt;
}>;
//# sourceMappingURL=MockTransactions.d.ts.map