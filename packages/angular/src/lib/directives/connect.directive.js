var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Directive, HostListener, Input } from '@angular/core';
/**
 * Directive that automatically triggers wallet connection on click.
 *
 * Apply to any element to make it a connect trigger.
 *
 * ```html
 * <button cinaConnect>Connect Wallet</button>
 * <div cinaConnect [connectorId]="'walletconnect'">Connect via WalletConnect</div>
 * ```
 */
let ConnectDirective = (() => {
    let _classDecorators = [Directive({
            selector: '[cinaConnect]',
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _connectorId_decorators;
    let _connectorId_initializers = [];
    let _connectorId_extraInitializers = [];
    let _disabled_decorators;
    let _disabled_initializers = [];
    let _disabled_extraInitializers = [];
    let _onClick_decorators;
    var ConnectDirective = _classThis = class {
        constructor(_service, _el, _renderer) {
            this._service = (__runInitializers(this, _instanceExtraInitializers), _service);
            this._el = _el;
            this._renderer = _renderer;
            /** Optional connector ID to use for connection. */
            this.connectorId = __runInitializers(this, _connectorId_initializers, void 0);
            /** Whether the directive is disabled. */
            this.disabled = (__runInitializers(this, _connectorId_extraInitializers), __runInitializers(this, _disabled_initializers, false));
            __runInitializers(this, _disabled_extraInitializers);
            this._service = _service;
            this._el = _el;
            this._renderer = _renderer;
            this._renderer.setStyle(this._el.nativeElement, 'cursor', 'pointer');
        }
        /**
         * Handle click events by initiating a wallet connection.
         *
         * @param event - The click event.
         */
        async onClick(event) {
            if (this.disabled) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            event.preventDefault();
            try {
                await this._service.connect(this.connectorId);
            }
            catch (error) {
                console.error('[cinaConnect] Connection failed:', error);
            }
        }
    };
    __setFunctionName(_classThis, "ConnectDirective");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _connectorId_decorators = [Input('cinaConnect')];
        _disabled_decorators = [Input('cinaConnectDisabled')];
        _onClick_decorators = [HostListener('click', ['$event'])];
        __esDecorate(_classThis, null, _onClick_decorators, { kind: "method", name: "onClick", static: false, private: false, access: { has: obj => "onClick" in obj, get: obj => obj.onClick }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _connectorId_decorators, { kind: "field", name: "connectorId", static: false, private: false, access: { has: obj => "connectorId" in obj, get: obj => obj.connectorId, set: (obj, value) => { obj.connectorId = value; } }, metadata: _metadata }, _connectorId_initializers, _connectorId_extraInitializers);
        __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConnectDirective = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConnectDirective = _classThis;
})();
export { ConnectDirective };
//# sourceMappingURL=connect.directive.js.map