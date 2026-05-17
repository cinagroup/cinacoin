/** @ts-nocheck */
/**
 * wallet_getCallsStatus implementation (EIP-5792).
 *
 * Polls for the status of a batch of calls submitted via
 * wallet_sendCalls.
 */
import type { WalletClient } from 'viem';
import type { GetCallsStatusResult } from './types.js';
/**
 * Get the status of a batch of calls by batch ID.
 *
 * Calls the `wallet_getCallsStatus` JSON-RPC method to check
 * whether a batch is pending or confirmed.
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param batchId - The batch ID returned by wallet_sendCalls.
 * @returns GetCallsStatusResult with status and optional receipts.
 */
export declare function walletGetCallsStatus(client: WalletClient, batchId: string): Promise<GetCallsStatusResult>;
/**
 * Wait for a batch of calls to be confirmed.
 *
 * Polls wallet_getCallsStatus at regular intervals until the
 * batch status is CONFIRMED or a timeout is reached.
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param batchId - The batch ID to wait for.
 * @param options - Polling options.
 * @returns GetCallsStatusResult with CONFIRMED status and receipts.
 */
export declare function waitForCallsStatus(client: WalletClient, batchId: string, options?: {
    /** Polling interval in milliseconds. Default: 2000. */
    intervalMs?: number;
    /** Maximum wait time in milliseconds. Default: 60000. */
    timeoutMs?: number;
    /** Optional abort signal to cancel waiting. */
    signal?: AbortSignal;
}): Promise<GetCallsStatusResult>;
/**
 * Check if a batch result indicates success for all calls.
 *
 * @param result - GetCallsStatusResult to check.
 * @returns True if the batch is confirmed and all calls succeeded.
 */
export declare function allCallsSucceeded(result: GetCallsStatusResult): boolean;
/**
 * Get failed call receipts from a batch result.
 *
 * @param result - GetCallsStatusResult to check.
 * @returns Array of receipts for failed calls.
 */
export declare function getFailedReceipts(result: GetCallsStatusResult): import("./types.js").CallReceipt[];
//# sourceMappingURL=getCallsStatus.d.ts.map