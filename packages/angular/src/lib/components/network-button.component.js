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
 * Button component showing the currently connected network/chain.
 *
 * ```html
 * <cina-network-button></cina-network-button>
 * ```
 */
let NetworkButtonComponent = (() => {
    let _classDecorators = [Component({
            selector: 'cina-network-button',
            template: `
    <div
      *ngIf="network && network.connected; else disconnected"
      class="cina-network-button"
    >
      <span class="cina-network-button__icon">⬡</span>
      <span class="cina-network-button__name">{{ network.name ?? 'Unknown' }}</span>
      <span
        *ngIf="network.chainId"
        class="cina-network-button__id"
        >Chain ID: {{ network.chainId }}</span
      >
    </div>
    <ng-template #disconnected>
      <span class="cina-network-button__disconnected">No network</span>
    </ng-template>
  `,
            styles: [
                `
      .cina-network-button {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: #0f172a;
        border-radius: 0.5rem;
        border: 1px solid #1e293b;
        color: #cbd5e1;
        font-size: 0.8125rem;
      }
      .cina-network-button__icon {
        color: #8b5cf6;
      }
      .cina-network-button__name {
        font-weight: 600;
      }
      .cina-network-button__id {
        color: #64748b;
        font-family: monospace;
      }
      .cina-network-button__disconnected {
        color: #475569;
        font-size: 0.8125rem;
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
    var NetworkButtonComponent = _classThis = class {
        constructor(_service) {
            this._service = _service;
            /** Button size: 'sm', 'md', or 'lg'. Defaults to 'md'. */
            this.size = __runInitializers(this, _size_initializers, 'md');
            this.network = (__runInitializers(this, _size_extraInitializers), null);
        }
        ngOnInit() {
            this._subscription = this._service.network$.subscribe((network) => (this.network = network));
        }
        ngOnDestroy() {
            this._subscription?.unsubscribe();
        }
    };
    __setFunctionName(_classThis, "NetworkButtonComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _size_decorators = [Input()];
        __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NetworkButtonComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NetworkButtonComponent = _classThis;
})();
export { NetworkButtonComponent };
//# sourceMappingURL=network-button.component.js.map