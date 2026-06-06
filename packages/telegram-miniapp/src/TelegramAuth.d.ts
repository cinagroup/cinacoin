/**
 * Telegram login integration.
 *
 * Validates Telegram init data on the server side and maps
 * Telegram users to wallet accounts.
 */
import type { TelegramUser, TelegramLoginResult } from './types.js';
import type { TelegramProvider } from './TelegramProvider.js';
/**
 * Validate Telegram init data hash server-side.
 *
 * Implements the Telegram WebApp data validation algorithm:
 * 1. Sort the data-check-string parameters alphabetically
 * 2. Concatenate with \n
 * 3. HMAC-SHA256 with SHA256(botToken) as key
 * 4. Compare with the hash field
 *
 * @param initData - Raw init data string from Telegram.
 * @param botToken - Telegram Bot API token (server-side only).
 * @returns True if the data is valid.
 */
export declare function validateInitData(initData: string, botToken: string): boolean;
/**
 * Parse init data string into a structured object.
 *
 * @param initData - Raw init data string.
 * @returns Parsed parameters as Record<string, string>.
 */
export declare function parseInitData(initData: string): Record<string, string>;
/**
 * Build a login result from provider data.
 *
 * @param provider - TelegramProvider instance.
 * @returns TelegramLoginResult or null if not available.
 */
export declare function buildLoginResult(provider: TelegramProvider): TelegramLoginResult | null;
/**
 * Create a wallet-compatible identifier from Telegram user ID.
 *
 * This generates a deterministic string that can be used as a
 * key to map Telegram users to wallet accounts.
 *
 * @param telegramId - Telegram user ID.
 * @returns Deterministic identifier string.
 * @deprecated Prefer server-side account mapping.
 */
export declare function telegramIdToAddress(telegramId: number): string;
/**
 * Generate a Sign-In message for Telegram users.
 *
 * Creates a message that can be used with SIWE (Sign-In With Ethereum)
 * to link a wallet to a Telegram account.
 *
 * @param user - Telegram user data.
 * @param domain - The domain requesting the sign-in.
 * @param nonce - Random nonce for replay protection.
 * @returns Sign-in message string.
 */
export declare function generateSignInMessage(user: TelegramUser, domain: string, nonce: string): string;
/**
 * Check if init data is expired.
 *
 * @param initData - Raw init data string.
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours).
 * @returns True if the data is expired.
 */
export declare function isInitDataExpired(initData: string, maxAgeMs?: number): boolean;
//# sourceMappingURL=TelegramAuth.d.ts.map