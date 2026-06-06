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
let WalletList = (() => {
    let _classDecorators = [customElement('ocx-wallet-list')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseLitElement;
    let _wallets_decorators;
    let _wallets_initializers = [];
    let _wallets_extraInitializers = [];
    let _recommendedWalletIds_decorators;
    let _recommendedWalletIds_initializers = [];
    let _recommendedWalletIds_extraInitializers = [];
    let _installedWalletIds_decorators;
    let _installedWalletIds_initializers = [];
    let _installedWalletIds_extraInitializers = [];
    var WalletList = _classThis = class extends _classSuper {
        static get styles() {
            return [
                super.hostStyles,
                css `
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
        render() {
            if (!this.wallets.length) {
                return html `
        <div class="empty-state">
          <p>No wallets available</p>
          <p style="font-size:var(--ocx-font-size-xs,0.75rem);">Install a wallet extension to get started</p>
        </div>
      `;
            }
            const recommended = this.wallets.filter(w => this.recommendedWalletIds.includes(w.id));
            const installed = this.wallets.filter(w => this.installedWalletIds.includes(w.id) && !this.recommendedWalletIds.includes(w.id));
            const others = this.wallets.filter(w => !this.recommendedWalletIds.includes(w.id) && !this.installedWalletIds.includes(w.id));
            return html `
      <div class="list">
        ${recommended.length ? html `
          <div class="section-label">Recommended</div>
          ${recommended.map(w => this._renderCard(w))}
        ` : nothing}
        ${installed.length ? html `
          <div class="section-label">Installed</div>
          ${installed.map(w => this._renderCard(w))}
        ` : nothing}
        ${others.length ? html `
          <div class="section-label">All Wallets</div>
          ${others.map(w => this._renderCard(w))}
        ` : nothing}
      </div>
    `;
        }
        _renderCard(wallet) {
            const isInstalled = this.installedWalletIds.includes(wallet.id);
            const isRecommended = this.recommendedWalletIds.includes(wallet.id);
            return html `
      <ocx-wallet-card
        .wallet=${wallet}
        ?installed=${isInstalled}
        ?recommended=${isRecommended}
        @click=${() => this._onSelect(wallet)}
      ></ocx-wallet-card>
    `;
        }
        _onSelect(wallet) {
            this.dispatchEvent(new CustomEvent('ocx-wallet-select', {
                bubbles: true,
                composed: true,
                detail: wallet,
            }));
        }
        constructor() {
            super(...arguments);
            this.wallets = __runInitializers(this, _wallets_initializers, []);
            this.recommendedWalletIds = (__runInitializers(this, _wallets_extraInitializers), __runInitializers(this, _recommendedWalletIds_initializers, []));
            this.installedWalletIds = (__runInitializers(this, _recommendedWalletIds_extraInitializers), __runInitializers(this, _installedWalletIds_initializers, []));
            __runInitializers(this, _installedWalletIds_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "WalletList");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _wallets_decorators = [property({ type: Array })];
        _recommendedWalletIds_decorators = [property({ attribute: false })];
        _installedWalletIds_decorators = [property({ attribute: false })];
        __esDecorate(null, null, _wallets_decorators, { kind: "field", name: "wallets", static: false, private: false, access: { has: obj => "wallets" in obj, get: obj => obj.wallets, set: (obj, value) => { obj.wallets = value; } }, metadata: _metadata }, _wallets_initializers, _wallets_extraInitializers);
        __esDecorate(null, null, _recommendedWalletIds_decorators, { kind: "field", name: "recommendedWalletIds", static: false, private: false, access: { has: obj => "recommendedWalletIds" in obj, get: obj => obj.recommendedWalletIds, set: (obj, value) => { obj.recommendedWalletIds = value; } }, metadata: _metadata }, _recommendedWalletIds_initializers, _recommendedWalletIds_extraInitializers);
        __esDecorate(null, null, _installedWalletIds_decorators, { kind: "field", name: "installedWalletIds", static: false, private: false, access: { has: obj => "installedWalletIds" in obj, get: obj => obj.installedWalletIds, set: (obj, value) => { obj.installedWalletIds = value; } }, metadata: _metadata }, _installedWalletIds_initializers, _installedWalletIds_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WalletList = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WalletList = _classThis;
})();
export { WalletList };
//# sourceMappingURL=wallet-list.js.map