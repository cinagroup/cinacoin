/**
 * Universal Link (iOS) / App Link (Android) support.
 *
 * Universal links provide a fallback when deep links fail — they open the
 * native app if installed, or fall back to the app store / web.
 */
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
export function generateUniversalLink(params) {
    const { domain, path, params: queryParams, fallbackUrl } = params;
    let url = `https://${domain}${path}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
        const qs = Object.entries(queryParams)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        url += `?${qs}`;
    }
    // Some universal link providers support a fallback URL parameter.
    if (fallbackUrl) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}fallback=${encodeURIComponent(fallbackUrl)}`;
    }
    return url;
}
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
export function generateWalletConnectUniversalLink(walletId, wcUri, fallbackUrl) {
    const domainMap = {
        metamask: 'metamask.app.link',
        rainbow: 'rnbwapp.com',
        coinbase: 'go.cb-w.com',
        walletconnect: 'walletconnect.com',
        trust: 'link.trustwallet.com',
        phantom: 'phantom.app',
        zerion: 'links.zerion.io',
    };
    const domain = domainMap[walletId] || 'walletconnect.com';
    return generateUniversalLink({
        domain,
        path: '/wc',
        params: { uri: wcUri },
        fallbackUrl,
    });
}
//# sourceMappingURL=universal-link.js.map