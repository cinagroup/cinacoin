/**
 * QrCode Web Component
 *
 * Renders a WalletConnect QR code using the `qrcode` library.
 * Supports custom sizing, colors, URI copying to clipboard, and loading states.
 *
 * Properties:
 *   - uri: WalletConnect URI to encode
 *   - size: QR canvas size in pixels (default 200)
 *   - fgColor: Foreground color (default "#f8fafc")
 *   - bgColor: Background color (default "#1E293B")
 *   - loading: show spinner when true
 *
 * Usage:
 *   <ocx-qr-code uri="wc:..." size="220"></ocx-qr-code>
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { t, isRTL } from '../i18n/index.js';

import QRCode from 'qrcode';

@customElement('ocx-qr-code')
export class QrCode extends BaseLitElement {
  static override get styles() {
    return [
      super.hostStyles,
      css`
        :host {
          display: inline-block;
        }

        .wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--ocx-space-4, 1rem);
        }

        .qr-container {
          position: relative;
          border-radius: var(--ocx-radius-lg, 0.75rem);
          overflow: hidden;
          padding: var(--ocx-space-3, 0.75rem);
          background: var(--qr-bg, #1E293B);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-container svg,
        .qr-container canvas {
          display: block;
        }

        .qr-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--qr-bg, #1E293B);
          border-radius: inherit;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--ocx-color-border, #334155);
          border-top-color: var(--ocx-color-accent-500, #3B82F6);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .uri-display {
          width: 100%;
          max-width: 320px;
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #0F172A);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-md, 0.5rem);
          font-family: var(--ocx-font-mono, 'SF Mono', 'Fira Code', monospace);
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
          word-break: break-all;
          text-align: center;
          line-height: 1.5;
          max-height: 60px;
          overflow-y: auto;
        }

        .actions {
          display: flex;
          gap: var(--ocx-space-3, 0.75rem);
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--ocx-space-2, 0.5rem);
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-4, 1rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-md, 0.5rem);
          color: var(--ocx-color-text-primary, #f8fafc);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          cursor: pointer;
          transition: all var(--ocx-duration-fast, 150ms) ease;
        }
        .action-btn:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
          border-color: var(--ocx-color-border-hover, #4B5563);
        }
        .action-btn:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-btn.copied {
          background: var(--ocx-color-success-bg, rgba(34,197,94,0.15));
          border-color: var(--ocx-color-success, #22C55E);
          color: var(--ocx-color-success, #22C55E);
        }
      `,
    ];
  }

  @property() uri = '';
  @property({ type: Number }) size = 200;
  @property() fgColor = '#f8fafc';
  @property() bgColor = '#1E293B';
  @property({ type: Boolean }) loading = false;

  @state() private _copied = false;
  @state() private _error: string | null = null;
  @state() private _svgElement: Element | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (isRTL()) this.setAttribute('dir', 'rtl');
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('uri') || changedProperties.has('size') ||
        changedProperties.has('fgColor') || changedProperties.has('bgColor')) {
      if (this.uri && !this.loading) {
        this._generateSVG();
      }
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // Safely inject SVG using DOM API after render
    if (this._svgElement) {
      const wrapper = this.renderRoot.querySelector('.qr-svg-wrapper');
      if (wrapper) {
        wrapper.innerHTML = '';
        wrapper.appendChild(this._svgElement);
      }
    }
  }

  override render() {
    if (!this.uri) {
      return html`
        <div class="wrapper">
          <div class="qr-container" style="width:${this.size}px;height:${this.size}px;display:flex;align-items:center;justify-content:center;">
            <span style="color:var(--ocx-color-text-tertiary,#64748B);font-size:var(--ocx-font-size-sm,0.875rem);">${t('no_qr_data')}</span>
          </div>
        </div>
      `;
    }

    if (this.loading) {
      return html`
        <div class="wrapper">
          <div class="qr-container" style="width:${this.size}px;height:${this.size}px;--qr-bg:${this.bgColor};">
            <div class="qr-overlay">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="wrapper">
        <div class="qr-container" style="--qr-bg:${this.bgColor};">
          ${this._error
            ? html`<span style="color:var(--ocx-color-error,#EF4444);font-size:var(--ocx-font-size-xs,0.75rem);">${this._error}</span>`
            : this._svgElement
              ? html`<div class="qr-svg-wrapper"></div>`
              : nothing
          }
        </div>

        <div class="uri-display">${this.uri}</div>

        <div class="actions">
          <button class="action-btn ${this._copied ? 'copied' : ''}"
                  @click=${this._copyUri}
                  ?disabled=${!this.uri || this.loading}>
            ${this._copied ? '✓' : '📋'} ${this._copied ? t('copied') : t('copy')}
          </button>
        </div>
      </div>
    `;
  }

  private async _generateSVG() {
    try {
      const svg = await QRCode.toString(this.uri, {
        type: 'svg',
        width: this.size,
        margin: 0,
        color: {
          dark: this.fgColor,
          light: this.bgColor,
        },
      });

      // Parse SVG string into DOM element safely using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (svgElement) {
        // Import the node into the document to ensure it's in the right context
        this._svgElement = document.importNode(svgElement, true);
      } else {
        this._svgElement = null;
      }
      this._error = null;
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
      this._svgElement = null;
    }
  }

  private async _copyUri() {
    try {
      await navigator.clipboard.writeText(this.uri);
      this._copied = true;
      setTimeout(() => { this._copied = false; }, 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = this.uri;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        this._copied = true;
        setTimeout(() => { this._copied = false; }, 2000);
      } catch {
        this._error = 'Failed to copy';
      }
      document.body.removeChild(ta);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ocx-qr-code': QrCode;
  }
}
