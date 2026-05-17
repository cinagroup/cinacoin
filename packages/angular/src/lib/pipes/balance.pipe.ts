import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a balance from wei (or smallest unit) to a human-readable ETH value.
 *
 * ```html
 * <p>Balance: {{ balance | cinaBalance }}</p>
 * ```
 *
 * @usageNotes
 * Specify the number of decimal places to display:
 * ```html
 * <p>{{ balance | cinaBalance: 2 }}</p> <!-- 1.23 ETH -->
 * <p>{{ balance | cinaBalance: 6 }}</p> <!-- 1.234567 ETH -->
 * ```
 *
 * Supports input as string (wei), number, or bigint.
 */
@Pipe({ name: 'cinaBalance' })
export class BalancePipe implements PipeTransform {
  /** Default decimals for the display. */
  private static readonly DEFAULT_DECIMALS = 4;

  /** Wei per ETH (10^18). */
  private static readonly WEI_PER_ETH = BigInt('1000000000000000000');

  /**
   * Transform a wei balance to a human-readable ETH string.
   *
   * @param value - Balance in wei as string, number, or bigint.
   * @param decimals - Number of decimal places. Defaults to 4.
   * @returns Formatted balance string with ETH suffix, or empty string.
   */
  transform(value: string | number | bigint | null | undefined, decimals?: number): string {
    if (value == null || value === '' || value === '0') return '0 ETH';

    let wei: bigint;
    try {
      if (typeof value === 'bigint') {
        wei = value;
      } else if (typeof value === 'number') {
        wei = BigInt(Math.floor(value));
      } else {
        // Handle string input — strip any non-numeric characters
        const cleaned = String(value).replace(/[^0-9-]/g, '');
        if (!cleaned || cleaned === '-') return '0 ETH';
        wei = BigInt(cleaned);
      }
    } catch {
      return '0 ETH';
    }

    if (wei === 0n) return '0 ETH';

    const ethWei = BalancePipe.WEI_PER_ETH;
    const whole = wei / ethWei;
    const remainder = wei % ethWei;

    const decimalsToUse = decimals ?? BalancePipe.DEFAULT_DECIMALS;

    if (remainder === 0n) {
      return `${whole} ETH`;
    }

    // Format the fractional part with proper zero-padding
    const remainderStr = remainder.toString().padStart(18, '0');
    const truncated = remainderStr.slice(0, decimalsToUse);

    // Remove trailing zeros for cleaner output
    const trimmedTruncated = truncated.replace(/0+$/, '');
    const fractionPart = trimmedTruncated.length > 0 ? `.${trimmedTruncated}` : '';

    return `${whole}${fractionPart} ETH`;
  }
}
