/**
 * WalletList Web Component
 *
 * Renders a scrollable, searchable list of wallet cards grouped by platform.
 * Supports "All Wallets" expandable mode.
 *
 * Properties:
 *   - wallets: WalletInfo[]
 *   - recommendedWalletIds: string[]
 *   - installedWalletIds: string[]
 *   - showAll: boolean — show full list vs top recommended (default: false)
 *   - limit: number — max wallets shown when showAll is false (default: 6)
 *
 * Events:
 *   - ocx-wallet-select: fired when a wallet card is clicked
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { t, isRTL } from '../i18n/index.js';

export type WalletPlatform = 'extension' | 'mobile' | 'desktop' | 'hardware';

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  iconBackground?: string;
  description?: string;
  downloadUrl?: string;
  rdns?: string;
  platforms?: WalletPlatform[];
}

const PLATFORM_LABELS: Record<WalletPlatform | 'all', string> = {
  extension: 'Browser Extension',
  mobile: 'Mobile',
  desktop: 'Desktop',
  hardware: 'Hardware',
  all: 'All Wallets',
};

const PLATFORM_ICONS: Record<WalletPlatform, string> = {
  extension: '🧩',
  mobile: '📱',
  desktop: '🖥',
  hardware: '🔐',
};

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
          gap: var(--ocx-space-1, 0.25rem);
          padding: var(--ocx-space-2, 0.5rem) 0;
        }

        .section-label {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          font-weight: var(--ocx-font-weight-semibold, 600);
          color: var(--ocx-color-text-tertiary, #64748B);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: var(--ocx-space-2, 0.5rem) 0;
          display: flex;
          align-items: center;
          gap: var(--ocx-space-1, 0.25rem);
        }

        .empty-state {
          text-align: center;
          padding: var(--ocx-space-8, 2rem) var(--ocx-space-4, 1rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
        }

        .empty-state p {
          margin: 0 0 var(--ocx-space-2, 0.5rem);
        }

        .show-all-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--ocx-space-2, 0.5rem);
          width: 100%;
          padding: var(--ocx-space-3, 0.75rem);
          margin-top: var(--ocx-space-4, 1rem);
          background: transparent;
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          color: var(--ocx-color-accent-500, #3B82F6);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          cursor: pointer;
          transition: all var(--ocx-duration-fast, 150ms) ease;
        }
        .show-all-btn:hover {
          background: var(--ocx-color-bg-card, #1E293B);
          border-color: var(--ocx-color-accent-500, #3B82F6);
        }
        .show-all-btn:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }
      `,
    ];
  }

  @property({ type: Array }) wallets: WalletInfo[] = [];
  @property({ attribute: false }) recommendedWalletIds: string[] = [];
  @property({ attribute: false }) installedWalletIds: string[] = [];
  @property({ type: Boolean, attribute: 'show-all' }) showAll: boolean = false;
  @property({ type: Number }) limit: number = 6;

  @state() private _expanded = false;

  override connectedCallback() {
    super.connectedCallback();
    if (isRTL()) this.setAttribute('dir', 'rtl');
  }

  private _toggleExpand() {
    this._expanded = !this._expanded;
    this.showAll = this._expanded;
  }

  override render() {
    if (!this.wallets.length) {
      return html`
        <div class="empty-state">
          <p>${t('no_wallets_found')}</p>
          <p style="font-size:var(--ocx-font-size-xs,0.75rem);">${t('install_wallet')}</p>
        </div>
      `;
    }

    const limit = this.showAll ? this.wallets.length : this.limit;

    // Group wallets by priority sections
    const recommended = this.wallets.filter(w => this.recommendedWalletIds.includes(w.id)).slice(0, limit);
    const remaining = limit - recommended.length;
    const installed = this.wallets.filter(w =>
      this.installedWalletIds.includes(w.id) && !this.recommendedWalletIds.includes(w.id)
    ).slice(0, remaining);
    const remainingAfter = limit - recommended.length - installed.length;
    const others = this.wallets.filter(w =>
      !this.recommendedWalletIds.includes(w.id) && !this.installedWalletIds.includes(w.id)
    ).slice(0, Math.max(0, remainingAfter));

    const totalCount = this.wallets.length;
    const shownCount = recommended.length + installed.length + others.length;
    const hasMore = totalCount > shownCount;

    // Check if wallets have platform data
    const hasPlatforms = this.wallets.some(w => w.platforms && w.platforms.length > 0);

    if (hasPlatforms && this.showAll) {
      return this._renderPlatformGroupedView();
    }

    return html`
      <div class="list">
        ${recommended.length ? html`
          <div class="section-label">⭐ ${t('recommended')}</div>
          ${recommended.map(w => this._renderCard(w))}
        ` : nothing}
        ${installed.length ? html`
          <div class="section-label">✓ ${t('installed')}</div>
          ${installed.map(w => this._renderCard(w))}
        ` : nothing}
        ${others.length ? html`
          <div class="section-label">${t('popular')}</div>
          ${others.map(w => this._renderCard(w))}
        ` : nothing}
      </div>
      ${hasMore
        ? html`
            <button class="show-all-btn" @click=${this._toggleExpand}>
              ${this._expanded ? '↑' : '↓'} ${t('wallet')} — ${t('filters')} (${totalCount})
            </button>
          `
        : nothing
      }
    `;
  }

  private _renderPlatformGroupedView() {
    const grouped = new Map<string, WalletInfo[]>();
    for (const w of this.wallets) {
      if (this.recommendedWalletIds.includes(w.id)) {
        if (!grouped.has('recommended')) grouped.set('recommended', []);
        grouped.get('recommended')!.push(w);
      } else if (this.installedWalletIds.includes(w.id)) {
        if (!grouped.has('installed')) grouped.set('installed', []);
        grouped.get('installed')!.push(w);
      } else {
        const platforms = w.platforms || [];
        for (const p of platforms) {
          if (!grouped.has(p)) grouped.set(p, []);
          grouped.get(p)!.push(w);
        }
        if (platforms.length === 0) {
          if (!grouped.has('other')) grouped.set('other', []);
          grouped.get('other')!.push(w);
        }
      }
    }

    const order = ['recommended', 'installed', 'extension', 'mobile', 'desktop', 'hardware', 'other'];

    return html`
      <div class="list">
        ${order.map(key => {
          const items = grouped.get(key);
          if (!items || items.length === 0) return nothing;
          const label = key === 'recommended'
            ? `⭐ ${t('recommended')}`
            : key === 'installed'
              ? `✓ ${t('installed')}`
              : PLATFORM_LABELS[key as keyof typeof PLATFORM_LABELS] || key;
          const icon = PLATFORM_ICONS[key as WalletPlatform];
          return html`
            <div class="section-label">
              ${icon ? html`<span>${icon}</span>` : nothing}
              ${label}
            </div>
            ${items.map(w => this._renderCard(w))}
          `;
        })}
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
