/**
 * TransactionToast Web Component (i18n-enabled)
 *
 * Toast notification for transaction status updates.
 *
 * Properties:
 *   - hash: transaction hash
 *   - chainId: chain ID
 *   - status: 'pending' | 'confirmed' | 'failed' | 'replaced'
 *   - confirmations: current confirmation count
 *   - targetConfirmations: required confirmations
 *   - autoDismiss: auto-dismiss timeout in ms (0 = no auto-dismiss)
 *   - explorerUrl: block explorer URL
 *
 * Events:
 *   - ocx-dismiss: fired when toast is dismissed
 *   - ocx-retry: fired when retry button is clicked (failed tx)
 *   - ocx-view-explorer: fired when view on explorer is clicked
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
let TransactionToast = (() => {
    let _classDecorators = [customElement('ocx-transaction-toast')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseLitElement;
    let _hash_decorators;
    let _hash_initializers = [];
    let _hash_extraInitializers = [];
    let _chainId_decorators;
    let _chainId_initializers = [];
    let _chainId_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _confirmations_decorators;
    let _confirmations_initializers = [];
    let _confirmations_extraInitializers = [];
    let _targetConfirmations_decorators;
    let _targetConfirmations_initializers = [];
    let _targetConfirmations_extraInitializers = [];
    let _autoDismiss_decorators;
    let _autoDismiss_initializers = [];
    let _autoDismiss_extraInitializers = [];
    let _explorerUrl_decorators;
    let _explorerUrl_initializers = [];
    let _explorerUrl_extraInitializers = [];
    let __progressWidth_decorators;
    let __progressWidth_initializers = [];
    let __progressWidth_extraInitializers = [];
    var TransactionToast = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            this.hash = __runInitializers(this, _hash_initializers, '');
            this.chainId = (__runInitializers(this, _hash_extraInitializers), __runInitializers(this, _chainId_initializers, 1));
            this.status = (__runInitializers(this, _chainId_extraInitializers), __runInitializers(this, _status_initializers, 'pending'));
            this.confirmations = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _confirmations_initializers, 0));
            this.targetConfirmations = (__runInitializers(this, _confirmations_extraInitializers), __runInitializers(this, _targetConfirmations_initializers, 12));
            this.autoDismiss = (__runInitializers(this, _targetConfirmations_extraInitializers), __runInitializers(this, _autoDismiss_initializers, 8000));
            this.explorerUrl = (__runInitializers(this, _autoDismiss_extraInitializers), __runInitializers(this, _explorerUrl_initializers, ''));
            this._progressWidth = (__runInitializers(this, _explorerUrl_extraInitializers), __runInitializers(this, __progressWidth_initializers, 0));
            this._dismissTimer = (__runInitializers(this, __progressWidth_extraInitializers), null);
        }
        static get styles() {
            return [
                super.hostStyles,
                css `
        :host {
          display: block;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: var(--ocx-space-3, 0.75rem);
          padding: var(--ocx-space-3, 0.75rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-lg, 0.75rem);
          box-shadow: var(--ocx-shadow-lg, 0 10px 15px rgba(0,0,0,0.3));
          max-width: 380px;
          min-width: 280px;
          position: relative;
          overflow: hidden;
        }

        .icon {
          font-size: var(--ocx-font-size-lg, 1.125rem);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .content {
          flex: 1;
          min-width: 0;
        }

        .title {
          font-size: var(--ocx-font-size-sm, 0.875rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          margin-bottom: 2px;
        }

        .subtitle {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-text-secondary, #94A3B8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actions {
          display: flex;
          gap: var(--ocx-space-2, 0.5rem);
          margin-top: var(--ocx-space-2, 0.5rem);
        }

        .action-link {
          font-size: var(--ocx-font-size-xs, 0.75rem);
          color: var(--ocx-color-accent-500, #3B82F6);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          text-decoration: none;
        }
        .action-link:hover {
          text-decoration: underline;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--ocx-color-text-tertiary, #64748B);
          cursor: pointer;
          font-size: var(--ocx-font-size-sm, 0.875rem);
          padding: var(--ocx-space-1, 0.25rem);
          flex-shrink: 0;
          line-height: 1;
        }
        .close-btn:hover {
          color: var(--ocx-color-text-primary, #f8fafc);
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: var(--ocx-color-accent-500, #3B82F6);
          transition: width 0.3s ease;
        }

        /* Status colors */
        :host([status="confirmed"]) .icon { color: var(--ocx-color-success, #22C55E); }
        :host([status="failed"]) .icon { color: var(--ocx-color-error, #EF4444); }
        :host([status="pending"]) .icon { color: var(--ocx-color-warning, #EAB308); }
        :host([status="replaced"]) .icon { color: var(--ocx-color-info, #3B82F6); }
      `,
            ];
        }
        connectedCallback() {
            super.connectedCallback();
            this._startProgress();
            if (this.autoDismiss > 0 && this.status !== 'pending') {
                this._dismissTimer = setTimeout(() => this._dismiss(), this.autoDismiss);
            }
            if (isRTL())
                this.setAttribute('dir', 'rtl');
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            if (this._dismissTimer)
                clearTimeout(this._dismissTimer);
        }
        updated(changedProperties) {
            if (changedProperties.has('status')) {
                if (this.autoDismiss > 0 && this.status !== 'pending') {
                    this._dismissTimer = setTimeout(() => this._dismiss(), this.autoDismiss);
                }
            }
        }
        _startProgress() {
            if (this.status !== 'pending')
                return;
            const interval = setInterval(() => {
                this._progressWidth += 1;
                if (this._progressWidth >= 100) {
                    clearInterval(interval);
                }
            }, this.autoDismiss / 100);
        }
        _dismiss() {
            this.dispatchEvent(new CustomEvent('ocx-dismiss', { bubbles: true, composed: true }));
        }
        _retry() {
            this.dispatchEvent(new CustomEvent('ocx-retry', { bubbles: true, composed: true }));
        }
        _viewExplorer() {
            this.dispatchEvent(new CustomEvent('ocx-view-explorer', {
                bubbles: true,
                composed: true,
                detail: { hash: this.hash, explorerUrl: this.explorerUrl },
            }));
        }
        render() {
            const truncated = this.hash.length > 10
                ? `${this.hash.slice(0, 6)}...${this.hash.slice(-4)}`
                : this.hash;
            return html `
      <div class="toast" role="alert" aria-live="polite">
        <span class="icon">${this._statusIcon}</span>
        <div class="content">
          <div class="title">${this._statusTitle}</div>
          <div class="subtitle">${this._statusMessage} — ${truncated}</div>
          <div class="actions">
            ${this.explorerUrl ? html `<button class="action-link" @click=${this._viewExplorer}>↗ ${t('view')}</button>` : nothing}
            ${this.status === 'failed' ? html `<button class="action-link" @click=${this._retry}>${t('retry')}</button>` : nothing}
          </div>
        </div>
        <button class="close-btn" @click=${this._dismiss} aria-label="${t('close')}">✕</button>
        ${this.status === 'pending' ? html `<div class="progress-bar" style="width:${this._progressWidth}%"></div>` : nothing}
      </div>
    `;
        }
        get _statusIcon() {
            switch (this.status) {
                case 'confirmed': return '✅';
                case 'failed': return '❌';
                case 'pending': return '⏳';
                case 'replaced': return '🔄';
                default: return '⏳';
            }
        }
        get _statusTitle() {
            switch (this.status) {
                case 'confirmed': return t('transaction_confirmed');
                case 'failed': return t('transaction_failed');
                case 'pending': return t('transaction_pending');
                case 'replaced': return t('transaction_replaced');
                default: return t('transaction_pending');
            }
        }
        get _statusMessage() {
            if (this.status === 'pending' && this.targetConfirmations > 0) {
                return `(${this.confirmations}/${this.targetConfirmations})`;
            }
            return '';
        }
    };
    __setFunctionName(_classThis, "TransactionToast");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _hash_decorators = [property()];
        _chainId_decorators = [property({ type: Number })];
        _status_decorators = [property({ reflect: true })];
        _confirmations_decorators = [property({ type: Number })];
        _targetConfirmations_decorators = [property({ type: Number })];
        _autoDismiss_decorators = [property({ type: Number })];
        _explorerUrl_decorators = [property()];
        __progressWidth_decorators = [state()];
        __esDecorate(null, null, _hash_decorators, { kind: "field", name: "hash", static: false, private: false, access: { has: obj => "hash" in obj, get: obj => obj.hash, set: (obj, value) => { obj.hash = value; } }, metadata: _metadata }, _hash_initializers, _hash_extraInitializers);
        __esDecorate(null, null, _chainId_decorators, { kind: "field", name: "chainId", static: false, private: false, access: { has: obj => "chainId" in obj, get: obj => obj.chainId, set: (obj, value) => { obj.chainId = value; } }, metadata: _metadata }, _chainId_initializers, _chainId_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _confirmations_decorators, { kind: "field", name: "confirmations", static: false, private: false, access: { has: obj => "confirmations" in obj, get: obj => obj.confirmations, set: (obj, value) => { obj.confirmations = value; } }, metadata: _metadata }, _confirmations_initializers, _confirmations_extraInitializers);
        __esDecorate(null, null, _targetConfirmations_decorators, { kind: "field", name: "targetConfirmations", static: false, private: false, access: { has: obj => "targetConfirmations" in obj, get: obj => obj.targetConfirmations, set: (obj, value) => { obj.targetConfirmations = value; } }, metadata: _metadata }, _targetConfirmations_initializers, _targetConfirmations_extraInitializers);
        __esDecorate(null, null, _autoDismiss_decorators, { kind: "field", name: "autoDismiss", static: false, private: false, access: { has: obj => "autoDismiss" in obj, get: obj => obj.autoDismiss, set: (obj, value) => { obj.autoDismiss = value; } }, metadata: _metadata }, _autoDismiss_initializers, _autoDismiss_extraInitializers);
        __esDecorate(null, null, _explorerUrl_decorators, { kind: "field", name: "explorerUrl", static: false, private: false, access: { has: obj => "explorerUrl" in obj, get: obj => obj.explorerUrl, set: (obj, value) => { obj.explorerUrl = value; } }, metadata: _metadata }, _explorerUrl_initializers, _explorerUrl_extraInitializers);
        __esDecorate(null, null, __progressWidth_decorators, { kind: "field", name: "_progressWidth", static: false, private: false, access: { has: obj => "_progressWidth" in obj, get: obj => obj._progressWidth, set: (obj, value) => { obj._progressWidth = value; } }, metadata: _metadata }, __progressWidth_initializers, __progressWidth_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransactionToast = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransactionToast = _classThis;
})();
export { TransactionToast };
//# sourceMappingURL=transaction-toast.js.map