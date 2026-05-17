import React, { type ReactNode } from 'react';
import { type ChainConfig, type ThemeMode } from '@cinaconnect/react';
/**
 * Props for the AppKitPagesRouter component.
 */
export interface AppKitPagesRouterProps {
    /**
     * CinaConnect project ID (from https://cloud.cinaconnect.com).
     */
    projectId: string;
    /**
     * Supported chains.
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
 * AppKitPagesRouter — SSR-safe provider for Next.js Pages Router (legacy `_app.tsx`).
 *
 * Unlike the App Router provider, this component renders during SSR as well,
 * but initializes the CinaConnect context in a hydration-safe way.
 *
 * Usage:
 * ```tsx
 * // pages/_app.tsx
 * import type { AppProps } from 'next/app';
 * import { AppKitPagesRouter } from '@cinaconnect/next';
 *
 * export default function App({ Component, pageProps }: AppProps) {
 *   return (
 *     <AppKitPagesRouter projectId="your-project-id" networks={[mainnet]}>
 *       <Component {...pageProps} />
 *     </AppKitPagesRouter>
 *   );
 * }
 * ```
 */
export declare function AppKitPagesRouter({ projectId, networks, themeMode, themeVariables, metadata, recommendedWallets, children, }: AppKitPagesRouterProps): React.JSX.Element;
//# sourceMappingURL=AppKitPagesRouter.d.ts.map