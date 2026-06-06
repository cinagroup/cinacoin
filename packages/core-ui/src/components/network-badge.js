/**
 * NetworkBadge Web Component
 *
 * Small pill showing the current network name and icon.
 *
 * Properties:
 *   - name: network name (e.g., "Ethereum")
 *   - iconUrl: optional icon URL
 *
 * Usage: <ocx-network-badge name="Ethereum"></ocx-network-badge>
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
let NetworkBadge = (() => {
    let _classDecorators = [customElement('ocx-network-badge')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseLitElement;
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _iconUrl_decorators;
    let _iconUrl_initializers = [];
    let _iconUrl_extraInitializers = [];
    var NetworkBadge = _classThis = class extends _classSuper {
        static get styles() {
            return [
                super.hostStyles,
                css `
        :host {
          display: inline-flex;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: var(--ocx-space-1, 0.25rem);
          padding: var(--ocx-space-1, 0.25rem) var(--ocx-space-2, 0.5rem);
          background: var(--ocx-color-bg-card, #1E293B);
          border: 1px solid var(--ocx-color-border, #334155);
          border-radius: var(--ocx-radius-full, 9999px);
          font-size: var(--ocx-font-size-xs, 0.75rem);
          font-weight: var(--ocx-font-weight-medium, 500);
          color: var(--ocx-color-text-primary, #f8fafc);
          white-space: nowrap;
        }

        .icon {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon img {
          width: 12px;
          height: 12px;
        }
      `,
            ];
        }
        render() {
            return html `
      <span class="badge">
        ${this.iconUrl
                ? html `<span class="icon"><img src="${this.iconUrl}" alt="" /></span>`
                : html `<span class="icon">⛓</span>`}
        ${this.name}
      </span>
    `;
        }
        constructor() {
            super(...arguments);
            this.name = __runInitializers(this, _name_initializers, '');
            this.iconUrl = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _iconUrl_initializers, ''));
            __runInitializers(this, _iconUrl_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "NetworkBadge");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        _name_decorators = [property()];
        _iconUrl_decorators = [property()];
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _iconUrl_decorators, { kind: "field", name: "iconUrl", static: false, private: false, access: { has: obj => "iconUrl" in obj, get: obj => obj.iconUrl, set: (obj, value) => { obj.iconUrl = value; } }, metadata: _metadata }, _iconUrl_initializers, _iconUrl_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NetworkBadge = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NetworkBadge = _classThis;
})();
export { NetworkBadge };
//# sourceMappingURL=network-badge.js.map