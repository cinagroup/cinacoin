/**
 * EIP-5792: Wallet Call API.
 *
 * Implements the Wallet Call API for embedded wallet interactions,
 * including atomic batch transactions, capabilities discovery,
 * and asynchronous call tracking.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5792
 * @packageDocumentation
 */
export type { WalletCapabilities, ChainCapabilities, Call, SendCallsParams, SendCallsResult, CallsStatus, GetCallsStatusResult, CallReceipt, GetCapabilitiesParams, AtomicBatchConfig, AtomicBatchResult, } from './types.js';
export { walletGetCapabilities, hasCapability, getChainCapabilities, getSupportedChains, filterByCapability, } from './capabilities.js';
export { walletSendCalls, sendSingleCall, sendErc20Transfer, sendBatch, } from './sendCalls.js';
export { walletGetCallsStatus, waitForCallsStatus, allCallsSucceeded, getFailedReceipts, } from './getCallsStatus.js';
export { supportsAtomicBatch, buildAtomicBatch, executeAtomicBatch, createEthTransferCall, createContractCall, createErc20ApproveCall, createApproveAndSwapCalls, validateBatchConfig, } from './atomic.js';
//# sourceMappingURL=index.d.ts.map