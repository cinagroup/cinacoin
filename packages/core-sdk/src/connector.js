/**
 * Connector interface — abstract base for all wallet connection methods.
 */
import { EventEmitter } from './events.js';
import { generateDeepLink, smartRedirect, detectPlatform } from './links/index.js';
/**
 * Handles platform detection and redirect logic for deep links.
 * Can be overridden for React Native or custom environments.
 */
export class RedirectHandler {
    constructor(platform) {
        this.platform = platform ?? detectPlatform();
    }
    /**
     * Open a deep link for the given wallet.
     *
     * Uses the smart redirect strategy: deep link → timeout → universal link → QR code.
     *
     * @param walletId - Wallet identifier (e.g., 'metamask', 'rainbow').
     * @param uri - URI to pass to the wallet (e.g., WalletConnect URI).
     * @param params - Additional deep link parameters.
     * @returns Promise resolving with the redirect result.
     */
    async openDeepLink(walletId, uri, params) {
        const deepLinkParams = {
            walletId,
            uri,
            ...params,
        };
        return smartRedirect(deepLinkParams, {
            platform: this.platform,
            timeoutMs: params?.fallbackTimeoutMs,
        });
    }
    /**
     * Generate a deep link URL without navigating.
     *
     * @param walletId - Wallet identifier.
     * @param uri - URI to pass to the wallet.
     * @param queryParams - Additional query parameters.
     * @returns The deep link URL string.
     */
    generateLink(walletId, uri, queryParams) {
        return generateDeepLink({
            walletId,
            uri,
            params: queryParams,
        });
    }
    /**
     * Set the platform for redirect handling.
     *
     * @param platform - Target platform.
     */
    setPlatform(platform) {
        this.platform = platform;
    }
}
/**
 * Connector abstract base class.
 *
 * Each wallet connection method (injected, QR, relay/WC) implements
 * this interface to provide a uniform API.
 */
export class Connector extends EventEmitter {
    /**
     * Get the raw underlying provider for advanced usage.
     * Returns null if the connector doesn't expose a raw provider.
     */
    getProvider() {
        return null;
    }
    /**
     * Open a deep link to the wallet app.
     *
     * Generates a deep link URL and uses the redirect handler to navigate,
     * with automatic fallback to universal links and QR codes.
     *
     * @param walletId - Wallet identifier (e.g., 'metamask', 'rainbow').
     * @param uri - URI to pass to the wallet (e.g., WalletConnect URI).
     * @param params - Additional parameters for the deep link.
     * @returns Promise resolving with the redirect result.
     */
    async openDeepLink(walletId, uri, params) {
        const handler = this.redirectHandler ?? new RedirectHandler();
        return handler.openDeepLink(walletId, uri, params);
    }
    /**
     * Generate a deep link URL without triggering navigation.
     *
     * @param walletId - Wallet identifier.
     * @param uri - URI to pass to the wallet.
     * @param queryParams - Additional query parameters.
     * @returns The deep link URL string.
     */
    generateDeepLink(walletId, uri, queryParams) {
        return generateDeepLink({
            walletId,
            uri,
            params: queryParams,
        });
    }
    /**
     * Set the redirect handler for this connector.
     *
     * @param handler - RedirectHandler instance, or undefined to reset.
     */
    setRedirectHandler(handler) {
        this.redirectHandler = handler;
    }
}
//# sourceMappingURL=connector.js.map