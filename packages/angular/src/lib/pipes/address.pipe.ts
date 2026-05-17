import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates an Ethereum-style address to a readable short format.
 *
 * Transforms `0x1234567890abcdef1234567890abcdef12345678`
 * to `0x1234...5678`.
 *
 * ```html
 * <p>Address: {{ address | cinaAddress }}</p>
 * ```
 *
 * @usageNotes
 * Customize the number of characters shown on each side:
 * ```html
 * <p>{{ address | cinaAddress: 4 }}</p> <!-- 0x1234...5678 -->
 * <p>{{ address | cinaAddress: 6 }}</p> <!-- 0x123456...345678 -->
 * ```
 */
@Pipe({ name: 'cinaAddress' })
export class AddressPipe implements PipeTransform {
  /**
   * Transform a full address to a shortened display format.
   *
   * @param value - The full address string (e.g., '0x1234...5678').
   * @param chars - Number of characters to show on each side. Defaults to 4.
   * @returns Shortened address or the original value if too short.
   */
  transform(value: string | null | undefined, chars = 4): string {
    if (!value) return '';
    const address = String(value).trim();
    if (address.length <= chars * 2 + 2) return address;

    const prefix = address.startsWith('0x') ? '0x' : '';
    const stripped = address.startsWith('0x') ? address.slice(2) : address;

    if (stripped.length <= chars * 2) return address;

    const start = stripped.slice(0, chars);
    const end = stripped.slice(-chars);
    return `${prefix}${start}...${end}`;
  }
}
