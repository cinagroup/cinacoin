/**
 * AccountModal Web Component (i18n-enabled)
 *
 * Modal for managing connected account — shows balance, copy address,
 * view explorer, switch account, and disconnect.
 *
 * Properties:
 *   - address: connected wallet address
 *   - chainId: current chain ID
 *   - balance: account balance string
 *   - chainSymbol: native currency symbol
 *   - allAccounts: additional account list
 *   - connectedApps: connected dApp list
 *
 * Events:
 *   - ocx-close, ocx-disconnect, ocx-copy-address, ocx-view-explorer, ocx-switch-account
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
import { customElement, property } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { t, isRTL } from '../i18n/index.js';
let AccountModal = (() => {
    let _classDecorators = [customElement('ocx-account-modal')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseLitElement;
    let _address_decorators;
    let _address_initializers = [];
    let _address_extraInitializers = [];
    let _chainId_decorators;
    let _chainId_initializers = [];
    let _chainId_extraInitializers = [];
    let _balance_decorators;
    let _balance_initializers = [];
    let _balance_extraInitializers = [];
    let _chainSymbol_decorators;
    let _chainSymbol_initializers = [];
    let _chainSymbol_extraInitializers = [];
    let _allAccounts_decorators;
    let _allAccounts_initializers = [];
    let _allAccounts_extraInitializers = [];
    let _connectedApps_decorators;
    let _connectedApps_initializers = [];
    let _connectedApps_extraInitializers = [];
    let _isOpen_decorators;
    let _isOpen_initializers = [];
    let _isOpen_extraInitializers = [];
    var AccountModal = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            this.address = __runInitializers(this, _address_initializers, '');
            this.chainId = (__runInitializers(this, _address_extraInitializers), __runInitializers(this, _chainId_initializers, 1));
            this.balance = (__runInitializers(this, _chainId_extraInitializers), __runInitializers(this, _balance_initializers, '0.00'));
            this.chainSymbol = (__runInitializers(this, _balance_extraInitializers), __runInitializers(this, _chainSymbol_initializers, 'ETH'));
            this.allAccounts = (__runInitializers(this, _chainSymbol_extraInitializers), __runInitializers(this, _allAccounts_initializers, []));
            this.connectedApps = (__runInitializers(this, _allAccounts_extraInitializers), __runInitializers(this, _connectedApps_initializers, []));
            this.isOpen = (__runInitializers(this, _connectedApps_extraInitializers), __runInitializers(this, _isOpen_initializers, false));
            this._onKeydown = (__runInitializers(this, _isOpen_extraInitializers), (e) => {
                if (e.key === 'Escape' && this.isOpen)
                    this._close();
            });
        }
        static get styles() {
            return [
                super.hostStyles,
                css `
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
          max-width: 380px;
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

        .close-btn {
          background: none;
          border: none;
          color: var(--ocx-color-text-secondary, #94A3B8);
          cursor: pointer;
          font-size: var(--ocx-font-size-lg, 1.125rem);
          padding: var(--ocx-space-2, 0.5rem);
          border-radius: var(--ocx-radius-md, 0.5rem);
        }
        .close-btn:hover {
          background: var(--ocx-color-bg-card, #1E293B);
        }

        .account-card {
          margin: var(--ocx-space-4, 1rem);
          padding: var(--ocx-space-4, 1rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          text-align: center;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--ocx-color-accent-500, #3B82F6);
          margin: 0 auto var(--ocx-space-3, 0.75rem);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--ocx-font-size-xl, 1.25rem);
        }

        .address {
          font-family: var(--ocx-font-family-mono, monospace);
          font-size: var(--ocx-font-size-lg, 1.125rem);
          color: var(--ocx-color-text-primary, #f8fafc);
          margin-bottom: var(--ocx-space-1, 0.25rem);
        }

        .balance {
          font-size: var(--ocx-font-size-xl, 1.25rem);
          font-weight: var(--ocx-font-weight-bold, 700);
          color: var(--ocx-color-text-primary, #f8fafc);
          margin-bottom: var(--ocx-space-3, 0.75rem);
        }

        .actions {
          display: flex;
          justify-content: center;
          gap: var(--ocx-space-3, 0.75rem);
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--ocx-space-1, 0.25rem);
          background: none;
          border: none;
          color: var(--ocx-color-text-secondary, #94A3B8);
          cursor: pointer;
          font-size: var(--ocx-font-size-xs, 0.75rem);
          padding: var(--ocx-space-2, 0.5rem);
          border-radius: var(--ocx-radius-md, 0.5rem);
          transition: color var(--ocx-duration-fast, 150ms) ease;
        }
        .action-btn:hover {
          color: var(--ocx-color-text-primary, #f8fafc);
          background: var(--ocx-color-bg-card-hover, #334155);
        }

        .section {
          padding: 0 var(--ocx-space-4, 1rem);
          margin-bottom: var(--ocx-space-4, 1rem);
        }

        .section-title {
          font-size: var(--ocx-font-size-sm, 0.875rem);
          font-weight: var(--ocx-font-weight-semibold, 600);
          color: var(--ocx-color-text-secondary, #94A3B8);
          margin-bottom: var(--ocx-space-2, 0.5rem);
        }

        .switch-account-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border-radius: var(--ocx-radius-md, 0.5rem);
          cursor: pointer;
          margin-bottom: var(--ocx-space-2, 0.5rem);
          transition: background-color var(--ocx-duration-fast, 150ms) ease;
        }
        .switch-account-item:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
        }
        .switch-account-item .addr {
          font-family: var(--ocx-font-family-mono, monospace);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }
        .switch-account-item .bal {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
        }

        .connected-app-item {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-2, 0.5rem);
          padding: var(--ocx-space-2, 0.5rem) var(--ocx-space-3, 0.75rem);
          margin-bottom: var(--ocx-space-2, 0.5rem);
          font-size: var(--ocx-font-size-sm, 0.875rem);
        }
        .connected-app-item .last {
          margin-left: auto;
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-tertiary, #64748B);
        }

        .disconnect-btn {
          display: block;
          width: calc(100% - 2rem);
          margin: 0 var(--ocx-space-4, 1rem) var(--ocx-space-4, 1rem);
          padding: var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-error-bg, rgba(239,68,68,0.15));
          color: var(--ocx-color-error, #EF4444);
          border: none;
          border-radius: var(--ocx-radius-lg, 0.75rem);
          font-size: var(--ocx-font-size-sm, 0.875rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          cursor: pointer;
          transition: background-color var(--ocx-duration-fast, 150ms) ease;
        }
        .disconnect-btn:hover {
          background: var(--ocx-color-error, #EF4444);
          color: var(--ocx-color-text-inverse, #fff);
        }
      `,
            ];
        }
        connectedCallback() {
            super.connectedCallback();
            document.addEventListener('keydown', this._onKeydown);
            if (isRTL())
                this.setAttribute('dir', 'rtl');
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            document.removeEventListener('keydown', this._onKeydown);
        }
        _close() {
            this.isOpen = false;
            this.dispatchEvent(new CustomEvent('ocx-close', { bubbles: true, composed: true }));
        }
        _copyAddress() {
            navigator.clipboard?.writeText(this.address).catch(() => { });
            this.dispatchEvent(new CustomEvent('ocx-copy-address', { bubbles: true, composed: true }));
        }
        _viewExplorer() {
            this.dispatchEvent(new CustomEvent('ocx-view-explorer', { bubbles: true, composed: true }));
        }
        _disconnect() {
            this.dispatchEvent(new CustomEvent('ocx-disconnect', { bubbles: true, composed: true }));
        }
        _switchAccount(address) {
            this.dispatchEvent(new CustomEvent('ocx-switch-account', { detail: { address }, bubbles: true, composed: true }));
        }
        render() {
            if (!this.isOpen)
                return nothing;
            return html `
      <div class="overlay" @click=${(e) => { if (e.target.classList.contains('overlay'))
                this._close(); }}>
        <div class="modal" role="dialog" aria-modal="true" aria-label="${t('account')}">
          <div class="header">
            <span></span>
            <button class="close-btn" @click=${this._close} aria-label="${t('close')}">✕</button>
          </div>

          <div class="account-card">
            <div class="avatar">🧑</div>
            <div class="address">${this.formatAddress(this.address)}</div>
            <div class="balance">${this.balance} ${this.chainSymbol}</div>
            <div class="actions">
              <button class="action-btn" @click=${this._copyAddress}>📋 ${t('copy_address')}</button>
              <button class="action-btn" @click=${this._viewExplorer}>↗ ${t('view_explorer')}</button>
            </div>
          </div>

          ${this.allAccounts.length
                ? html `
                <div class="section">
                  <div class="section-title">${t('switch_account')}</div>
                  ${this.allAccounts.map(a => html `
                    <div class="switch-account-item" @click=${() => this._switchAccount(a.address)}>
                      <span class="addr">${this.formatAddress(a.address)}</span>
                      <span class="bal">${a.balance} ${a.chainSymbol}</span>
                    </div>
                  `)}
                </div>
              `
                : nothing}

          ${this.connectedApps.length
                ? html `
                <div class="section">
                  <div class="section-title">${t('connected_apps')}</div>
                  ${this.connectedApps.map(app => html `
                    <div class="connected-app-item">
                      <span>${app.name}</span>
                      ${app.lastUsed ? html `<span class="last">${app.lastUsed}</span>` : nothing}
                    </div>
                  `)}
                </div>
              `
                : nothing}

          <button class="disconnect-btn" @click=${this._disconnect}>🔴 ${t('disconnect')}</button>
        </div>
      </div>
    `;
        }
    };
    __setFunctionName(_classThis, "AccountModal");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _address_decorators = [property({ reflect: true })];
        _chainId_decorators = [property({ type: Number })];
        _balance_decorators = [property()];
        _chainSymbol_decorators = [property()];
        _allAccounts_decorators = [property({ type: Array })];
        _connectedApps_decorators = [property({ type: Array })];
        _isOpen_decorators = [property({ type: Boolean, attribute: 'is-open', reflect: true })];
        __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: obj => "address" in obj, get: obj => obj.address, set: (obj, value) => { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
        __esDecorate(null, null, _chainId_decorators, { kind: "field", name: "chainId", static: false, private: false, access: { has: obj => "chainId" in obj, get: obj => obj.chainId, set: (obj, value) => { obj.chainId = value; } }, metadata: _metadata }, _chainId_initializers, _chainId_extraInitializers);
        __esDecorate(null, null, _balance_decorators, { kind: "field", name: "balance", static: false, private: false, access: { has: obj => "balance" in obj, get: obj => obj.balance, set: (obj, value) => { obj.balance = value; } }, metadata: _metadata }, _balance_initializers, _balance_extraInitializers);
        __esDecorate(null, null, _chainSymbol_decorators, { kind: "field", name: "chainSymbol", static: false, private: false, access: { has: obj => "chainSymbol" in obj, get: obj => obj.chainSymbol, set: (obj, value) => { obj.chainSymbol = value; } }, metadata: _metadata }, _chainSymbol_initializers, _chainSymbol_extraInitializers);
        __esDecorate(null, null, _allAccounts_decorators, { kind: "field", name: "allAccounts", static: false, private: false, access: { has: obj => "allAccounts" in obj, get: obj => obj.allAccounts, set: (obj, value) => { obj.allAccounts = value; } }, metadata: _metadata }, _allAccounts_initializers, _allAccounts_extraInitializers);
        __esDecorate(null, null, _connectedApps_decorators, { kind: "field", name: "connectedApps", static: false, private: false, access: { has: obj => "connectedApps" in obj, get: obj => obj.connectedApps, set: (obj, value) => { obj.connectedApps = value; } }, metadata: _metadata }, _connectedApps_initializers, _connectedApps_extraInitializers);
        __esDecorate(null, null, _isOpen_decorators, { kind: "field", name: "isOpen", static: false, private: false, access: { has: obj => "isOpen" in obj, get: obj => obj.isOpen, set: (obj, value) => { obj.isOpen = value; } }, metadata: _metadata }, _isOpen_initializers, _isOpen_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AccountModal = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AccountModal = _classThis;
})();
export { AccountModal };
//# sourceMappingURL=account-modal.js.map