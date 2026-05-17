/**
 * React hooks for CinaConnect.
 *
 * All hooks require being used within <CinaConnectProvider>.
 */
import { type CinaConnectContextValue } from './CinaConnectProvider.js';
/**
 * useCinaConnect — access the full CinaConnect context.
 *
 * ```tsx
 * const { connect, disconnect, account, status } = useCinaConnect();
 * ```
 */
export declare function useCinaConnect(): CinaConnectContextValue;
/**
 * useAccount — access the current account state.
 *
 * ```tsx
 * const { address, balance, chainSymbol } = useAccount();
 * ```
 */
export declare function useAccount(): any;
/**
 * useChainId — access the current chain ID.
 *
 * ```tsx
 * const chainId = useChainId();
 * ```
 */
export declare function useChainId(): number | null;
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
export declare function useConnect(): {
    connect: any;
    status: any;
    isSwitchingChain: any;
};
/**
 * useDisconnect — disconnect from the current wallet.
 *
 * ```tsx
 * const { disconnect } = useDisconnect();
 *
 * <button onClick={() => disconnect()}>Disconnect</button>
 * ```
 */
export declare function useDisconnect(): {
    disconnect: any;
};
//# sourceMappingURL=hooks.d.ts.map