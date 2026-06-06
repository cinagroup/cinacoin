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
import { Component, Input } from '@angular/core';
/**
 * Button component that triggers the wallet connection modal.
 *
 * ```html
 * <cina-connect-button></cina-connect-button>
 * <cina-connect-button [disabled]="isConnecting" size="lg" label="Connect Wallet"></cina-connect-button>
 * ```
 */
let ConnectButtonComponent = (() => {
    let _classDecorators = [Component({
            selector: 'cina-connect-button',
            template: `
    <button
      class="cina-connect-button"
      [class.cina-connect-button--loading]="loading"
      [class.cina-connect-button--size-sm]="size === 'sm'"
      [class.cina-connect-button--size-md]="size === 'md'"
      [class.cina-connect-button--size-lg]="size === 'lg'"
      [disabled]="disabled || loading"
      (click)="handleClick()"
    >
      <ng-container *ngIf="loading; else defaultContent">
        <span class="cina-connect-button__spinner"></span>
        Connecting...
      </ng-container>
      <ng-template #defaultContent>
        {{ displayLabel }}
      </ng-template>
    </button>
  `,
            styles: [
                `
      .cina-connect-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        font-weight: 600;
        border: none;
        border-radius: 0.75rem;
        cursor: pointer;
        background: #3b82f6;
        color: #ffffff;
        transition: background-color 0.15s ease, opacity 0.15s ease;
      }
      .cina-connect-button:hover:not(:disabled) {
        background: #2563eb;
      }
      .cina-connect-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .cina-connect-button--size-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
      }
      .cina-connect-button--size-md {
        padding: 0.625rem 1.25rem;
        font-size: 1rem;
      }
      .cina-connect-button--size-lg {
        padding: 0.875rem 1.75rem;
        font-size: 1.125rem;
      }
      .cina-connect-button__spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: cina-spin 0.6s linear infinite;
      }
      @keyframes cina-spin {
        to { transform: rotate(360deg); }
      }
    `,
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _disabled_decorators;
    let _disabled_initializers = [];
    let _disabled_extraInitializers = [];
    let _size_decorators;
    let _size_initializers = [];
    let _size_extraInitializers = [];
    let _label_decorators;
    let _label_initializers = [];
    let _label_extraInitializers = [];
    var ConnectButtonComponent = _classThis = class {
        constructor(_service) {
            this._service = _service;
            /** Whether the button is disabled. */
            this.disabled = __runInitializers(this, _disabled_initializers, false);
            /** Button size: 'sm', 'md', or 'lg'. Defaults to 'md'. */
            this.size = (__runInitializers(this, _disabled_extraInitializers), __runInitializers(this, _size_initializers, 'md'));
            /** Custom button label. Defaults to 'Connect Wallet'. */
            this.label = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _label_initializers, void 0));
            this.loading = (__runInitializers(this, _label_extraInitializers), false);
        }
        ngOnInit() {
            this._subscription = this._service.account$.subscribe((account) => {
                // Update button state based on account
                if (account.address) {
                    this.loading = false;
                }
            });
        }
        ngOnDestroy() {
            this._subscription?.unsubscribe();
        }
        get displayLabel() {
            return this.label ?? 'Connect Wallet';
        }
        handleClick() {
            if (this.disabled || this.loading)
                return;
            this.loading = true;
            this._service.connect().catch(() => {
                this.loading = false;
            }).then(() => {
                this.loading = false;
            });
        }
    };
    __setFunctionName(_classThis, "ConnectButtonComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _disabled_decorators = [Input()];
        _size_decorators = [Input()];
        _label_decorators = [Input()];
        __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
        __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
        __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConnectButtonComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConnectButtonComponent = _classThis;
})();
export { ConnectButtonComponent };
//# sourceMappingURL=connect-button.component.js.map