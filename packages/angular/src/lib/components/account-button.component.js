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
 * Button component showing the current account with disconnect capability.
 *
 * ```html
 * <cina-account-button></cina-account-button>
 * <cina-account-button *ngIf="account$ | async as account"></cina-account-button>
 * ```
 */
let AccountButtonComponent = (() => {
    let _classDecorators = [Component({
            selector: 'cina-account-button',
            template: `
    <div
      *ngIf="account && account.address; else connectPrompt"
      class="cina-account-button"
    >
      <button
        class="cina-account-button__address"
        [class.cina-account-button--size-sm]="size === 'sm'"
        [class.cina-account-button--size-md]="size === 'md'"
        [class.cina-account-button--size-lg]="size === 'lg'"
        (click)="toggleDropdown()"
      >
        <span class="cina-account-button__dot"></span>
        {{ account.address | slice: 0: 6 }}...{{ account.address | slice: -4 }}
      </button>
      <button
        class="cina-account-button__disconnect"
        (click)="disconnect()"
        title="Disconnect"
      >
        ✕
      </button>
    </div>
    <ng-template #connectPrompt>
      <span class="cina-account-button__placeholder">Not connected</span>
    </ng-template>
  `,
            styles: [
                `
      .cina-account-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: #1e293b;
        border-radius: 0.75rem;
        border: 1px solid #334155;
      }
      .cina-account-button__address {
        background: none;
        border: none;
        color: #e2e8f0;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-family: monospace;
      }
      .cina-account-button__disconnect {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 0.875rem;
        padding: 0.125rem;
        line-height: 1;
      }
      .cina-account-button__disconnect:hover {
        color: #ef4444;
      }
      .cina-account-button__dot {
        display: inline-block;
        width: 0.5rem;
        height: 0.5rem;
        background: #22c55e;
        border-radius: 50%;
      }
      .cina-account-button__placeholder {
        color: #64748b;
        font-size: 0.875rem;
      }
      .cina-account-button--size-sm {
        font-size: 0.75rem;
      }
      .cina-account-button--size-md {
        font-size: 0.875rem;
      }
      .cina-account-button--size-lg {
        font-size: 1rem;
      }
    `,
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _size_decorators;
    let _size_initializers = [];
    let _size_extraInitializers = [];
    var AccountButtonComponent = _classThis = class {
        constructor(_service) {
            this._service = _service;
            /** Button size: 'sm', 'md', or 'lg'. Defaults to 'md'. */
            this.size = __runInitializers(this, _size_initializers, 'md');
            this.account = (__runInitializers(this, _size_extraInitializers), null);
        }
        ngOnInit() {
            this._subscription = this._service.account$.subscribe((account) => (this.account = account));
        }
        ngOnDestroy() {
            this._subscription?.unsubscribe();
        }
        toggleDropdown() {
            // Future: open account dropdown with copy address, switch network, etc.
        }
        disconnect() {
            this._service.disconnect().catch(console.error);
        }
    };
    __setFunctionName(_classThis, "AccountButtonComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _size_decorators = [Input()];
        __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AccountButtonComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AccountButtonComponent = _classThis;
})();
export { AccountButtonComponent };
//# sourceMappingURL=account-button.component.js.map