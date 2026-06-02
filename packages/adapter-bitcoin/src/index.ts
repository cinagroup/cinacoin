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
 *   console.log(result.accounts);
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

/**
 * Package version.
 */
export const VERSION = '1.0.0';
