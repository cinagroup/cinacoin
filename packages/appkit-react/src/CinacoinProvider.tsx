/**
 * CinacoinProvider — React Context wrapper for @cinacoin/appkit
 *
 * Provides the AppKit instance to all descendant components via React Context.
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  createCinacoinAppKit,
  type CinacoinAppKitConfig,
  type CinacoinAppKitInstance,
} from '@cinacoin/appkit';

// ============================================================================
// Context
// ============================================================================

const CinacoinAppKitContext = createContext<CinacoinAppKitInstance | null>(null);

/**
 * Hook to access the CinacoinAppKit instance from any descendant component.
 *
 * @throws If used outside of <CinacoinProvider>
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const appkit = useCinacoinAppKit();
 *   return <button onClick={() => appkit.open()}>Connect</button>;
 * }
 * ```
 */
export function useCinacoinAppKit(): CinacoinAppKitInstance {
  const ctx = useContext(CinacoinAppKitContext);
  if (!ctx) {
    throw new Error('useCinacoinAppKit must be used within a <CinacoinProvider>');
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

export interface CinacoinProviderProps {
  /** AppKit configuration (projectId, chains, metadata, etc.) */
  config: CinacoinAppKitConfig;
  /** Child components that will have access to the AppKit context */
  children: ReactNode;
}

/**
 * Top-level provider that initializes the AppKit instance and makes it
 * available to all descendants via `useCinacoinAppKit()`.
 *
 * @example
 * ```tsx
 * import { CinacoinProvider } from '@cinacoin/appkit-react';
 *
 * function App() {
 *   return (
 *     <CinacoinProvider config={{ projectId: 'xxx', chains: [...], metadata: {...} }}>
 *       <MyDapp />
 *     </CinacoinProvider>
 *   );
 * }
 * ```
 */
export function CinacoinProvider({ config, children }: CinacoinProviderProps): React.ReactElement {
  const appkit = useMemo<CinacoinAppKitInstance>(
    () => createCinacoinAppKit(config),
    // Re-create only when identity-critical fields change
    // config is intentionally omitted: only projectId/defaultChain affect identity
    [config.projectId, config.defaultChain],
  );

  return (
    <CinacoinAppKitContext.Provider value={appkit}>
      {children}
      {/* Mount the modal component into the tree */}
      <appkit.Component />
    </CinacoinAppKitContext.Provider>
  );
}
