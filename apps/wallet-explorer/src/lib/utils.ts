/** Shared utility functions */

import { ETH_ADDRESS_REGEX, TX_HASH_REGEX } from './constants';

/**
 * Truncate an address/hash for display: 0x1234...abcd
 */
export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

/**
 * Validate an Ethereum-style address
 */
export function isValidAddress(address: string): boolean {
  return ETH_ADDRESS_REGEX.test(address);
}

/**
 * Validate a transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return TX_HASH_REGEX.test(hash);
}

/**
 * Validate a positive numeric amount
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Format a number with locale-aware thousand separators
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Safe clipboard copy with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers / non-HTTPS contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Determine if a search query is an address, tx hash, or block number
 */
export function classifySearchQuery(query: string): 'address' | 'txHash' | 'block' | 'unknown' {
  const trimmed = query.trim();
  if (isValidAddress(trimmed)) return 'address';
  if (isValidTxHash(trimmed)) return 'txHash';
  if (/^\d+$/.test(trimmed)) return 'block';
  return 'unknown';
}
