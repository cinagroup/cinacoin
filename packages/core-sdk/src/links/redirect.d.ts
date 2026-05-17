/**
 * Smart redirect logic for wallet deep links.
 *
 * Detects platform (iOS/Android/Web), attempts deep link first,
 * falls back to universal link after timeout, then to QR code.
 */
import type { DeepLinkParams, Platform, RedirectOptions, RedirectResult } from './types.js';
/**
 * Detect the current platform.
 *
 * Uses navigator.userAgent on web, or React Native's Platform module.
 *
 * @returns Detected platform.
 */
export declare function detectPlatform(): Platform;
/**
 * Smart redirect handler.
 *
 * Tries deep link first → timeout → universal link → fallback to QR code.
 *
 * @param params - Deep link parameters.
 * @param options - Redirect options including platform and callbacks.
 * @returns Promise resolving with the redirect result.
 */
export declare function smartRedirect(params: DeepLinkParams, options: RedirectOptions): Promise<RedirectResult>;
//# sourceMappingURL=redirect.d.ts.map