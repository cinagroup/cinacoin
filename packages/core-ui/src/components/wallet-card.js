/**
 * WalletCard Web Component (i18n-enabled)
 *
 * Single wallet card shown in wallet lists or modal grids.
 *
 * Properties:
 *   - wallet: WalletInfo
 *   - installed: boolean
 *   - recommended: boolean
 *
 * Events:
 *   - ocx-wallet-select: fired on click
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
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseLitElement } from '../foundation/base-element.js';
import { t, isRTL } from '../i18n/index.js';
let WalletCard = (() => {
    let _classDecorators = [customElement('ocx-wallet-card')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseLitElement;
    let _wallet_decorators;
    let _wallet_initializers = [];
    let _wallet_extraInitializers = [];
    let _installed_decorators;
    let _installed_initializers = [];
    let _installed_extraInitializers = [];
    let _recommended_decorators;
    let _recommended_initializers = [];
    let _recommended_extraInitializers = [];
    var WalletCard = _classThis = class extends _classSuper {
        static get styles() {
            return [
                super.hostStyles,
                css `
        :host {
          display: block;
        }

        .card {
          display: flex;
          align-items: center;
          gap: var(--ocx-space-3, 0.75rem);
          padding: var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          cursor: pointer;
          transition: background-color var(--ocx-duration-fast, 150ms) ease,
                      border-color var(--ocx-duration-fast, 150ms) ease;
        }
        .card:hover {
          background: var(--ocx-color-bg-card-hover, #334155);
          border-color: var(--ocx-color-border-hover, #4B5563);
        }
        .card:focus-visible {
          outline: 2px solid var(--ocx-color-border-focus, #3B82F6);
          outline-offset: 2px;
        }

        .icon {
          width: 40px;
          height: 40px;
          border-radius: var(--ocx-radius-md, 0.5rem);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon img {
          width: 24px;
          height: 24px;
        }
        .icon-fallback {
          font-size: var(--ocx-font-size-xl, 1.25rem);
        }

        .info {
          flex: 1;
          min-width: 0;
        }
        .name {
          font-size: var(--ocx-font-size-md, 1rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          color: var(--ocx-color-text-primary, #f8fafc);
        }
        .desc {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badge {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          padding: 2px 8px;
          border-radius: var(--ocx-radius-full, 9999px);
          white-space: nowrap;
        }
        .badge-recommended {
          background: var(--ocx-color-accent-500, #3B82F6);
          color: var(--ocx-color-text-inverse, #fff);
        }
        .badge-installed {
          background: var(--ocx-color-success-bg, rgba(34,197,94,0.15));
          color: var(--ocx-color-success, #22C55E);
        }
      `,
            ];
        }
        connectedCallback() {
            super.connectedCallback();
            if (isRTL())
                this.setAttribute('dir', 'rtl');
        }
        render() {
            if (!this.wallet)
                return null;
            return html `
      <div class="card" role="button" tabindex="0"
           aria-label="${t('wallet')} ${this.wallet.name}">
        <div class="icon" style="background:${this.wallet.iconBackground || 'var(--ocx-color-bg-tertiary, #1F2937)'}">
          ${this.wallet.icon
                ? html `<img src="${this.wallet.icon}" alt="" loading="lazy" />`
                : html `<span class="icon-fallback">🔗</span>`}
        </div>
        <div class="info">
          <div class="name">${this.wallet.name}</div>
          ${this.wallet.description ? html `<div class="desc">${this.wallet.description}</div>` : ''}
        </div>
        ${this.recommended
                ? html `<span class="badge badge-recommended">${t('recommended')}</span>`
                : this.installed
                    ? html `<span class="badge badge-installed">${t('installed')}</span>`
                    : ''}
      </div>
    `;
        }
        constructor() {
            super(...arguments);
            this.wallet = __runInitializers(this, _wallet_initializers, null);
            this.installed = (__runInitializers(this, _wallet_extraInitializers), __runInitializers(this, _installed_initializers, false));
            this.recommended = (__runInitializers(this, _installed_extraInitializers), __runInitializers(this, _recommended_initializers, false));
            __runInitializers(this, _recommended_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "WalletCard");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _wallet_decorators = [property({ type: Object })];
        _installed_decorators = [property({ type: Boolean })];
        _recommended_decorators = [property({ type: Boolean })];
        __esDecorate(null, null, _wallet_decorators, { kind: "field", name: "wallet", static: false, private: false, access: { has: obj => "wallet" in obj, get: obj => obj.wallet, set: (obj, value) => { obj.wallet = value; } }, metadata: _metadata }, _wallet_initializers, _wallet_extraInitializers);
        __esDecorate(null, null, _installed_decorators, { kind: "field", name: "installed", static: false, private: false, access: { has: obj => "installed" in obj, get: obj => obj.installed, set: (obj, value) => { obj.installed = value; } }, metadata: _metadata }, _installed_initializers, _installed_extraInitializers);
        __esDecorate(null, null, _recommended_decorators, { kind: "field", name: "recommended", static: false, private: false, access: { has: obj => "recommended" in obj, get: obj => obj.recommended, set: (obj, value) => { obj.recommended = value; } }, metadata: _metadata }, _recommended_initializers, _recommended_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WalletCard = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WalletCard = _classThis;
})();
export { WalletCard };
//# sourceMappingURL=wallet-card.js.map