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
import { Pipe } from '@angular/core';
/**
 * Formats a balance from wei (or smallest unit) to a human-readable ETH value.
 *
 * ```html
 * <p>Balance: {{ balance | cinaBalance }}</p>
 * ```
 *
 * @usageNotes
 * Specify the number of decimal places to display:
 * ```html
 * <p>{{ balance | cinaBalance: 2 }}</p> <!-- 1.23 ETH -->
 * <p>{{ balance | cinaBalance: 6 }}</p> <!-- 1.234567 ETH -->
 * ```
 *
 * Supports input as string (wei), number, or bigint.
 */
let BalancePipe = (() => {
    let _classDecorators = [Pipe({ name: 'cinaBalance' })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BalancePipe = _classThis = class {
        /**
         * Transform a wei balance to a human-readable ETH string.
         *
         * @param value - Balance in wei as string, number, or bigint.
         * @param decimals - Number of decimal places. Defaults to 4.
         * @returns Formatted balance string with ETH suffix, or empty string.
         */
        transform(value, decimals) {
            if (value == null || value === '' || value === '0')
                return '0 ETH';
            let wei;
            try {
                if (typeof value === 'bigint') {
                    wei = value;
                }
                else if (typeof value === 'number') {
                    wei = BigInt(Math.floor(value));
                }
                else {
                    // Handle string input — strip any non-numeric characters
                    const cleaned = String(value).replace(/[^0-9-]/g, '');
                    if (!cleaned || cleaned === '-')
                        return '0 ETH';
                    wei = BigInt(cleaned);
                }
            }
            catch {
                return '0 ETH';
            }
            if (wei === 0n)
                return '0 ETH';
            const ethWei = BalancePipe.WEI_PER_ETH;
            const whole = wei / ethWei;
            const remainder = wei % ethWei;
            const decimalsToUse = decimals ?? BalancePipe.DEFAULT_DECIMALS;
            if (remainder === 0n) {
                return `${whole} ETH`;
            }
            // Format the fractional part with proper zero-padding
            const remainderStr = remainder.toString().padStart(18, '0');
            const truncated = remainderStr.slice(0, decimalsToUse);
            // Remove trailing zeros for cleaner output
            const trimmedTruncated = truncated.replace(/0+$/, '');
            const fractionPart = trimmedTruncated.length > 0 ? `.${trimmedTruncated}` : '';
            return `${whole}${fractionPart} ETH`;
        }
    };
    __setFunctionName(_classThis, "BalancePipe");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BalancePipe = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    /** Default decimals for the display. */
    _classThis.DEFAULT_DECIMALS = 4;
    /** Wei per ETH (10^18). */
    _classThis.WEI_PER_ETH = BigInt('1000000000000000000');
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BalancePipe = _classThis;
})();
export { BalancePipe };
//# sourceMappingURL=balance.pipe.js.map