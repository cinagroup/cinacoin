'use client';
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { CinaConnectProvider, } from '@cinaconnect/react';
/**
 * Default Ethereum mainnet chain configuration.
 */
const defaultChain = {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io',
};
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
export function AppKitProvider({ projectId, networks, themeMode = 'dark', themeVariables, metadata, recommendedWallets, children, }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    const chains = networks && networks.length > 0 ? networks : [defaultChain];
    const config = {
        projectId,
        chains,
        theme: {
            mode: themeMode,
            variables: themeVariables,
        },
        metadata,
        recommendedWallets,
    };
    // During SSR, render children without the CinaConnect provider to avoid
    // hydration mismatch. The provider activates on first client render.
    if (!mounted) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsx(CinaConnectProvider, { config: config, children: children }));
}
//# sourceMappingURL=AppKitProvider.js.map