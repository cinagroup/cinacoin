/**
 * React hooks for Cinacoin.
 *
 * Barrel file — re-exports all hooks from individual modules.
 * All hooks require being used within <CinacoinProvider>.
 */

export { useConnect } from './hooks/useConnect.js';
export type { UseConnectReturn } from './hooks/useConnect.js';

export { useAccount } from './hooks/useAccount.js';
export type { UseAccountReturn } from './hooks/useAccount.js';

export { useDisconnect } from './hooks/useDisconnect.js';
export type { UseDisconnectReturn } from './hooks/useDisconnect.js';

export { useBalance } from './hooks/useBalance.js';
export type { UseBalanceReturn } from './hooks/useBalance.js';

export { useSendTransaction } from './hooks/useSendTransaction.js';
export type { TransactionRequest, UseSendTransactionReturn } from './hooks/useSendTransaction.js';

export { useSignMessage } from './hooks/useSignMessage.js';
export type { UseSignMessageReturn } from './hooks/useSignMessage.js';

export { useSwitchChain } from './hooks/useSwitchChain.js';
export type { UseSwitchChainReturn } from './hooks/useSwitchChain.js';

export { useWallets } from './hooks/useWallets.js';
export type { WalletEntry, UseWalletsReturn } from './hooks/useWallets.js';

// ENS resolution hooks
export { useEnsName, useEnsAddress } from './hooks/useEns.js';
export type { UseEnsNameReturn, UseEnsAddressReturn } from './hooks/useEns.js';

// Re-export the Cinacoin base hooks (defined in this file for backwards compat)
// useCinacoin, useChainId

import { useCinacoinContext, type CinacoinContextValue } from './CinacoinProvider.js';

/**
 * useCinacoin — access the full Cinacoin context.
 *
 * ```tsx
 * const { connect, disconnect, account, status } = useCinacoin();
 * ```
 */
export function useCinacoin(): CinacoinContextValue {
  return useCinacoinContext();
}

/**
 * useChainId — access the current chain ID.
 *
 * ```tsx
 * const chainId = useChainId();
 * ```
 */
export function useChainId(): number | null {
  const { account } = useCinacoinContext();
  return account.chainId;
}

// EIP-5792 hooks
export {
  useWalletCapabilities,
  useSendCalls,
  useAtomicBatch,
  useCallsStatus,
} from './hooks/useEIP5792.js';

export type {
  UseWalletCapabilitiesReturn,
  UseSendCallsReturn,
  UseAtomicBatchReturn,
  UseCallsStatusReturn,
  SendCallsOptions,
  AtomicBatchOptions,
} from './hooks/useEIP5792.js';
