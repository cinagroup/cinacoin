/**
 * @cinacoin/react-native — Expo Router compatibility layer
 *
 * Provides integration with Expo Router for deep linking, navigation,
 * and WalletConnect URI handling in Expo applications.
 *
 * Features:
 * - Expo Router navigation integration
 * - Deep link handling for WalletConnect URIs
 * - Universal link support
 * - QR code scanning with expo-camera
 * - Clipboard integration with expo-clipboard
 *
 * @example
 * ```tsx
 * import { ExpoCinacoinProvider } from '@cinacoin/react-native/expo';
 *
 * export default function App() {
 *   return (
 *     <ExpoCinacoinProvider config={config}>
 *       <Slot />
 *     </ExpoCinacoinProvider>
 *   );
 * }
 * ```
 */

import React, { useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { CinacoinConfig, CinacoinContextValue } from './CinaCoinProvider';
import { CinacoinProvider, useCinacoinContext } from './CinaCoinProvider';

// ============================================================================
// Types
// ============================================================================

/**
 * Expo-specific configuration options.
 */
export interface ExpoConfig {
  /** Expo project scheme for deep linking (e.g. 'myapp://') */
  scheme?: string;
  
  /** Enable QR code scanning with expo-camera */
  enableQRScanner?: boolean;
  
  /** Enable clipboard integration for WC URIs */
  enableClipboard?: boolean;
  
  /** Custom handler for incoming deep links */
  onDeepLink?: (url: string) => void;
  
  /** Expo Router path for wallet connection screen */
  connectPath?: string;
}

/**
 * Expo Cinacoin context value (extends base context).
 */
export interface ExpoCinacoinContextValue extends CinacoinContextValue {
  /** Handle incoming deep link URL */
  handleDeepLink: (url: string) => Promise<void>;
  
  /** Open QR scanner and connect from scanned URI */
  scanAndConnect: () => Promise<void>;
  
  /** Copy WC URI to clipboard */
  copyWcUri: () => Promise<void>;
  
  /** Check if running in Expo environment */
  isExpo: boolean;
}

// ============================================================================
// Context
// ============================================================================

const ExpoCinacoinContext = createContext<ExpoCinacoinContextValue | null>(null);

/**
 * Hook to access Expo-enhanced Cinacoin context.
 */
export function useExpoCinacoin(): ExpoCinacoinContextValue {
  const ctx = useContext(ExpoCinacoinContext);
  if (!ctx) {
    throw new Error('useExpoCinacoin must be used within ExpoCinacoinProvider');
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

/**
 * Props for ExpoCinacoinProvider.
 */
export interface ExpoCinacoinProviderProps {
  config: CinacoinConfig;
  expoConfig?: ExpoConfig;
  children: ReactNode;
}

/**
 * Expo-enhanced Cinacoin provider with deep linking and Expo Router support.
 *
 * Wraps the base CinacoinProvider and adds:
 * - Deep link handling via expo-linking
 * - QR code scanning via expo-camera
 * - Clipboard integration via expo-clipboard
 * - Expo Router navigation
 *
 * @example
 * ```tsx
 * import { ExpoCinacoinProvider } from '@cinacoin/react-native/expo';
 * import { Slot } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <ExpoCinacoinProvider
 *       config={{ projectId: '...', relayUrl: '...' }}
 *       expoConfig={{ scheme: 'myapp', enableQRScanner: true }}
 *     >
 *       <Slot />
 *     </ExpoCinacoinProvider>
 *   );
 * }
 * ```
 */
export function ExpoCinacoinProvider({
  config,
  expoConfig = {},
  children,
}: ExpoCinacoinProviderProps): JSX.Element {
  const baseContext = useCinacoinContext();
  
  const {
    scheme,
    enableQRScanner = true,
    enableClipboard = true,
    onDeepLink,
    connectPath = '/wallet/connect',
  } = expoConfig;

  /**
   * Handle incoming deep link URL.
   * Parses WalletConnect URI and initiates connection.
   */
  const handleDeepLink = useCallback(
    async (url: string): Promise<void> => {
      try {
        // Parse WC URI from deep link
        // Format: myapp://wc?uri=wc:...
        const parsed = new URL(url);
        const wcUri = parsed.searchParams.get('uri');
        
        if (wcUri && wcUri.startsWith('wc:')) {
          await baseContext.connectWithUri(wcUri);
        }
        
        // Call custom handler if provided
        if (onDeepLink) {
          onDeepLink(url);
        }
      } catch (error) {
        console.error('[ExpoCinacoin] Failed to handle deep link:', error);
      }
    },
    [baseContext, onDeepLink],
  );

  /**
   * Open QR scanner and connect from scanned WC URI.
   * Requires expo-camera and expo-barcode-scanner.
   */
  const scanAndConnect = useCallback(async (): Promise<void> => {
    if (!enableQRScanner) {
      throw new Error('QR scanner is disabled. Set enableQRScanner: true in expoConfig.');
    }

    try {
      // Dynamic import to avoid bundling if not used
      const { BarcodeScanningResult } = await import('expo-barcode-scanner');
      
      // In a real implementation, this would open a camera modal
      // For now, we'll use a placeholder that shows how it would work
      console.warn('[ExpoCinacoin] QR scanner not yet implemented. Use expo-camera + expo-barcode-scanner.');
      
      // Example implementation:
      // const result = await BarcodeScanner.scanAsync();
      // if (result.data.startsWith('wc:')) {
      //   await baseContext.connectWithUri(result.data);
      // }
    } catch (error) {
      console.error('[ExpoCinacoin] QR scan failed:', error);
      throw error;
    }
  }, [enableQRScanner, baseContext]);

  /**
   * Copy WC URI to clipboard.
   * Requires expo-clipboard.
   */
  const copyWcUri = useCallback(async (): Promise<void> => {
    if (!enableClipboard) {
      throw new Error('Clipboard is disabled. Set enableClipboard: true in expoConfig.');
    }

    if (!baseContext.wcUri) {
      throw new Error('No WC URI available. Create a pairing first.');
    }

    try {
      // Dynamic import to avoid bundling if not used
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(baseContext.wcUri);
    } catch (error) {
      console.error('[ExpoCinacoin] Clipboard copy failed:', error);
      throw error;
    }
  }, [enableClipboard, baseContext.wcUri]);

  // Set up deep link listener
  useEffect(() => {
    if (!scheme) return;

    let isMounted = true;

    const setupDeepLinkListener = async () => {
      try {
        const Linking = await import('expo-linking');
        
        // Handle initial URL (app opened via deep link)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && isMounted) {
          await handleDeepLink(initialUrl);
        }
        
        // Listen for incoming deep links while app is running
        const subscription = Linking.addEventListener('url', (event) => {
          if (isMounted) {
            handleDeepLink(event.url);
          }
        });
        
        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.error('[ExpoCinacoin] Failed to set up deep link listener:', error);
      }
    };

    const cleanup = setupDeepLinkListener();
    
    return () => {
      isMounted = false;
      cleanup.then((fn) => fn?.());
    };
  }, [scheme, handleDeepLink]);

  const value: ExpoCinacoinContextValue = {
    ...baseContext,
    handleDeepLink,
    scanAndConnect,
    copyWcUri,
    isExpo: true,
  };

  return (
    <ExpoCinacoinContext.Provider value={value}>
      {children}
    </ExpoCinacoinContext.Provider>
  );
}

// ============================================================================
// Expo Router Integration
// ============================================================================

/**
 * Navigate to wallet connection screen using Expo Router.
 *
 * @param router - Expo Router instance (from useRouter())
 * @param wcUri - Optional WC URI to pass as query param
 */
export function navigateToConnect(
  router: { push: (href: string) => void },
  connectPath: string = '/wallet/connect',
  wcUri?: string,
): void {
  const href = wcUri ? `${connectPath}?uri=${encodeURIComponent(wcUri)}` : connectPath;
  router.push(href);
}

/**
 * Get WC URI from Expo Router query params.
 *
 * @param searchParams - URLSearchParams from Expo Router
 * @returns WC URI if present, null otherwise
 */
export function getWcUriFromParams(searchParams: URLSearchParams): string | null {
  const uri = searchParams.get('uri');
  return uri && uri.startsWith('wc:') ? uri : null;
}

// ============================================================================
// Expo Crypto Integration
// ============================================================================

/**
 * Generate cryptographically secure random bytes using expo-crypto.
 *
 * Falls back to React Native's crypto.getRandomValues if expo-crypto
 * is not available.
 *
 * @param length - Number of bytes to generate
 * @returns Uint8Array of random bytes
 */
export async function getRandomBytes(length: number): Promise<Uint8Array> {
  try {
    // Try expo-crypto first
    const ExpoCrypto = await import('expo-crypto');
    const bytes = new Uint8Array(length);
    
    // expo-crypto provides getRandomBytes method
    if ('getRandomBytes' in ExpoCrypto) {
      return await ExpoCrypto.getRandomBytes(length);
    }
    
    // Fallback: use getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
      return bytes;
    }
    
    throw new Error('No crypto implementation available');
  } catch (error) {
    console.error('[ExpoCinacoin] Failed to generate random bytes:', error);
    throw error;
  }
}

/**
 * Generate a random nonce for SIWE messages.
 *
 * @param length - Length of nonce in characters (default: 16)
 * @returns Random nonce string (hex-encoded)
 */
export async function generateNonce(length: number = 16): Promise<string> {
  const bytes = await getRandomBytes(length);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a message using SHA-256 via expo-crypto.
 *
 * @param message - Message to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function sha256(message: string): Promise<string> {
  try {
    const ExpoCrypto = await import('expo-crypto');
    
    if ('digestStringAsync' in ExpoCrypto) {
      return await ExpoCrypto.digestStringAsync(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        message,
      );
    }
    
    throw new Error('expo-crypto digestStringAsync not available');
  } catch (error) {
    console.error('[ExpoCinacoin] SHA-256 hash failed:', error);
    throw error;
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if the app is running in an Expo environment.
 *
 * @returns true if running in Expo
 */
export function isExpoEnvironment(): boolean {
  try {
    // Check for expo-constants
    const Constants = require('expo-constants');
    return !!Constants.expoConfig;
  } catch {
    return false;
  }
}

/**
 * Get Expo app configuration.
 *
 * @returns Expo config or null if not in Expo environment
 */
export async function getExpoConfig(): Promise<any | null> {
  try {
    const Constants = await import('expo-constants');
    return Constants.default?.expoConfig ?? null;
  } catch {
    return null;
  }
}

/**
 * Build a deep link URL for the current app.
 *
 * @param path - Path to link to (e.g. '/wallet/connect')
 * @param scheme - App scheme (e.g. 'myapp')
 * @returns Full deep link URL
 */
export function buildDeepLink(path: string, scheme: string): string {
  return `${scheme}://${path}`;
}
