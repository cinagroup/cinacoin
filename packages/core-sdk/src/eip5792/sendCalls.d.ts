/** @ts-nocheck */
/**
 * wallet_sendCalls implementation (EIP-5792).
 *
 * Sends a batch of calls to a wallet for execution. Supports
 * atomic batch transactions and capabilities like paymaster.
 */
import type { Address, WalletClient } from 'viem';
import type { Call, SendCallsParams, SendCallsResult, WalletCapabilities } from './types.js';
/**
 * Send a batch of calls to the wallet via wallet_sendCalls.
 *
 * The wallet will execute all calls atomically (or sequentially
 * depending on wallet support). Returns a batch ID for status polling.
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param params - Send calls parameters.
 * @returns SendCallsResult containing the batch ID.
 */
export declare function walletSendCalls(client: WalletClient, params: SendCallsParams): Promise<SendCallsResult>;
/**
 * Send a single call (convenience wrapper around walletSendCalls).
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param call - A single call to execute.
 * @param account - Sender address.
 * @param chainId - Optional chain ID (hex).
 * @param capabilities - Optional capabilities.
 * @returns SendCallsResult with batch ID.
 */
export declare function sendSingleCall(client: WalletClient, call: Call, account: Address, chainId?: string, capabilities?: WalletCapabilities): Promise<SendCallsResult>;
/**
 * Build and send an ERC-20 transfer call.
 *
 * @param client - Viem WalletClient.
 * @param tokenAddress - ERC-20 token contract address.
 * @param recipient - Recipient address.
 * @param amount - Amount in token's smallest unit (bigint or hex string).
 * @param account - Sender address.
 * @param chainId - Optional chain ID (hex).
 * @returns SendCallsResult with batch ID.
 */
export declare function sendErc20Transfer(client: WalletClient, tokenAddress: Address, recipient: Address, amount: bigint | string, account: Address, chainId?: string): Promise<SendCallsResult>;
/**
 * Build and send multiple calls in a batch.
 *
 * @param client - Viem WalletClient.
 * @param calls - Array of calls to execute.
 * @param account - Sender address.
 * @param chainId - Optional chain ID (hex).
 * @param capabilities - Optional capabilities.
 * @param version - Optional EIP-5792 version string.
 * @returns SendCallsResult with batch ID.
 */
export declare function sendBatch(client: WalletClient, calls: Call[], account: Address, chainId?: string, capabilities?: WalletCapabilities, version?: string): Promise<SendCallsResult>;
//# sourceMappingURL=sendCalls.d.ts.map