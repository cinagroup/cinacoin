/**
 * Universal Link (iOS) / App Link (Android) support.
 *
 * Universal links provide a fallback when deep links fail — they open the
 * native app if installed, or fall back to the app store / web.
 */
/** Parameters for generating a universal link. */
export interface UniversalLinkParams {
    /** Universal link domain (e.g., 'metamask.app.link'). */
    domain: string;
    /** Path within the universal link (e.g., '/wc'). */
    path: string;
    /** Query parameters to include in the URL. */
    params?: Record<string, string>;
    /** Fallback URL if the app is not installed (typically app store or web). */
    fallbackUrl?: string;
}
/**
 * Generate a Universal Link URL for iOS or Android.
 *
 * Universal links are HTTPS URLs that iOS/Android route to the native app
 * if installed, otherwise they open in the browser (and can redirect to
 * the app store via the fallback URL).
 *
 * @param params - Universal link parameters.
 * @returns The complete universal link URL.
 */
export declare function generateUniversalLink(params: UniversalLinkParams): string;
/**
 * Generate a WalletConnect v2 universal link.
 *
 * This is a convenience wrapper for the most common use case.
 *
 * @param walletId - Wallet identifier (e.g., 'metamask', 'rainbow').
 * @param wcUri - WalletConnect URI (wc:...).
 * @param fallbackUrl - URL to open if wallet app is not installed.
 * @returns Universal link URL.
 */
export declare function generateWalletConnectUniversalLink(walletId: string, wcUri: string, fallbackUrl?: string): string;
//# sourceMappingURL=universal-link.d.ts.map