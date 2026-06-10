/**
 * React integration barrel export.
 *
 * @example
 * ```ts
 * import {
 *   CoinProvider,
 *   ConnectButton,
 *   useCoinConnect,
 *   useCoinAccount,
 *   useCoinBalance,
 *   useCoinTransaction,
 *   useCoinSign,
 * } from '@cinacoin/core-sdk/react';
 * ```
 */

// Provider
export { CoinProvider, CoinContext, useCoinContext } from './CoinProvider.js';
export type {
  CoinProviderProps,
  CoinState,
  CoinActions,
  CoinContextValue,
  ConnectedAccount,
  ConnectionStatus,
  ConnectorConfig,
} from './CoinProvider.js';
export { ConnectorRegistry } from './CoinProvider.js';

// Components
export { ConnectButton } from './ConnectButton.js';
export type { ConnectButtonProps } from './ConnectButton.js';

// Hooks
export { useCoinConnect } from './hooks/useCoinConnect.js';
export type { UseCoinConnectReturn } from './hooks/useCoinConnect.js';

export { useCoinAccount } from './hooks/useCoinAccount.js';
export type { UseCoinAccountReturn } from './hooks/useCoinAccount.js';

export { useCoinBalance } from './hooks/useCoinBalance.js';
export type {
  BalanceData,
  UseCoinBalanceOptions,
  UseCoinBalanceReturn,
} from './hooks/useCoinBalance.js';

export { useCoinTransaction } from './hooks/useCoinTransaction.js';
export type {
  SendTransactionParams,
  TransactionStatus,
  TransactionReceipt,
  UseCoinTransactionReturn,
} from './hooks/useCoinTransaction.js';

export { useCoinSign } from './hooks/useCoinSign.js';
export type { UseCoinSignReturn, TypedDataPayload } from './hooks/useCoinSign.js';
