/**
 * ChainSelector Web Component
 *
 * Displays a searchable list of available blockchain networks for selection.
 * Integrates with the core-sdk ChainInfo type. Supports search/filtering,
 * chain icons, active chain highlighting, and a custom chain mode.
 *
 * Properties:
 *   - chains: ChainInfo[] — list of available chains
 *   - activeChainId: number — currently selected chain ID
 *   - showAddCustom: boolean — show "Add Custom Chain" button (default: true)
 *   - searchPlaceholder: string — search input placeholder
 *
 * Events:
 *   - ocx-chain-select — fired when a chain is selected (detail: chainId)
 *   - ocx-chain-custom — fired when "Add Custom Chain" is clicked (detail: null)
 *   - ocx-search-input — fires on search input (detail: query string)
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { t, isRTL } from '../i18n/index.js';

export interface ChainSelectorInfo {
  id: string | number;
  name: string;
  symbol?: string;
  iconUrl?: string;
  testnet?: boolean;
  chainId?: number;
  rpcUrl?: string;
  blockExplorerUrl?: string;
}

@customElement('ocx-chain-selector')
export class ChainSelector extends BaseLitElement {
  static override get styles() {
    return [
      super.hostStyles,
      css`
        :host {
          display: block;
        }

        .container {
          padding: var(--ocx-space-2, 0.5rem);
        }

        .search-wrapper {
          position: relative;
          margin-bottom: var(--ocx-space-3, 0.75rem);
        }

        .search-input {
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
        .search-input:focus {
          border-color: var(--ocx-color-accent-500, #3B82F6);
        }
        .search-input::placeholder {
          color: var(--ocx-color-text-tertiary, #64748B);
        }

        .search-icon {
          position: absolute;
          left: var(--ocx-space-3, 0.75rem);
          top: 50%;
          transform: translateY(-50%);
          color: var(--ocx-color-text-tertiary, #64748B);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          pointer-events: none;
        }

        :host([dir="rtl"]) .search-icon {
          left: auto;
          right: var(--ocx-space-3, 0.75rem);
        }
        :host([dir="rtl"]) .search-input {
          padding-left: var(--ocx-space-3, 0.75rem);
          padding-right: var(--ocx-space-8, 2rem);
        }

        .chain-list {
          display: flex;
          flex-direction: column;
          gap: var(--ocx-space-1, 0.25rem);
          max-height: 280px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--ocx-color-border, #334155) transparent;
        }

        .chain-item {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-3, 0.75rem);
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          border-radius: var(--ocx-radius-md, 0.5rem);
          cursor: pointer;
          transition: background-color var(--ocx-duration-fast, 150ms) ease;
          color: var(--ocx-color-text-primary, #f8fafc);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }
        .chain-item:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
        }
        .chain-item.active {
          background: var(--ocx-color-accent-500, rgba(59,130,246,0.15));
          color: var(--ocx-color-accent-500, #3B82F6);
        }
        .chain-item:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }

        .chain-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--ocx-color-bg-card, #1E293B);
          overflow: hidden;
        }
        .chain-icon img {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .chain-info {
          flex: 1;
          min-width: 0;
        }
        .chain-name {
          font-weight: var(--ocx-font-weight-medium, 500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chain-symbol {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-tertiary, #64748B);
        }
        .chain-item.active .chain-symbol {
          color: var(--ocx-color-accent-500, #3B82F6);
          opacity: 0.7;
        }

        .chain-check {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--ocx-color-accent-500, #3B82F6);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }

        .testnet-badge {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          padding: 1px 6px;
          background: var(--ocx-color-warning-bg, rgba(234,179,8,0.15));
          color: var(--ocx-color-warning, #EAB308);
          border-radius: var(--ocx-radius-sm, 0.25rem);
          margin-left: auto;
        }
        :host([dir="rtl"]) .testnet-badge {
          margin-left: 0;
          margin-right: auto;
        }

        .no-results {
          text-align: center;
          padding: var(--ocx-space-6, 1.5rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }

        .add-custom-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--ocx-space-2, 0.5rem);
          width: 100%;
          padding: var(--ocx-space-3, 0.75rem);
          margin-top: var(--ocx-space-3, 0.75rem);
          background: transparent;
          border: 1px dashed var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          cursor: pointer;
          transition: all var(--ocx-duration-fast, 150ms) ease;
        }
        .add-custom-btn:hover {
          border-color: var(--ocx-color-accent-500, #3B82F6);
          color: var(--ocx-color-accent-500, #3B82F6);
          background: var(--ocx-color-accent-500, rgba(59,130,246,0.05));
        }
        .add-custom-btn:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }
      `,
    ];
  }

  @property({ type: Array }) chains: ChainSelectorInfo[] = [];
  @property({ type: String }) activeChainId: string | number = '';
  @property({ type: Boolean, attribute: 'show-add-custom' }) showAddCustom: boolean = true;
  @property({ type: String, attribute: 'search-placeholder' }) searchPlaceholder: string = '';

  @state() private _query = '';

  override connectedCallback() {
    super.connectedCallback();
    if (isRTL()) this.setAttribute('dir', 'rtl');
  }

  private _onSearch(e: Event) {
    this._query = (e.target as HTMLInputElement).value.toLowerCase();
    this.dispatchEvent(
      new CustomEvent('ocx-search-input', {
        bubbles: true,
        composed: true,
        detail: { query: this._query },
      })
    );
  }

  private _selectChain(chain: ChainSelectorInfo) {
    this.dispatchEvent(
      new CustomEvent('ocx-chain-select', {
        bubbles: true,
        composed: true,
        detail: { chainId: chain.id },
      })
    );
  }

  private _addCustom() {
    this.dispatchEvent(
      new CustomEvent('ocx-chain-custom', {
        bubbles: true,
        composed: true,
        detail: null,
      })
    );
  }

  private _matchesQuery(chain: ChainSelectorInfo): boolean {
    if (!this._query) return true;
    return (
      chain.name.toLowerCase().includes(this._query) ||
      (chain.symbol && chain.symbol.toLowerCase().includes(this._query)) ||
      String(chain.id).toLowerCase().includes(this._query)
    );
  }

  override render() {
    const filtered = this.chains.filter(c => this._matchesQuery(c));
    const placeholder = this.searchPlaceholder || t('search');

    return html`
      <div class="container">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input
            class="search-input"
            type="text"
            placeholder="${placeholder}"
            .value="${this._query}"
            @input=${this._onSearch}
            aria-label="${placeholder}"
          />
        </div>

        ${filtered.length === 0
          ? html`
              <div class="no-results">
                ${t('no_results')}
              </div>
            `
          : html`
              <div class="chain-list">
                ${filtered.map(chain => html`
                  <div
                    class="chain-item ${chain.id === this.activeChainId ? 'active' : ''}"
                    tabindex="0"
                    role="option"
                    aria-selected=${chain.id === this.activeChainId}
                    @click=${() => this._selectChain(chain)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this._selectChain(chain);
                      }
                    }}
                  >
                    <div class="chain-icon">
                      ${chain.iconUrl
                        ? html`<img src="${chain.iconUrl}" alt="" />`
                        : html`<span style="font-size:14px;">⛓</span>`
                      }
                    </div>
                    <div class="chain-info">
                      <div class="chain-name">${chain.name}</div>
                      ${chain.symbol
                        ? html`<div class="chain-symbol">${chain.symbol}</div>`
                        : nothing
                      }
                    </div>
                    ${chain.testnet
                      ? html`<span class="testnet-badge">${t('testnet')}</span>`
                      : nothing
                    }
                    ${chain.id === this.activeChainId
                      ? html`<span class="chain-check">✓</span>`
                      : nothing
                    }
                  </div>
                `)}
              </div>
            `
        }

        ${this.showAddCustom
          ? html`
              <button class="add-custom-btn" @click=${this._addCustom}>
                ＋ ${t('select_network')}
              </button>
            `
          : nothing
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ocx-chain-selector': ChainSelector;
  }
}
