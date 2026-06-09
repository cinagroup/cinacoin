/**
 * ConnectModal Web Component (i18n-enabled)
 *
 * Modal dialog for wallet connection. Supports wallet list, social login,
 * email login, and QR scan views. Enhanced with chain selector and
 * "All Wallets" expandable list.
 *
 * Attributes:
 *   - is-open: whether the modal is visible
 *   - default-view: 'wallets' | 'social' | 'email' | 'scan' | 'chains'
 *
 * Properties:
 *   - wallets: WalletInfo[]
 *   - recommendedWalletIds: string[]
 *   - chains: ChainInfo[] — available chains for selector view
 *   - activeChainId: currently selected chain ID
 *
 * Events:
 *   - ocx-close: fired when modal is closed
 *   - ocx-wallet-select: fired when a wallet is selected (detail: WalletInfo)
 *   - ocx-chain-change: fired when a chain is selected (detail: chainId)
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { animate } from '../foundation/animation-engine.js';
import { t, isRTL } from '../i18n/index.js';

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

export type WalletPlatform = 'extension' | 'mobile' | 'desktop' | 'hardware';

export type ConnectModalView = 'wallets' | 'social' | 'email' | 'scan' | 'chains';

export interface ChainInfo {
  id: string | number;
  name: string;
  symbol?: string;
  iconUrl?: string;
  testnet?: boolean;
}

const PLATFORM_ICONS: Record<string, string> = {
  extension: '🧩',
  mobile: '📱',
  desktop: '🖥',
  hardware: '🔐',
  unknown: '🔗',
};

@customElement('ocx-connect-modal')
export class ConnectModal extends BaseLitElement {
  static override get styles() {
    return [
      super.hostStyles,
      css`
        :host {
          display: none;
        }
        :host([is-open]) {
          display: block;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: var(--ocx-color-bg-overlay, rgba(0,0,0,0.7));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--ocx-z-modal-backdrop, 2000);
        }

        .modal {
          background: var(--ocx-color-bg-primary, #0F172A);
          border-radius: var(--ocx-radius-xl, 1.5rem);
          box-shadow: var(--ocx-shadow-lg, 0 10px 15px rgba(0,0,0,0.3));
          width: 100%;
          max-width: 420px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          z-index: var(--ocx-z-modal, 2100);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--ocx-space-6, 1.5rem);
          border-bottom: 1px solid var(--ocx-color-border, #334155);
        }

        .header h2 {
          margin: 0;
          font-size: var(--ocx-font-size-xl, 1.25rem);
          font-weight: var(--ocx-font-weight-semibold, 600);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--ocx-color-text-secondary, #94A3B8);
          cursor: pointer;
          font-size: var(--ocx-font-size-lg, 1.125rem);
          padding: var(--ocx-space-2, 0.5rem);
          border-radius: var(--ocx-radius-md, 0.5rem);
          line-height: 1;
        }
        .close-btn:hover {
          background: var(--ocx-color-bg-card, #1E293B);
          color: var(--ocx-color-text-primary, #f8fafc);
        }

        .content {
          padding: var(--ocx-space-6, 1.5rem);
        }

        .wallet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--ocx-space-3, 0.75rem);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-4, 1rem);
          margin: var(--ocx-space-4, 1rem) 0;
          color: var(--ocx-color-text-tertiary, #64748B);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--ocx-color-border, #334155);
        }

        .alt-actions {
          display: flex;
          flex-direction: column;
          gap: var(--ocx-space-3, 0.75rem);
        }

        .alt-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--ocx-space-2, 0.5rem);
          width: 100%;
          padding: var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          color: var(--ocx-color-text-primary, #f8fafc);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          cursor: pointer;
          transition: background-color var(--ocx-duration-fast, 150ms) ease;
        }
        .alt-btn:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
        }
        .alt-btn:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }

        .footer {
          padding: var(--ocx-space-4, 1rem) var(--ocx-space-6, 1.5rem);
          text-align: center;
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-tertiary, #64748B);
          border-top: 1px solid var(--ocx-color-border, #334155);
        }

        .view-tabs {
          display: flex;
          gap: var(--ocx-space-2, 0.5rem);
          margin-bottom: var(--ocx-space-4, 1rem);
        }

        .view-tab {
          flex: 1;
          padding: var(--ocx-space-2, 0.5rem);
          background: transparent;
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-md, 0.5rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
          font-size: var(--ocx-font-size-xs, 0.75rem);
          cursor: pointer;
          transition: all var(--ocx-duration-fast, 150ms) ease;
        }
        .view-tab:hover {
          color: var(--ocx-color-text-primary, #f8fafc);
        }
        .view-tab.active {
          background: var(--ocx-color-bg-card, #1E293B);
          color: var(--ocx-color-text-primary, #f8fafc);
          border-color: var(--ocx-color-accent-500, #3B82F6);
        }

        .install-link {
          color: var(--ocx-color-accent-500, #3B82F6);
          text-decoration: none;
          font-size: var(--ocx-font-size-xs, 0.75rem);
        }
        .install-link:hover {
          text-decoration: underline;
        }

        /* Wallet search */
        .search-row {
          margin-bottom: var(--ocx-space-3, 0.75rem);
          position: relative;
        }
        .wallet-search {
          width: 100%;
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem)
                    var(--ocx-space-2, 0.5rem) var(--ocx-space-8, 2rem);
          background: var(--ocx-color-bg-input, #111827);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          color: var(--ocx-color-text-primary, #f8fafc);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          outline: none;
          transition: border-color var(--ocx-duration-fast, 150ms) ease;
        }
        .wallet-search:focus {
          border-color: var(--ocx-color-accent-500, #3B82F6);
        }
        .wallet-search::placeholder {
          color: var(--ocx-color-text-tertiary, #64748B);
        }
        .search-icon-row {
          position: absolute;
          left: var(--ocx-space-3, 0.75rem);
          top: 50%;
          transform: translateY(-50%);
          color: var(--ocx-color-text-tertiary, #64748B);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          pointer-events: none;
        }

        /* Platform sections */
        .platform-section {
          margin-bottom: var(--ocx-space-4, 1rem);
        }
        .platform-header {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-2, 0.5rem);
          font-size: var(--ocx-font-size-xs, 0.75rem);
          font-weight: var(--ocx-font-weight-semibold, 600);
          color: var(--ocx-color-text-tertiary, #64748B);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--ocx-space-2, 0.5rem);
        }

        /* All wallets toggle */
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

        /* Chain selector integration */
        .chain-bar {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-3, 0.75rem);
          margin-bottom: var(--ocx-space-4, 1rem);
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          cursor: pointer;
          transition: border-color var(--ocx-duration-fast, 150ms) ease;
        }
        .chain-bar:hover {
          border-color: var(--ocx-color-accent-500, #3B82F6);
        }
        .chain-bar-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .chain-bar-icon img {
          width: 16px;
          height: 16px;
        }
        .chain-bar-name {
          font-size: var(--ocx-font-size-sm, 0.875rem);
          font-weight: var(--ocx-font-weight-medium, 500);
        }
        .chain-bar-arrow {
          margin-left: auto;
          color: var(--ocx-color-text-tertiary, #64748B);
        }
      `,
    ];
  }

  @property({ type: Boolean, attribute: 'is-open', reflect: true }) isOpen = false;
  @property({ attribute: 'default-view' }) defaultView: ConnectModalView = 'wallets';
  @property({ type: Array }) wallets: WalletInfo[] = [];
  @property({ attribute: false }) recommendedWalletIds: string[] = [];
  @property({ type: Array }) chains: ChainInfo[] = [];
  @property({ type: String }) activeChainId: string = '';

  @state() private _currentView: ConnectModalView = 'wallets';
  @state() private _showAllWallets = false;
  @state() private _walletSearchQuery = '';

  override connectedCallback() {
    super.connectedCallback();
    this._currentView = this.defaultView;
    document.addEventListener('keydown', this._onKeydown);
    if (isRTL()) this.setAttribute('dir', 'rtl');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeydown);
  }

  private _onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isOpen) {
      this._close();
    }
  };

  private _close() {
    this.isOpen = false;
    this.dispatchEvent(new CustomEvent('ocx-close', { bubbles: true, composed: true }));
  }

  private _selectWallet(wallet: WalletInfo) {
    this.dispatchEvent(
      new CustomEvent('ocx-wallet-select', {
        bubbles: true,
        composed: true,
        detail: wallet,
      })
    );
  }

  private _onWalletSearch(e: Event) {
    this._walletSearchQuery = (e.target as HTMLInputElement).value.toLowerCase();
  }

  private _toggleAllWallets() {
    this._showAllWallets = !this._showAllWallets;
  }

  private _filterWallets(wallets: WalletInfo[]): WalletInfo[] {
    if (!this._walletSearchQuery) return wallets;
    return wallets.filter(w =>
      w.name.toLowerCase().includes(this._walletSearchQuery)
    );
  }

  private _groupByPlatform(wallets: WalletInfo[]): Map<WalletPlatform | 'unknown', WalletInfo[]> {
    const groups = new Map<WalletPlatform | 'unknown', WalletInfo[]>();
    for (const w of wallets) {
      const platforms = w.platforms || ['unknown'];
      for (const p of platforms as (WalletPlatform | 'unknown')[]) {
        if (!groups.has(p)) groups.set(p, []);
        groups.get(p)!.push(w);
      }
    }
    return groups;
  }

  private _getActiveChainName(): string {
    if (!this.activeChainId) return t('all_networks');
    const chain = this.chains.find(c => String(c.id) === String(this.activeChainId));
    return chain ? chain.name : t('select_network');
  }

  private _getActiveChainIcon(): string | undefined {
    if (!this.activeChainId) return undefined;
    const chain = this.chains.find(c => String(c.id) === String(this.activeChainId));
    return chain?.iconUrl;
  }

  private _onChainSelect() {
    this._currentView = 'chains';
  }

  private _onChainChange(e: CustomEvent) {
    const chainId = e.detail?.chainId;
    if (chainId !== undefined) {
      this.dispatchEvent(
        new CustomEvent('ocx-chain-change', {
          bubbles: true,
          composed: true,
          detail: { chainId },
        })
      );
      this._currentView = 'wallets';
    }
  }

  override render() {
    if (!this.isOpen) return nothing;

    return html`
      <div class="overlay" @click=${this._onOverlayClick} role="dialog" aria-modal="true" aria-label="${t('connect_wallet')}">
        <div class="modal">
          <div class="header">
            <h2>${this._currentView === 'chains' ? t('select_network') : t('connect_your_wallet')}</h2>
            <button class="close-btn" @click=${this._close} aria-label="${t('close')}">✕</button>
          </div>

          <div class="content">
            ${this._currentView !== 'chains' ? html`
              <div class="view-tabs">
                <button class="view-tab ${this._currentView === 'wallets' ? 'active' : ''}"
                        @click=${() => { this._currentView = 'wallets'; this._showAllWallets = false; }}>
                  ${t('wallet')}
                </button>
                <button class="view-tab ${this._currentView === 'social' ? 'active' : ''}"
                        @click=${() => { this._currentView = 'social'; }}>
                  ${t('social')}
                </button>
                <button class="view-tab ${this._currentView === 'email' ? 'active' : ''}"
                        @click=${() => { this._currentView = 'email'; }}>
                  ${t('email')}
                </button>
                <button class="view-tab ${this._currentView === 'scan' ? 'active' : ''}"
                        @click=${() => { this._currentView = 'scan'; }}>
                  ${t('scan')}
                </button>
              </div>
            ` : nothing}

            ${this._renderCurrentView()}

            ${this._currentView === 'wallets' ? html`
              <div class="divider">${t('or')}</div>
              <div class="alt-actions">
                <button class="alt-btn" @click=${() => { this._currentView = 'email'; }}>
                  📧 ${t('login_with_email')}
                </button>
                <button class="alt-btn" @click=${() => { this._currentView = 'social'; }}>
                  🔑 ${t('social_login')}
                </button>
                <button class="alt-btn" @click=${() => { this._currentView = 'scan'; }}>
                  📱 ${t('scan_qr')}
                </button>
                ${this.chains.length > 0 ? html`
                  <button class="alt-btn" @click=${() => { this._currentView = 'chains'; }}>
                    🌐 ${t('select_network')}
                  </button>
                ` : nothing}
              </div>
            ` : nothing}
          </div>

          <div class="footer">
            ${t('powered_by', { brand: 'Cinacoin' })}
          </div>
        </div>
      </div>
    `;
  }

  private _onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this._close();
    }
  }

  private _renderCurrentView() {
    switch (this._currentView) {
      case 'wallets':
        return this._renderWalletsView();
      case 'social':
        return html`
          <div class="alt-actions">
            <button class="alt-btn" @click=${() => this._selectWallet({ id: 'google', name: 'Google', icon: '' })}>
              ${t('continue_with_google')}
            </button>
            <button class="alt-btn" @click=${() => this._selectWallet({ id: 'apple', name: 'Apple', icon: '' })}>
              ${t('continue_with_apple')}
            </button>
            <button class="alt-btn" @click=${() => this._selectWallet({ id: 'twitter', name: 'X / Twitter', icon: '' })}>
              ${t('continue_with_x')}
            </button>
          </div>
        `;
      case 'email':
        return html`
          <div class="alt-actions">
            <input
              type="email"
              placeholder="${t('enter_email')}"
              style="width:100%;padding:var(--ocx-space-3, 0.75rem);background:var(--ocx-color-bg-input,#111827);border:1px solid var(--ocx-color-border,#334155);border-radius:var(--ocx-radius-lg,0.75rem);color:var(--ocx-color-text-primary,#f8fafc);font-size:var(--ocx-font-size-sm,0.875rem);"
            />
            <button class="alt-btn" @click=${() => this._selectWallet({ id: 'email', name: 'Email Wallet', icon: '' })}>
              ${t('continue_with_email')}
            </button>
          </div>
        `;
      case 'scan':
        return html`
          <ocx-qr-code
            value="wc:sample-walletconnect-uri-for-demo"
            size="200"
            show-copy
          ></ocx-qr-code>
        `;
      case 'chains':
        return html`
          <ocx-chain-selector
            .chains=${this.chains}
            .activeChainId=${this.activeChainId}
            @ocx-chain-select=${this._onChainChange}
          ></ocx-chain-selector>
        `;
      default:
        return nothing;
    }
  }

  private _renderWalletsView(): ReturnType<typeof html> {
    const filtered = this._filterWallets(this.wallets);
    const visible = this._showAllWallets
      ? filtered
      : filtered.slice(0, 6);
    const remainingCount = filtered.length - 6;

    // Check if wallets have platform data
    const hasPlatforms = this.wallets.some(w => w.platforms && w.platforms.length > 0);

    if (hasPlatforms) {
      return this._renderPlatformGroupedView(visible, filtered.length);
    }

    return html`
      ${this._renderSearchRow()}

      <!-- Chain selector bar -->
      ${this.chains.length > 0 ? html`
        <div class="chain-bar" @click=${this._onChainSelect}>
          <div class="chain-bar-icon">
            ${this._getActiveChainIcon()
              ? html`<img src="${this._getActiveChainIcon()}" alt="" />`
              : html`<span style="font-size:12px;">🌐</span>`
            }
          </div>
          <span class="chain-bar-name">${this._getActiveChainName()}</span>
          <span class="chain-bar-arrow">›</span>
        </div>
      ` : nothing}

      <div class="wallet-grid">
        ${visible.map(w => this._renderWalletCard(w))}
      </div>

      ${!this._showAllWallets && remainingCount > 0 ? html`
        <button class="show-all-btn" @click=${this._toggleAllWallets}>
          ${t('filters')} (${remainingCount}+ ${t('wallet').toLowerCase()})
        </button>
      ` : nothing}
    `;
  }

  private _renderPlatformGroupedView(visible: WalletInfo[], totalCount: number): ReturnType<typeof html> {
    const groups = this._groupByPlatform(visible);
    const platformOrder: (WalletPlatform | 'unknown')[] = ['extension', 'mobile', 'desktop', 'hardware', 'unknown'];

    return html`
      ${this._renderSearchRow()}

      ${platformOrder.map(platform => {
        const wallets = groups.get(platform);
        if (!wallets || wallets.length === 0) return nothing;
        return html`
          <div class="platform-section">
            <div class="platform-header">
              <span>${PLATFORM_ICONS[platform]}</span>
              <span>${platform === 'unknown' ? t('wallet') : platform}</span>
            </div>
            <div class="wallet-grid">
              ${wallets.map(w => this._renderWalletCard(w))}
            </div>
          </div>
        `;
      })}

      ${!this._showAllWallets && totalCount > 6 ? html`
        <button class="show-all-btn" @click=${this._toggleAllWallets}>
          ${t('wallet')} (${totalCount}+ ${t('wallet').toLowerCase()})
        </button>
      ` : nothing}
    `;
  }

  private _renderSearchRow(): ReturnType<typeof html> {
    return html`
      <div class="search-row">
        <span class="search-icon-row">🔍</span>
        <input
          class="wallet-search"
          type="text"
          placeholder="${t('search_wallets')}"
          @input=${this._onWalletSearch}
          aria-label="${t('search_wallets')}"
        />
      </div>
    `;
  }

  private _renderWalletCard(wallet: WalletInfo) {
    const isRecommended = this.recommendedWalletIds.includes(wallet.id);
    return html`
      <button class="alt-btn" style="flex-direction:column;gap:var(--ocx-space-2,0.5rem);padding:var(--ocx-space-4,1rem);"
              @click=${() => this._selectWallet(wallet)}>
        <div style="width:40px;height:40px;border-radius:var(--ocx-radius-md,0.5rem);background:${wallet.iconBackground || 'var(--ocx-color-bg-tertiary)'};display:flex;align-items:center;justify-content:center;">
          ${wallet.icon ? html`<img src="${wallet.icon}" alt="${wallet.name}" style="width:24px;height:24px;" />` : '🔗'}
        </div>
        <span>${wallet.name}</span>
        ${isRecommended ? html`<span style="font-size:var(--ocx-font-size-xs,0.75rem);color:var(--ocx-color-accent-500,#3B82F6);">${t('recommended')}</span>` : nothing}
        ${wallet.platforms && wallet.platforms.length > 0 ? html`
          <span style="font-size:var(--ocx-font-size-xs,0.75rem);color:var(--ocx-color-text-tertiary,#64748B);">
            ${wallet.platforms.map(p => PLATFORM_ICONS[p] || '🔗').join(' ')}
          </span>
        ` : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ocx-connect-modal': ConnectModal;
  }
}
