import { jsx as _jsx } from "react/jsx-runtime";
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
export function AppKitPagesRouter({ projectId, networks, themeMode = 'dark', themeVariables, metadata, recommendedWallets, children, }) {
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
    // For Pages Router, we always render the provider, but the inner state
    // (address, balance, etc.) won't hydrate until client-side activation.
    // This is safe because CinaConnectProvider initializes with null/default values.
    if (!mounted) {
        return _jsx(CinaConnectProvider, { config: { ...config }, children: children });
    }
    return (_jsx(CinaConnectProvider, { config: config, children: children }));
}
//# sourceMappingURL=AppKitPagesRouter.js.map