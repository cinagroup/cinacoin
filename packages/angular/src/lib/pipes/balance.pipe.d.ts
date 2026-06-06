import { PipeTransform } from '@angular/core';
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
export declare class BalancePipe implements PipeTransform {
    /** Default decimals for the display. */
    private static readonly DEFAULT_DECIMALS;
    /** Wei per ETH (10^18). */
    private static readonly WEI_PER_ETH;
    /**
     * Transform a wei balance to a human-readable ETH string.
     *
     * @param value - Balance in wei as string, number, or bigint.
     * @param decimals - Number of decimal places. Defaults to 4.
     * @returns Formatted balance string with ETH suffix, or empty string.
     */
    transform(value: string | number | bigint | null | undefined, decimals?: number): string;
}
//# sourceMappingURL=balance.pipe.d.ts.map