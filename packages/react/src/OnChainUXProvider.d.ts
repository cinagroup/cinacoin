import { type ReactNode } from 'react';
/** Supported theme modes. */
export type ThemeMode = 'dark' | 'light' | 'minimal';
/** Chain configuration. */
export interface ChainConfig {
    id: number;
    name: string;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl?: string;
    iconUrl?: string;
    testnet?: boolean;
}
/** Wallet connector interface. */
export interface Connector {
    id: string;
    name: string;
    icon?: string;
    type: 'injected' | 'walletconnect' | 'coinbase' | 'email' | 'social';
    installed?: boolean;
}
/** Account information. */
export interface AccountState {
    address: string | null;
    balance: string;
    chainId: number | null;
    chainSymbol: string;
    ensName?: string;
}
/** CinaConnect configuration passed to the provider. */
export interface CinaConnectConfig {
    /** Project ID (for analytics / relay). */
    projectId?: string;
    /** Supported chains. */
    chains?: ChainConfig[];
    /** Theme configuration. */
    theme?: {
        mode?: ThemeMode;
        /** Optional CSS variable overrides. */
        variables?: Record<string, string>;
    };
    /** App metadata. */
    metadata?: {
        name: string;
        description: string;
        url: string;
        icons?: string[];
    };
    /** Recommended wallet IDs (for ordering in UI). */
    recommendedWallets?: string[];
}
/** Context value exposed by CinaConnectProvider. */
export interface CinaConnectContextValue {
    /** Current configuration. */
    config: CinaConnectConfig;
    /** Available connectors. */
    connectors: Connector[];
    /** Current account state. */
    account: AccountState;
    /** Current connection status. */
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    /** Connect to a wallet by connector ID. */
    connect: (connectorId: string) => Promise<void>;
    /** Disconnect the current wallet. */
    disconnect: () => Promise<void>;
    /** Switch the active chain. */
    switchChain: (chainId: number) => Promise<void>;
    /** Whether a chain switch is in progress. */
    isSwitchingChain: boolean;
}
/** Hook to access the CinaConnect context. Throws if used outside provider. */
export declare function useCinaConnectContext(): CinaConnectContextValue;
/** Provider props. */
export interface CinaConnectProviderProps {
    config: CinaConnectConfig;
    children: ReactNode;
}
/**
 * CinaConnectProvider — React context provider for CinaConnect.
 *
 * Wraps the app and provides chain state, connection methods, and theming.
 *
 * ```tsx
 * <CinaConnectProvider config={{ chains: [...], theme: { mode: 'dark' } }}>
 *   <App />
 * </CinaConnectProvider>
 * ```
 */
export declare function CinaConnectProvider({ config, children }: CinaConnectProviderProps): JSX.Element;
//# sourceMappingURL=OnChainUXProvider.d.ts.map