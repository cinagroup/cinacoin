/**
 * @cinacoin/adapter-starknet
 *
 * Starknet chain adapter for the Cinacoin SDK.
 * Supports Argent X and Braavos wallets with native account abstraction.
 *
 * @packageDocumentation
 */

// Starknet adapter
export { StarknetChainAdapter } from './StarknetAdapter.js';

// Wallet connectors
export { ArgentXConnector } from './connectors/argent-x.js';
export { BraavosConnector } from './connectors/braavos.js';

// Types
export {
  STARKNET_CHAINS,
  STARKNET_WALLETS,
  type StarknetWalletInfo,
  type StarknetCall,
  type StarknetTransaction,
  type StarknetTransactionResult,
  type StarknetCinacoinor,
  type StarknetConnectParams,
} from './types.js';

// Starknet advanced operations
export {
  verifyStarknetSignature,
  isValidStarknetSignature,
  buildDeployAccountTx,
  buildDeployAccountRpc,
  computeAccountAddress,
  buildCallRpc,
  buildExecuteTx,
  buildMultiExecuteTx,
  buildEstimateFeeRpc,
  buildInvokeRpc,
  parseFeeEstimate,
  buildGetNonceRpc,
  buildGetClassHashRpc,
  buildGetClassRpc,
  buildGetStorageAtRpc,
  buildErc20TransferOnStarknet,
  buildErc20ApproveOnStarknet,
  buildErc20BatchOnStarknet,
  broadcastTransaction,
  deployAccount,
  executeDeployAccount,
  estimateFee,
  estimateFeeAndExecute,
  getNonce,
  type StarknetPublicKey,
  type StarknetSignature,
  type DeployAccountParams,
  type ContractCallParams,
  type ExecuteOptions,
  type FeeEstimate,
  type BroadcastResult,
} from './services/starknet-ops.js';
