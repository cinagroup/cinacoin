/**
 * @cinacoin/universal-connector — 统一多链连接器
 *对标 Reown Universal Connector，一次集成，所有链
 *
 * @example
 * ```typescript
 * import { UniversalConnector } from '@cinacoin/universal-connector'
 *
 * const connector = new UniversalConnector({
 *   projectId: 'xxx',
 *   chains: ['evm:1', 'solana:mainnet', 'bitcoin:mainnet'],
 * })
 *
 * const result = await connector.connect('evm:1')
 * const sig = await connector.signMessage('Hello')
 * await connector.switchChain('solana:mainnet')
 * ```
 */

export { UniversalConnector } from './UniversalConnector';
export { BaseAdapter } from './adapters/BaseAdapter';
export { ChainManager } from './chains/ChainManager';
export { registerAdapter, getAdapter, listAdapters } from './adapters';
export { getAllChains, getChainById, getChainsByCategory, addChain } from './chains';

export type {
  IUniversalConnector,
  ConnectOptions,
  ConnectionResult,
  SignatureResult,
  TransactionRequest,
  TxResult,
  ChainInfo,
  BalanceResult,
  EventCallback,
  AdapterRegistry,
} from './types';
