import React, { type ReactNode } from 'react';
import { type ChainConfig, type ThemeMode } from '@cinaconnect/react';
/**
 * Props for the AppKitProvider component.
 */
export interface AppKitProviderProps {
    /**
     * CinaConnect project ID (from https://cloud.cinaconnect.com).
     */
    projectId: string;
    /**
     * Supported chains. Each chain must define an `id` and `nativeCurrency`.
     * @default [{ id: 1, name: 'Ethereum', rpcUrl: 'https://eth.llamarpc.com', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } }]
     */
    networks?: ChainConfig[];
    /**
     * Theme mode for the connect UI.
     * @default 'dark'
     */
    themeMode?: ThemeMode;
    /**
     * Optional theme variable overrides (CSS custom properties).
     */
    themeVariables?: Record<string, string>;
    /**
     * App metadata displayed in the connect modal.
     */
    metadata?: {
        name: string;
        description: string;
        url: string;
        icons?: string[];
    };
    /**
     * Recommended wallet connector IDs for ordering in the connect UI.
     */
    recommendedWallets?: string[];
    /**
     * Children to render within the provider.
     */
    children: ReactNode;
}
/**
 * AppKitProvider — App Router compatible provider for Next.js 13+.
 *
 * This is a `'use client'` component that wraps the CinaConnect React provider
 * with Next.js-specific considerations:
 *
 * - Hydration-safe initialization (avoids SSR/CSR mismatch on address, chainId, etc.)
 * - Defers provider rendering until mounted on the client
 * - Passes project ID through to the underlying CinaConnectConfig
 *
 * Usage:
 * ```tsx
 * // app/providers.tsx
 * 'use client';
 * import { AppKitProvider } from '@cinaconnect/next';
 * import { mainnet } from 'viem/chains';
 *
 * export function Providers({ children }) {
 *   return (
 *     <AppKitProvider projectId="your-project-id" networks={[mainnet]}>
 *       {children}
 *     </AppKitProvider>
 *   );
 * }
 * ```
 */
export declare function AppKitProvider({ projectId, networks, themeMode, themeVariables, metadata, recommendedWallets, children, }: AppKitProviderProps): React.JSX.Element;
//# sourceMappingURL=AppKitProvider.d.ts.map