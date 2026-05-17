/**
 * Atomic batch transaction builder (EIP-5792).
 *
 * Constructs atomic batch transactions that execute multiple
 * calls in a single on-chain operation.
 */
import type { Address, Hex, WalletClient } from 'viem';
import type { AtomicBatchConfig, AtomicBatchResult, Call, SendCallsResult } from './types.js';
/**
 * Check if a chain supports atomic batch transactions.
 *
 * @param chainId - Chain ID in hex format.
 * @returns True if the chain is known to support atomic batches.
 */
export declare function supportsAtomicBatch(chainId: Hex): boolean;
/**
 * Build an atomic batch from configuration.
 *
 * @param config - Atomic batch configuration.
 * @returns AtomicBatchResult with params and metadata.
 */
export declare function buildAtomicBatch(config: AtomicBatchConfig): AtomicBatchResult;
/**
 * Build and execute an atomic batch.
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param config - Atomic batch configuration.
 * @returns SendCallsResult with batch ID.
 */
export declare function executeAtomicBatch(client: WalletClient, config: AtomicBatchConfig): Promise<SendCallsResult>;
/**
 * Create a batch that includes an ETH transfer.
 *
 * @param to - Recipient address.
 * @param amountWei - Amount in wei.
 * @returns A Call object for the ETH transfer.
 */
export declare function createEthTransferCall(to: Address, amountWei: bigint): Call;
/**
 * Create a batch that includes a contract function call.
 *
 * @param to - Contract address.
 * @param data - ABI-encoded calldata.
 * @param value - Optional ETH value to send with the call.
 * @returns A Call object.
 */
export declare function createContractCall(to: Address, data: Hex, value?: bigint): Call;
/**
 * Create a batch that includes an ERC-20 approve call.
 *
 * @param tokenAddress - ERC-20 token contract address.
 * @param spender - Address to approve spending for.
 * @param amount - Amount to approve (in token's smallest unit).
 * @returns A Call object for the approve.
 */
export declare function createErc20ApproveCall(tokenAddress: Address, spender: Address, amount: bigint): Call;
/**
 * Create a combined approve + swap batch (common DeFi pattern).
 *
 * @param tokenAddress - ERC-20 token address.
 * @param spender - Router/spender address.
 * @param amount - Amount to approve.
 * @param swapCalls - Swap call(s) to execute after approval.
 * @returns Array of Call objects.
 */
export declare function createApproveAndSwapCalls(tokenAddress: Address, spender: Address, amount: bigint, swapCalls: Call[]): Call[];
/**
 * Validate that a batch configuration is well-formed.
 *
 * @param config - Atomic batch configuration to validate.
 * @throws Error if the configuration is invalid.
 */
export declare function validateBatchConfig(config: AtomicBatchConfig): void;
//# sourceMappingURL=atomic.d.ts.map