/**
 * ChainSwitcher Web Component (i18n-enabled)
 *
 * Dropdown for switching between blockchain networks.
 *
 * Properties:
 *   - chains: ChainInfo[]
 *   - activeChainId: currently selected chain ID
 *
 * Events:
 *   - ocx-chain-change: fired when a chain is selected (detail: chainId)
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { t, isRTL } from '../i18n/index.js';
let ChainSwitcher = (() => {
    let _classDecorators = [customElement('ocx-chain-switcher')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseLitElement;
    let _chains_decorators;
    let _chains_initializers = [];
    let _chains_extraInitializers = [];
    let _activeChainId_decorators;
    let _activeChainId_initializers = [];
    let _activeChainId_extraInitializers = [];
    let __open_decorators;
    let __open_initializers = [];
    let __open_extraInitializers = [];
    var ChainSwitcher = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            this.chains = __runInitializers(this, _chains_initializers, []);
            this.activeChainId = (__runInitializers(this, _chains_extraInitializers), __runInitializers(this, _activeChainId_initializers, 1));
            this._open = (__runInitializers(this, _activeChainId_extraInitializers), __runInitializers(this, __open_initializers, false));
            this._onOutsideClick = (__runInitializers(this, __open_extraInitializers), (e) => {
                if (this._open && !this.contains(e.target)) {
                    this._open = false;
                }
            });
        }
        static get styles() {
            return [
                super.hostStyles,
                css `
        :host {
          display: inline-block;
          position: relative;
        }

        .trigger {
          display: inline-flex;
          align-items: center;
          gap: var(--ocx-space-2, 0.5rem);
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          cursor: pointer;
          color: var(--ocx-color-text-primary, #f8fafc);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          transition: border-color var(--ocx-duration-fast, 150ms) ease;
        }
        .trigger:hover {
          border-color: var(--ocx-color-border-hover, #4B5563);
        }
        .trigger:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }

        .chain-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .chain-icon img {
          width: 16px;
          height: 16px;
        }

        .arrow {
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid var(--ocx-color-text-secondary, #94A3B8);
          transition: transform var(--ocx-duration-fast, 150ms) ease;
        }
        .arrow.open {
          transform: rotate(180deg);
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 220px;
          background: var(--ocx-color-bg-secondary, #111827);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          box-shadow: var(--ocx-shadow-lg, 0 10px 15px rgba(0,0,0,0.3));
          z-index: var(--ocx-z-dropdown, 1000);
          max-height: 300px;
          overflow-y: auto;
        }

        :host([dir="rtl"]) .dropdown {
          left: auto;
          right: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-2, 0.5rem);
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          cursor: pointer;
          transition: background-color var(--ocx-duration-fast, 150ms) ease;
          color: var(--ocx-color-text-primary, #f8fafc);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }
        .dropdown-item:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
        }
        .dropdown-item.active {
          color: var(--ocx-color-accent-500, #3B82F6);
        }
        .dropdown-item:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: -2px;
        }

        .check {
          width: 16px;
          color: var(--ocx-color-accent-500, #3B82F6);
          flex-shrink: 0;
        }

        .testnet-badge {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          padding: 1px 6px;
          background: var(--ocx-color-warning-bg, rgba(234,179,8,0.15));
          color: var(--ocx-color-warning, #EAB308);
          border-radius: var(--ocx-radius-sm, 0.25rem);
          margin-left: auto;
        }
      `,
            ];
        }
        connectedCallback() {
            super.connectedCallback();
            document.addEventListener('click', this._onOutsideClick);
            if (isRTL())
                this.setAttribute('dir', 'rtl');
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            document.removeEventListener('click', this._onOutsideClick);
        }
        _toggle() {
            this._open = !this._open;
        }
        _select(chain) {
            this._open = false;
            if (chain.id !== this.activeChainId) {
                this.dispatchEvent(new CustomEvent('ocx-chain-change', {
                    bubbles: true,
                    composed: true,
                    detail: { chainId: chain.id },
                }));
            }
        }
        render() {
            const active = this.chains.find(c => c.id === this.activeChainId);
            return html `
      <button class="trigger"
              @click=${this._toggle}
              aria-haspopup="listbox"
              aria-expanded=${this._open}
              aria-label="${t('switch_network')}">
        ${this._renderChainIcon(active)}
        <span>${active ? active.name : t('select_network')}</span>
        <span class="arrow ${this._open ? 'open' : ''}"></span>
      </button>

      ${this._open ? html `
        <div class="dropdown" role="listbox" aria-label="${t('select_network')}">
          ${this.chains.map(chain => html `
            <div class="dropdown-item ${chain.id === this.activeChainId ? 'active' : ''}"
                 role="option"
                 aria-selected=${chain.id === this.activeChainId}
                 tabindex="0"
                 @click=${() => this._select(chain)}
                 @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ')
                this._select(chain); }}>
              ${chain.id === this.activeChainId ? html `<span class="check">✓</span>` : html `<span class="check"></span>`}
              ${this._renderChainIcon(chain)}
              <span>${chain.name}</span>
              ${chain.testnet ? html `<span class="testnet-badge">${t('testnet')}</span>` : nothing}
            </div>
          `)}
        </div>
      ` : nothing}
    `;
        }
        _renderChainIcon(chain) {
            if (!chain)
                return nothing;
            return html `
      <span class="chain-icon">
        ${chain.iconUrl
                ? html `<img src="${chain.iconUrl}" alt="" />`
                : html `<span style="font-size:12px;">⛓</span>`}
      </span>
    `;
        }
    };
    __setFunctionName(_classThis, "ChainSwitcher");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _chains_decorators = [property({ type: Array })];
        _activeChainId_decorators = [property({ type: Number, attribute: 'active-chain-id' })];
        __open_decorators = [state()];
        __esDecorate(null, null, _chains_decorators, { kind: "field", name: "chains", static: false, private: false, access: { has: obj => "chains" in obj, get: obj => obj.chains, set: (obj, value) => { obj.chains = value; } }, metadata: _metadata }, _chains_initializers, _chains_extraInitializers);
        __esDecorate(null, null, _activeChainId_decorators, { kind: "field", name: "activeChainId", static: false, private: false, access: { has: obj => "activeChainId" in obj, get: obj => obj.activeChainId, set: (obj, value) => { obj.activeChainId = value; } }, metadata: _metadata }, _activeChainId_initializers, _activeChainId_extraInitializers);
        __esDecorate(null, null, __open_decorators, { kind: "field", name: "_open", static: false, private: false, access: { has: obj => "_open" in obj, get: obj => obj._open, set: (obj, value) => { obj._open = value; } }, metadata: _metadata }, __open_initializers, __open_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChainSwitcher = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChainSwitcher = _classThis;
})();
export { ChainSwitcher };
//# sourceMappingURL=chain-switcher.js.map