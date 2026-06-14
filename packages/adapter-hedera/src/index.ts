/**
 * @cinacoin/adapter-hedera
 *
 * Hedera Hashgraph chain adapter for Cinacoin.
 *
 * Supports Blade Wallet, HashPack, and Kantara Wallet.
 *
 * @example
 * ```ts
 * import { HederaAdapter, HashPackConnector, announceHederaProviders } from '@cinacoin/adapter-hedera';
 *
 * // Announce providers for EIP-6963 discovery
 * announceHederaProviders();
 *
 * // Use the adapter directly
 * const adapter = new HederaAdapter();
 * const result = await adapter.connect({ connectorId: 'hashpack' });
 * const { transactionId } = await adapter.transferHbar({
 *   recipient: '0.0.12345',
 *   amount: '100000000',
 * });
 *
 * // Or use individual connectors
 * const hashpack = new HashPackConnector();
 * if (hashpack.isAvailable()) {
 *   await hashpack.connect();
 * }
 * ```
 */

export {
  HederaAdapter,
  announceHederaProviders,
} from './HederaAdapter.js';

export { HashPackConnector, announceHashPackEIP6963 } from './connectors/hashpack.js';
export { BladeCinacoinor, announceBladeEIP6963 } from './connectors/blade-wallet.js';
export { KantaraCinacoinor, announceKantaraEIP6963 } from './connectors/kantara-wallet.js';

export type {
  HederaNetwork,
  HederaFeature,
  HederaPlatform,
  HederaProvider,
  HederaConnectorEvents,
  HederaConnectionResult,
  HbarTransferParams,
  TokenTransferParams,
  ContractCallParams,
  HederaConnector,
  ConnectorRegistry,
  EIP6963HederaProviderDetail,
} from './types.js';

// Hedera operations service
export {
  parseHederaId,
  isValidHederaId,
  buildHbarTransferTx,
  buildHtsTransferTx,
  buildTokenAssociateTx,
  buildTokenDissociateTx,
  buildTokenMintTx,
  buildTokenBurnTx,
  buildContractCallTx,
  buildContractCreateTx,
  buildContractCallQuery,
  buildBalanceUrl,
  buildTokenInfoUrl,
  buildTransactionHistoryUrl,
  tinybarToHbar,
  hbarToTinybar,
  HBAR_DECIMALS,
  HEDERA_NETWORKS,
  HEDERA_RELAY_URLS,
  submitViaRpc,
  submitHbarTransferViaRpc,
  submitTokenTransferViaRpc,
  submitContractCallViaRpc,
  getBalanceViaMirror,
  getTokenInfoViaMirror,
  getTransactionHistoryViaMirror,
  type HederaAccountId,
  type HederaTokenId,
  type HederaContractId,
  type HbarTransferParams as HbarTransferTxParams,
  type TokenTransferEntry,
  type HtsTransferParams,
  type TokenMintParams,
  type ContractCallParams as ContractCallTxParams,
  type HederaAccountBalance,
  type HederaRpcResult,
  type HederaSubmitResult,
} from './services/hedera-ops.js';
