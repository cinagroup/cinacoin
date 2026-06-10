/**
 * Dynamic-import helpers for Next.js App Router.
 *
 * Use these when you need to embed the provider or connect button inside
 * a Server Component page without triggering SSR errors.
 *
 * @example
 * ```tsx
 * // app/layout.tsx (Server Component)
 * import { DynamicCinacoinProvider } from '@cinacoin/appkit-next/dynamic';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <DynamicCinacoinProvider config={config}>
 *           {children}
 *         </DynamicCinacoinProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

import dynamic from 'next/dynamic';

/**
 * Dynamically imported CinacoinProvider — safe to use in Server Components.
 * The component is loaded only on the client side.
 */
export const DynamicCinacoinProvider = dynamic(
  () => import('@cinacoin/appkit-react').then((mod) => mod.CinacoinProvider),
  {
    ssr: false,
    loading: () => null,
  },
);

/**
 * Dynamically imported ConnectButton — safe to use in Server Components.
 */
export const DynamicConnectButton = dynamic(
  () => import('@cinacoin/appkit-react').then((mod) => mod.ConnectButton),
  {
    ssr: false,
    loading: () => null,
  },
);
