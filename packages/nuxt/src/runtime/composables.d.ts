/**
 * Access the CinaConnect application instance.
 *
 * @example
 * ```ts
 * const { cinaConnect } = useCinaConnect()
 * await cinaConnect.connect()
 * ```
 */
export declare function useCinaConnect(): {
    cinaConnect: CinaConnect;
};
/**
 * Reactive account state — address, balance, chain, connected flag.
 *
 * @example
 * ```ts
 * const { address, isConnected } = useCinaConnectAccount()
 * ```
 */
export declare function useCinaConnectAccount(): {
    /** Connected address, or `undefined`. */
    readonly address: any;
    /** Balance as a formatted string, or `undefined`. */
    readonly balance: any;
    /** Current chain identifier, or `undefined`. */
    readonly chain: any;
    /** Whether a wallet is connected. */
    readonly isConnected: any;
};
/**
 * Network selection composable.
 *
 * @example
 * ```ts
 * const { networks, switchNetwork } = useCinaConnectNetwork()
 * switchNetwork('arbitrum')
 * ```
 */
export declare function useCinaConnectNetwork(): {
    /** Configured networks. */
    networks: any;
    switchNetwork: (network: string) => Promise<void>;
};
//# sourceMappingURL=composables.d.ts.map