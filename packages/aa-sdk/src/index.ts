// @cinacoin/aa-sdk
// Account Abstraction SDK for ERC-4337 smart accounts

export { SmartAccount } from './smartAccount.js';
export { SmartAccountFactory } from './factory.js';
export { PaymasterClient, PaymasterRouter } from './paymaster/index.js';
export type { PmRouterEntry, PmRoutingResult } from './paymaster/index.js';
export { BundlerClient } from './bundler.js';
export {
  BundlerClient as EnhancedBundlerClient,
  createBundlerClient as createEnhancedBundlerClient,
} from './bundler-client.js';
export type { EnhancedBundlerConfig, SubmittedUserOp } from './bundler-client.js';
export { createSmartAccount, createBundlerClient, createPaymasterClient, createFactory } from './createClients.js';
export type {
  SmartAccountConfig,
  SmartAccountState,
  UserOperation,
  UserOperationResult,
  UserOperationReceipt,
  UserOperationGasEstimate,
  UserOperationStatus,
  BatchTransaction,
  FactoryConfig,
  PaymasterConfig,
  PaymasterRequest,
  PaymasterResponse,
  BundlerConfig,
  BundlerSendResult,
  AASDKConfig,
} from './types.js';

// ============================================================
// DEFI-15: EIP-5792 Support (wallet_sendCalls, wallet_getCallsStatus)
// ============================================================

export { EIP5792Client, createEIP5792Client } from './eip5792.js';
export type {
  EIP5792Call,
  EIP5792SendCallsParams,
  EIP5792SendCallsResult,
  EIP5792CallsStatus,
  EIP5792GetCallsStatusParams,
} from './eip5792.js';
