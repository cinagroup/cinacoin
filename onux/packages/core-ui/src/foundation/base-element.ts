/**
 * BaseLitElement — base class for all Cinacoin Web Components.
 *
 * Extends Lit's `LitElement` with theme management, CSS variable injection,
 * and utility formatting methods. All OCX components extend this class to
 * ensure consistent styling, theming, and accessibility defaults.
 *
 * @example
 * ```ts
 * class MyComponent extends BaseLitElement {
 *   static override styles = [...BaseLitElement.styles, css`...`];
 *   render() { return html`<p>Hello</p>`; }
 * }
 * ```
 */

import { LitElement, css, CSSResultGroup } from 'lit';

/** Supported theme identifiers. */
export type OCXTheme = 'dark' | 'light' | 'minimal';

/** Base element class that all OCX components extend. */
export abstract class BaseLitElement extends LitElement {
  /** Current theme name. */
  protected theme: OCXTheme = 'dark';

  /** Host-level CSS variables injected into the component. */
  static hostStyles = css`
    :host {
      display: block;
      font-family: var(--ocx-font-family, 'Inter', system-ui, sans-serif);
      color: var(--ocx-color-text-primary, #f8fafc);
      font-size: var(--ocx-font-size-md, 1rem);
      line-height: var(--ocx-line-height, 1.5);
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    :host *,
    :host *::before,
    :host *::after {
      box-sizing: border-box;
    }
  `;

  /** Override in subclasses to provide component-specific styles. */
  static override get styles(): CSSResultGroup {
    return [(this as typeof BaseLitElement).hostStyles];
  }

  /**
   * Called when the element is added to the DOM.
   * Applies the current theme and sets up any runtime configuration.
   */
  override connectedCallback(): void {
    super.connectedCallback();
    this._applyTheme();
  }

  /**
   * Called when an observed attribute changes.
   * Triggers theme re-application when `data-ocx-theme` or `theme` changes.
   */
  override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, _old, value);
    if (name === 'data-ocx-theme' || name === 'theme') {
      this.theme = (value as OCXTheme) || 'dark';
      this._applyTheme();
    }
  }

  /** Read the effective theme from the host attribute or nearest ancestor. */
  private _applyTheme(): void {
    const attr =
      this.getAttribute('data-ocx-theme') ??
      this.getAttribute('theme') ??
      this.closest('[data-ocx-theme]')?.getAttribute('data-ocx-theme');
    if (attr && ['dark', 'light', 'minimal'].includes(attr)) {
      this.theme = attr as OCXTheme;
    }
  }

  /**
   * Format an address as a truncated string (e.g., `0x1234...5678`).
   *
   * @param address - The full address string.
   * @param prefix - Number of characters to show at the start (default: 4).
   * @param suffix - Number of characters to show at the end (default: 4).
   * @returns Truncated address string, or original if too short to truncate.
   */
  protected formatAddress(address: string, prefix = 4, suffix = 4): string {
    if (address.length <= prefix + suffix + 2) return address;
    return `${address.slice(0, prefix + 2)}...${address.slice(-suffix)}`;
  }

  /**
   * Format a numeric balance with locale-aware decimal separators.
   *
   * @param value - Number or string to format.
   * @param decimals - Number of decimal places (default: 2).
   * @returns Formatted balance string, or `'0.00'` for invalid input.
   */
  protected formatBalance(value: number | string, decimals = 2): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}
