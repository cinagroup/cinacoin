import { logger } from '@cinacoin/logger';
/**
 * @cinacoin/adapter-bitcoin
 *
 * Native Bitcoin wallet connectors for the Cinacoin SDK.
 *
 * Provides support for:
 * - Unisat Wallet
 * - Leather Wallet
 * - OKX Wallet (Bitcoin mode)
 * - Xverse Wallet
 * - SatsConnect (protocol abstraction)
 * - Wallet Standard (universal discovery)
 *
 * @example
 * ```ts
 * import {
 *   BitcoinConnectorFactory,
 *   UnisatConnector,
 *   LeatherConnector,
 *   XverseConnector,
 *   OKXBitcoinConnector,
 *   SatsConnectConnector,
 *   WalletStandardConnector,
 * } from '@cinacoin/adapter-bitcoin';
 *
 * // Use the factory for auto-discovery
 * const factory = BitcoinConnectorFactory.getInstance();
 * const available = factory.detectAvailableConnectors();
 *
 * // Or instantiate a specific connector
 * const unisat = new UnisatConnector();
 * if (unisat.isAvailable()) {
 *   const result = await unisat.connect();
 *   logger.info(result.accounts);
 * }
 * ```
 *
 * @packageDocumentation
 */

// Factory
export { BitcoinConnectorFactory, bitcoinConnectorFactory } from './BitcoinConnectorFactory.js';

// Wallet connectors
export { UnisatConnector, announceUnisatEIP6963 } from './connectors/unisat.js';
export { LeatherConnector, leatherStacksRequest } from './connectors/leather.js';
export { OKXBitcoinConnector } from './connectors/okx.js';
export { SatsConnectConnector } from './connectors/sats-connect.js';
export { WalletStandardConnector } from './connectors/wallet-standard.js';
export { XverseConnector } from './connectors/xverse.js';

// Types
export type {
  BitcoinNetwork,
  BitcoinFeature,
  BitcoinPlatform,
  BitcoinProvider,
  BitcoinConnectorEvents,
  BitcoinConnectionResult,
  BitcoinConnector,
  EIP6963BitcoinProviderDetail,
} from './types.js';

// Services — Coin Selection, PSBT Builder, Blockstream API, BitcoinService
export {
  branchAndBound,
  knapsack,
  singleRandomDraw,
  selectCoins,
  prepareUtxos,
  type CoinSelectionUTXO,
  type CoinSelectionResult,
  type CoinSelectionConfig,
} from './services/coin-selection.js';

export {
  buildPsbt,
  buildMultiOutputPsbt,
  buildOpReturnOutput,
  psbtToJson,
  psbtFromJson,
  type PsbtDescriptor,
  type PsbtInput,
  type PsbtOutput,
  type PsbtGlobal,
  type BuildPsbtParams,
} from './services/psbt-builder.js';

export {
  BlockstreamClient,
  validateBitcoinAddress,
  type BlockstreamConfig,
  type BlockstreamUTXO,
  type BlockstreamTransaction,
  type BlockstreamTxStatus,
  type BlockstreamAddressInfo,
  type BlockstreamFeeEstimate,
  type BlockstreamNetwork,
} from './services/blockstream.js';

export {
  BitcoinService,
  BITCOIN_NETWORKS,
  type BitcoinServiceConfig,
  type BitcoinTransactionInfo,
  type BitcoinBalanceInfo,
  type BitcoinNetworkPreset,
  type BitcoinInputFormat,
} from './services/bitcoin-service.js';

/**
 * Package version.
 */
export const VERSION = '1.0.0';
