/**
 * WalletList Web Component
 *
 * Renders a scrollable list of wallet cards.
 *
 * Properties:
 *   - wallets: WalletInfo[]
 *   - recommendedWalletIds: string[]
 *   - installedWalletIds: string[]
 *
 * Events:
 *   - ocx-wallet-select: fired when a wallet card is clicked
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  iconBackground?: string;
  description?: string;
  downloadUrl?: string;
  rdns?: string;
}

@customElement('ocx-wallet-list')
export class WalletList extends BaseLitElement {
  static override get styles() {
    return [
      super.hostStyles,
      css`
        :host {
          display: block;
          max-height: 360px;
          overflow-y: auto;
          background: var(--ocx-color-bg-primary, #0F172A);
          scrollbar-width: thin;
          scrollbar-color: var(--ocx-color-border, #334155) transparent;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: var(--ocx-space-3, 0.75rem);
          padding: var(--ocx-space-2, 0.5rem) 0;
        }

        .section-label {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          font-weight: var(--ocx-font-weight-semibold, 600);
          color: var(--ocx-color-text-tertiary, #64748B);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: var(--ocx-space-2, 0.5rem) 0;
        }

        .empty-state {
          text-align: center;
          padding: var(--ocx-space-8, 2rem) var(--ocx-space-4, 1rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
        }

        .empty-state p {
          margin: 0 0 var(--ocx-space-2, 0.5rem);
        }
      `,
    ];
  }

  @property({ type: Array }) wallets: WalletInfo[] = [];
  @property({ attribute: false }) recommendedWalletIds: string[] = [];
  @property({ attribute: false }) installedWalletIds: string[] = [];

  override render() {
    if (!this.wallets.length) {
      return html`
        <div class="empty-state">
          <p>No wallets available</p>
          <p style="font-size:var(--ocx-font-size-xs,0.75rem);">Install a wallet extension to get started</p>
        </div>
      `;
    }

    const recommended = this.wallets.filter(w => this.recommendedWalletIds.includes(w.id));
    const installed = this.wallets.filter(w =>
      this.installedWalletIds.includes(w.id) && !this.recommendedWalletIds.includes(w.id)
    );
    const others = this.wallets.filter(w =>
      !this.recommendedWalletIds.includes(w.id) && !this.installedWalletIds.includes(w.id)
    );

    return html`
      <div class="list">
        ${recommended.length ? html`
          <div class="section-label">Recommended</div>
          ${recommended.map(w => this._renderCard(w))}
        ` : nothing}
        ${installed.length ? html`
          <div class="section-label">Installed</div>
          ${installed.map(w => this._renderCard(w))}
        ` : nothing}
        ${others.length ? html`
          <div class="section-label">All Wallets</div>
          ${others.map(w => this._renderCard(w))}
        ` : nothing}
      </div>
    `;
  }

  private _renderCard(wallet: WalletInfo) {
    const isInstalled = this.installedWalletIds.includes(wallet.id);
    const isRecommended = this.recommendedWalletIds.includes(wallet.id);

    return html`
      <ocx-wallet-card
        .wallet=${wallet}
        ?installed=${isInstalled}
        ?recommended=${isRecommended}
        @click=${() => this._onSelect(wallet)}
      ></ocx-wallet-card>
    `;
  }

  private _onSelect(wallet: WalletInfo) {
    this.dispatchEvent(
      new CustomEvent('ocx-wallet-select', {
        bubbles: true,
        composed: true,
        detail: wallet,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ocx-wallet-list': WalletList;
  }
}
