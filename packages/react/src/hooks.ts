/**
 * React hooks for OnChainUX.
 *
 * All hooks require being used within <OnChainUXProvider>.
 */

import { useOnChainUXContext, type OnChainUXContextValue } from './OnChainUXProvider.js';

/**
 * useOnChainUX — access the full OnChainUX context.
 *
 * ```tsx
 * const { connect, disconnect, account, status } = useOnChainUX();
 * ```
 */
export function useOnChainUX(): OnChainUXContextValue {
  return useOnChainUXContext();
}

/**
 * useAccount — access the current account state.
 *
 * ```tsx
 * const { address, balance, chainSymbol } = useAccount();
 * ```
 */
export function useAccount() {
  const { account } = useOnChainUXContext();
  return account;
}

/**
 * useChainId — access the current chain ID.
 *
 * ```tsx
 * const chainId = useChainId();
 * ```
 */
export function useChainId(): number | null {
  const { account } = useOnChainUXContext();
  return account.chainId;
}

/**
 * useConnect — connect to a wallet.
 *
 * ```tsx
 * const { connect, status, isSwitchingChain } = useConnect();
 *
 * // Connect to MetaMask
 * <button onClick={() => connect('metamask')}>Connect</button>
 * ```
 */
export function useConnect() {
  const { connect, status, isSwitchingChain } = useOnChainUXContext();
  return { connect, status, isSwitchingChain };
}

/**
 * useDisconnect — disconnect from the current wallet.
 *
 * ```tsx
 * const { disconnect } = useDisconnect();
 *
 * <button onClick={() => disconnect()}>Disconnect</button>
 * ```
 */
export function useDisconnect() {
  const { disconnect } = useOnChainUXContext();
  return { disconnect };
}
