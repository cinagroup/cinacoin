/**
 * NetworkBadge Web Component
 *
 * Small pill showing the current network name and icon.
 *
 * Properties:
 *   - name: network name (e.g., "Ethereum")
 *   - iconUrl: optional icon URL
 *
 * Usage: <ocx-network-badge name="Ethereum"></ocx-network-badge>
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';

@customElement('ocx-network-badge')
export class NetworkBadge extends BaseLitElement {
  static override get styles() {
    return [
      super.hostStyles,
      css`
        :host {
          display: inline-flex;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: var(--ocx-space-1, 0.25rem);
          padding: var(--ocx-space-1, 0.25rem) var(--ocx-space-2, 0.5rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-full, 9999px);
          font-size: var(--ocx-font-size-xs, 0.75rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          color: var(--ocx-color-text-primary, #f8fafc);
          white-space: nowrap;
        }

        .icon {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon img {
          width: 12px;
          height: 12px;
        }
      `,
    ];
  }

  @property() name = '';
  @property() iconUrl = '';

  override render() {
    return html`
      <span class="badge">
        ${this.iconUrl
          ? html`<span class="icon"><img src="${this.iconUrl}" alt="" /></span>`
          : html`<span class="icon">⛓</span>`
        }
        ${this.name}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ocx-network-badge': NetworkBadge;
  }
}
