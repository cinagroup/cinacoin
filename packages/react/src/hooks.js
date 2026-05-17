/**
 * React hooks for CinaConnect.
 *
 * All hooks require being used within <CinaConnectProvider>.
 */
import { useCinaConnectContext } from './CinaConnectProvider.js';
/**
 * useCinaConnect — access the full CinaConnect context.
 *
 * ```tsx
 * const { connect, disconnect, account, status } = useCinaConnect();
 * ```
 */
export function useCinaConnect() {
    return useCinaConnectContext();
}
/**
 * useAccount — access the current account state.
 *
 * ```tsx
 * const { address, balance, chainSymbol } = useAccount();
 * ```
 */
export function useAccount() {
    const { account } = useCinaConnectContext();
    return account;
}
/**
 * useChainId — access the current chain ID.
 *
 * ```tsx
 * const chainId = useChainId();
 * ```
 */
export function useChainId() {
    const { account } = useCinaConnectContext();
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
    const { connect, status, isSwitchingChain } = useCinaConnectContext();
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
    const { disconnect } = useCinaConnectContext();
    return { disconnect };
}
//# sourceMappingURL=hooks.js.map