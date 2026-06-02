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
  type StarknetWalletConnector,
  type StarknetConnectParams,
} from './types.js';

// Starknet advanced operations
export {
  verifyStarknetSignature,
  isValidStarknetSignature,
  buildDeployAccountTx,
  computeAccountAddress,
  buildCallRpc,
  buildExecuteTx,
  buildMultiExecuteTx,
  buildEstimateFeeRpc,
  parseFeeEstimate,
  buildGetNonceRpc,
  buildGetClassHashRpc,
  buildGetClassRpc,
  buildGetStorageAtRpc,
  buildErc20TransferOnStarknet,
  buildErc20ApproveOnStarknet,
  buildErc20BatchOnStarknet,
  type StarknetPublicKey,
  type StarknetSignature,
  type DeployAccountParams,
  type ContractCallParams,
  type ExecuteOptions,
  type FeeEstimate,
} from './services/starknet-ops.js';
