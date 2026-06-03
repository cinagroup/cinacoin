/**
 * Cinacoin Sui Adapter — Sui chain adapter package.
 *
 * Provides a {@link SuiChainAdapter} that implements the
 * {@link ChainAdapter} interface from @cinacoin/core-sdk,
 * plus wallet connectors for Sui Wallet, Suiet, Ethos, and Martian.
 *
 * @packageDocumentation
 */

export { SuiChainAdapter, SUI_CHAINS, SUI_WALLETS, mistToSui, suiToMist } from './SuiAdapter.js';

export { SuiWalletConnector } from './connectors/sui-wallet.js';
export { SuietConnector } from './connectors/suiet.js';
export { EthosConnector } from './connectors/ethos.js';
export { MartianConnector } from './connectors/martian.js';

export { isValidSuiAddress } from './types.js';

export type {
  SuiNetwork, SuiChainPreset, SuiWalletProvider, SuiCoinBalance,
  SuiObjectResponse, SuiTransactionEffects, SuiPlatform, SuiFeature,
  SuiConnector, SuiTransactionCall, SuiTransferSui,
} from './types.js';

// Sui operations service
export {
  createTransactionBlock, transferObjects, splitCoin, splitCoinEqual,
  mergeCoins, moveCall, publish, makeMoveVec,
  buildTransferObjectTx, buildSplitCoinTx, buildMergeCoinsTx,
  buildSuiTransferTx, buildSuiBatchPayTx, buildCoinTransferTx,
  buildCoinMintTx, buildCoinBurnTx,
  buildMoveCallTransaction, buildBatchMoveCallTransaction,
  buildStakeSuiTx, buildNftMintTx,
  buildSplitCoinExTx, buildTransferSharedObjectTx, buildMakeMoveVecTx,
  executeSignedTransaction, dryRunTransaction, devInspectTransaction,
  executeMoveCall, executeTransfer,
  serializeSignature, buildPersonalMessage, buildTxBytesForSigning,
  buildExecuteTransactionRpc, buildDryRunRpc, buildDevInspectRpc,
  serializeTransactionBlock, parseTransactionBlock,
  isValidSuiObjectId as isValidSuiObjectIdFn,
  type SuiCommand, type SuiCommandKind,
  type TransferObjectsCommand, type SplitCoinCommand, type SplitCoinEqualCommand,
  type MergeCoinsCommand, type MakeMoveVecCommand,
  type MoveCallCommand, type PublishCommand,
  type SuiGasSettings, type SuiTransactionBlock,
  type SuiObjectRef, type SuiObjectOwner, type SuiObject,
  type SerializedSignature, type SuiSignatureScheme,
  type SuiRequestType, type SuiSubmitParams,
  type SuiExecuteResult, type DryRunResult, type DevInspectResult,
  type MoveCallParams, type BatchMoveCallParams,
} from './services/sui-ops.js';

export const VERSION = '0.1.0';
