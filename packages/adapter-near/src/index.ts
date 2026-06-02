/**
 * @cinacoin/adapter-near
 *
 * NEAR chain adapter for the Cinacoin SDK.
 * Supports NEAR Wallet, Here Wallet, and Meteor Wallet.
 *
 * @packageDocumentation
 */

// NEAR adapter
export { NearChainAdapter } from './NearAdapter.js';

// Wallet connectors
export { NearWalletConnector } from './connectors/near-wallet.js';
export { HereWalletConnector } from './connectors/here-wallet.js';

// Types
export {
  NEAR_CHAINS,
  NEAR_WALLETS,
  type NearWalletInfo,
  type NearFunctionCall,
  type NearTransferAction,
  type NearTransaction,
  type NearTransactionResult,
  type NearWalletConnector as NearWalletConnectorInterface,
  type NearConnectParams,
} from './types.js';

// NEAR operations service
export {
  NEAR_DECIMALS,
  DEFAULT_NEAR_GAS,
  DEFAULT_NEAR_DEPOSIT,
  MIN_ACCOUNT_BALANCE,
  createTransaction,
  buildTransferTx,
  buildFunctionCallTx,
  buildMultiActionTx,
  buildCreateAccountTx,
  buildAddKeyTx,
  buildDeleteKeyTx,
  buildStakeTx,
  buildDeleteAccountTx,
  buildViewAccountRpc,
  parseAccountBalance,
  yoctoToNear,
  nearToYocto,
  buildFtTransferCall,
  buildFtTransferCallWithCallback,
  buildFtBalanceOfCall,
  buildNftTransferCall,
  buildNftMintCall,
  buildNftTokenCall,
  buildCallFunctionRpc,
  buildSendTransactionRpc,
  buildAccessKeyRpc,
  buildAccessKeyListRpc,
  isValidNearAccountId,
  type NearAction,
  type NearActionKind,
  type NearTransferAction as NearTransferActionType,
  type NearFunctionCallAction,
  type NearCreateAccountAction,
  type NearDeployContractAction,
  type NearAddKeyAction,
  type NearDeleteKeyAction,
  type NearStakeAction,
  type NearDeleteAccountAction,
  type NearAccountBalance,
  type NearCreateAccountParams,
} from './services/near-ops.js';
