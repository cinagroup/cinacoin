/**
 * ConnectButton Web Component (i18n-enabled)
 *
 * Primary entry-point button for wallet connection. Shows connect prompt when
 * disconnected, and address + balance when connected.
 *
 * Attributes:
 *   - variant: 'primary' | 'secondary' | 'ghost'
 *   - size: 'sm' | 'md' | 'lg'
 *   - label: text shown when disconnected (falls back to t('connect_wallet'))
 *   - show-balance: whether to display balance
 *   - show-avatar: whether to show avatar icon
 *   - show-network: whether to show network badge
 *
 * Properties (set via JS):
 *   - address: connected wallet address
 *   - balance: account balance string
 *   - chainSymbol: native currency symbol (e.g. "ETH")
 *   - state: 'disconnected' | 'connecting' | 'connected' | 'wrong_network' | 'error'
 *
 * Events:
 *   - ocx-click: fired when button is clicked
 *   - ocx-disconnect: fired when disconnect action is triggered
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
import { t, isRTL, I18nMixin } from '../i18n/index.js';
let ConnectButton = (() => {
    let _classDecorators = [customElement('ocx-connect-button')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = I18nMixin(BaseLitElement);
    let _variant_decorators;
    let _variant_initializers = [];
    let _variant_extraInitializers = [];
    let _size_decorators;
    let _size_initializers = [];
    let _size_extraInitializers = [];
    let _label_decorators;
    let _label_initializers = [];
    let _label_extraInitializers = [];
    let _showBalance_decorators;
    let _showBalance_initializers = [];
    let _showBalance_extraInitializers = [];
    let _showAvatar_decorators;
    let _showAvatar_initializers = [];
    let _showAvatar_extraInitializers = [];
    let _showNetwork_decorators;
    let _showNetwork_initializers = [];
    let _showNetwork_extraInitializers = [];
    let _address_decorators;
    let _address_initializers = [];
    let _address_extraInitializers = [];
    let _balance_decorators;
    let _balance_initializers = [];
    let _balance_extraInitializers = [];
    let _chainSymbol_decorators;
    let _chainSymbol_initializers = [];
    let _chainSymbol_extraInitializers = [];
    let _state_decorators;
    let _state_initializers = [];
    let _state_extraInitializers = [];
    let _chainId_decorators;
    let _chainId_initializers = [];
    let _chainId_extraInitializers = [];
    let __menuOpen_decorators;
    let __menuOpen_initializers = [];
    let __menuOpen_extraInitializers = [];
    var ConnectButton = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            this.variant = __runInitializers(this, _variant_initializers, 'primary');
            this.size = (__runInitializers(this, _variant_extraInitializers), __runInitializers(this, _size_initializers, 'md'));
            this.label = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _label_initializers, ''));
            this.showBalance = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _showBalance_initializers, false));
            this.showAvatar = (__runInitializers(this, _showBalance_extraInitializers), __runInitializers(this, _showAvatar_initializers, false));
            this.showNetwork = (__runInitializers(this, _showAvatar_extraInitializers), __runInitializers(this, _showNetwork_initializers, false));
            this.address = (__runInitializers(this, _showNetwork_extraInitializers), __runInitializers(this, _address_initializers, ''));
            this.balance = (__runInitializers(this, _address_extraInitializers), __runInitializers(this, _balance_initializers, ''));
            this.chainSymbol = (__runInitializers(this, _balance_extraInitializers), __runInitializers(this, _chainSymbol_initializers, ''));
            this.state = (__runInitializers(this, _chainSymbol_extraInitializers), __runInitializers(this, _state_initializers, 'disconnected'));
            this.chainId = (__runInitializers(this, _state_extraInitializers), __runInitializers(this, _chainId_initializers, null));
            this._menuOpen = (__runInitializers(this, _chainId_extraInitializers), __runInitializers(this, __menuOpen_initializers, false));
            this._onClick = (__runInitializers(this, __menuOpen_extraInitializers), () => {
                if (this.state === 'connecting')
                    return;
                if (this.state === 'connected') {
                    this._menuOpen = !this._menuOpen;
                    return;
                }
                this.dispatchEvent(new CustomEvent('ocx-click', { bubbles: true, composed: true }));
            });
            this._onKeydown = (e) => {
                if (e.key === 'Escape' && this._menuOpen) {
                    this._menuOpen = false;
                }
            };
        }
        static get styles() {
            return [
                super.hostStyles,
                css `
        :host {
          display: inline-block;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--ocx-space-2, 0.5rem);
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-weight: var(--ocx-font-weight-semibold, 600);
          border-radius: var(--ocx-radius-xl, 1.5rem);
          transition: background-color var(--ocx-duration-fast, 150ms) var(--ocx-easing-default, ease),
                      box-shadow var(--ocx-duration-fast, 150ms) var(--ocx-easing-default, ease);
          white-space: nowrap;
          user-select: none;
        }

        .btn:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }

        /* Variant: primary */
        .btn.variant-primary {
          background: var(--ocx-color-accent-500, #3B82F6);
          color: var(--ocx-color-text-inverse, #fff);
          box-shadow: var(--ocx-shadow-glow, 0 0 20px rgba(59, 130, 246, 0.3));
        }
        .btn.variant-primary:hover {
          background: var(--ocx-color-accent-600, #2563EB);
        }

        /* Variant: secondary */
        .btn.variant-secondary {
          background: var(--ocx-color-bg-card, #1E293B);
          color: var(--ocx-color-text-primary, #f8fafc);
          border: 1px solid var(--ocx-color-border, #334155);
        }
        .btn.variant-secondary:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
        }

        /* Variant: ghost */
        .btn.variant-ghost {
          background: transparent;
          color: var(--ocx-color-text-primary, #f8fafc);
        }
        .btn.variant-ghost:hover {
          background: var(--ocx-color-bg-card, #1E293B);
        }

        /* Size: sm */
        .btn.size-sm {
          height: 36px;
          padding: 0 var(--ocx-space-4, 1rem);
          font-size: var(--ocx-font-size-xs, 0.75rem);
        }

        /* Size: md */
        .btn.size-md {
          height: 44px;
          padding: 0 var(--ocx-space-6, 1.5rem);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }

        /* Size: lg */
        .btn.size-lg {
          height: 52px;
          padding: 0 var(--ocx-space-8, 2rem);
          font-size: var(--ocx-font-size-md, 1rem);
        }

        /* Connected state */
        .btn.state-connected {
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          color: var(--ocx-color-text-primary, #f8fafc);
        }

        /* Wrong network */
        .btn.state-wrong_network {
          background: var(--ocx-color-error-bg, rgba(239,68,68,0.15));
          color: var(--ocx-color-error, #EF4444);
          border: 1px solid var(--ocx-color-error, #EF4444);
        }

        /* Error */
        .btn.state-error {
          background: var(--ocx-color-error-bg, rgba(239,68,68,0.15));
          color: var(--ocx-color-error, #EF4444);
        }

        /* Disabled / connecting */
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .avatar {
          width: var(--ocx-font-size-md, 1rem);
          height: var(--ocx-font-size-md, 1rem);
          border-radius: 50%;
          background: var(--ocx-color-accent-500, #3B82F6);
        }

        .address {
          font-family: var(--ocx-font-family-mono, monospace);
          font-size: inherit;
        }

        .balance {
          color: var(--ocx-color-text-secondary, #94A3B8);
          font-size: 0.85em;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dropdown-arrow {
          display: inline-block;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid currentColor;
          margin-left: 2px;
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 180px;
          background: var(--ocx-color-bg-secondary, #111827);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          box-shadow: var(--ocx-shadow-lg, 0 10px 15px rgba(0,0,0,0.3));
          z-index: var(--ocx-z-dropdown, 1000);
          overflow: hidden;
        }

        :host([dir="rtl"]) .dropdown {
          right: auto;
          left: 0;
        }

        :host([dir="rtl"]) .dropdown-arrow {
          margin-left: 0;
          margin-right: 2px;
        }

        .dropdown button {
          display: block;
          width: 100%;
          padding: var(--ocx-space-3, 0.75rem) var(--ocx-space-4, 1rem);
          background: none;
          border: none;
          color: var(--ocx-color-error, #EF4444);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          cursor: pointer;
          text-align: inherit;
        }

        .dropdown button:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
        }
      `,
            ];
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('click', this._onClick);
            this.addEventListener('keydown', this._onKeydown);
            if (isRTL())
                this.setAttribute('dir', 'rtl');
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('click', this._onClick);
            this.removeEventListener('keydown', this._onKeydown);
        }
        _handleDisconnect(e) {
            e.stopPropagation();
            this._menuOpen = false;
            this.dispatchEvent(new CustomEvent('ocx-disconnect', { bubbles: true, composed: true }));
        }
        render() {
            const stateClass = `state-${this.state}`;
            const variantClass = `variant-${this.variant}`;
            const sizeClass = `size-${this.size}`;
            const disabled = this.state === 'connecting';
            return html `
      <button
        class="btn ${stateClass} ${variantClass} ${sizeClass}"
        ?disabled=${disabled}
        aria-label=${this._getAriaLabel()}
        aria-haspopup=${this.state === 'connected' ? 'true' : 'false'}
        aria-expanded=${this._menuOpen}
      >
        ${this._renderContent()}
      </button>
      ${this._menuOpen && this.state === 'connected' ? this._renderDropdown() : nothing}
    `;
        }
        _renderContent() {
            switch (this.state) {
                case 'connecting':
                    return html `<span class="spinner"></span> ${t('connecting')}`;
                case 'connected': {
                    const truncated = this.formatAddress(this.address);
                    return html `
          ${this.showAvatar ? html `<span class="avatar"></span>` : nothing}
          <span class="address">${truncated}</span>
          ${this.showBalance && this.balance ? html `<span class="balance">${this.balance} ${this.chainSymbol}</span>` : nothing}
          <span class="dropdown-arrow"></span>
        `;
                }
                case 'wrong_network':
                    return html `⚠️ ${t('wrong_network')}`;
                case 'error':
                    return html `❌ ${t('error')}`;
                default:
                    return html `${this.label || t('connect_wallet')}`;
            }
        }
        _renderDropdown() {
            return html `
      <div class="dropdown" role="menu" aria-label="Account menu">
        <button role="menuitem" @click=${this._handleDisconnect}>${t('disconnect')}</button>
      </div>
    `;
        }
        _getAriaLabel() {
            switch (this.state) {
                case 'connected':
                    return `${t('connected')} ${this.formatAddress(this.address)}`;
                case 'connecting':
                    return t('connecting');
                case 'wrong_network':
                    return t('wrong_network');
                case 'error':
                    return t('error');
                default:
                    return this.label || t('connect_wallet');
            }
        }
    };
    __setFunctionName(_classThis, "ConnectButton");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _variant_decorators = [property({ reflect: true })];
        _size_decorators = [property({ reflect: true })];
        _label_decorators = [property({ reflect: true })];
        _showBalance_decorators = [property({ type: Boolean, attribute: 'show-balance' })];
        _showAvatar_decorators = [property({ type: Boolean, attribute: 'show-avatar' })];
        _showNetwork_decorators = [property({ type: Boolean, attribute: 'show-network' })];
        _address_decorators = [property({ reflect: true })];
        _balance_decorators = [property()];
        _chainSymbol_decorators = [property()];
        _state_decorators = [property({ reflect: true })];
        _chainId_decorators = [property({ type: Number })];
        __menuOpen_decorators = [state()];
        __esDecorate(null, null, _variant_decorators, { kind: "field", name: "variant", static: false, private: false, access: { has: obj => "variant" in obj, get: obj => obj.variant, set: (obj, value) => { obj.variant = value; } }, metadata: _metadata }, _variant_initializers, _variant_extraInitializers);
        __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
        __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
        __esDecorate(null, null, _showBalance_decorators, { kind: "field", name: "showBalance", static: false, private: false, access: { has: obj => "showBalance" in obj, get: obj => obj.showBalance, set: (obj, value) => { obj.showBalance = value; } }, metadata: _metadata }, _showBalance_initializers, _showBalance_extraInitializers);
        __esDecorate(null, null, _showAvatar_decorators, { kind: "field", name: "showAvatar", static: false, private: false, access: { has: obj => "showAvatar" in obj, get: obj => obj.showAvatar, set: (obj, value) => { obj.showAvatar = value; } }, metadata: _metadata }, _showAvatar_initializers, _showAvatar_extraInitializers);
        __esDecorate(null, null, _showNetwork_decorators, { kind: "field", name: "showNetwork", static: false, private: false, access: { has: obj => "showNetwork" in obj, get: obj => obj.showNetwork, set: (obj, value) => { obj.showNetwork = value; } }, metadata: _metadata }, _showNetwork_initializers, _showNetwork_extraInitializers);
        __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: obj => "address" in obj, get: obj => obj.address, set: (obj, value) => { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
        __esDecorate(null, null, _balance_decorators, { kind: "field", name: "balance", static: false, private: false, access: { has: obj => "balance" in obj, get: obj => obj.balance, set: (obj, value) => { obj.balance = value; } }, metadata: _metadata }, _balance_initializers, _balance_extraInitializers);
        __esDecorate(null, null, _chainSymbol_decorators, { kind: "field", name: "chainSymbol", static: false, private: false, access: { has: obj => "chainSymbol" in obj, get: obj => obj.chainSymbol, set: (obj, value) => { obj.chainSymbol = value; } }, metadata: _metadata }, _chainSymbol_initializers, _chainSymbol_extraInitializers);
        __esDecorate(null, null, _state_decorators, { kind: "field", name: "state", static: false, private: false, access: { has: obj => "state" in obj, get: obj => obj.state, set: (obj, value) => { obj.state = value; } }, metadata: _metadata }, _state_initializers, _state_extraInitializers);
        __esDecorate(null, null, _chainId_decorators, { kind: "field", name: "chainId", static: false, private: false, access: { has: obj => "chainId" in obj, get: obj => obj.chainId, set: (obj, value) => { obj.chainId = value; } }, metadata: _metadata }, _chainId_initializers, _chainId_extraInitializers);
        __esDecorate(null, null, __menuOpen_decorators, { kind: "field", name: "_menuOpen", static: false, private: false, access: { has: obj => "_menuOpen" in obj, get: obj => obj._menuOpen, set: (obj, value) => { obj._menuOpen = value; } }, metadata: _metadata }, __menuOpen_initializers, __menuOpen_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConnectButton = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConnectButton = _classThis;
})();
export { ConnectButton };
//# sourceMappingURL=connect-button.js.map