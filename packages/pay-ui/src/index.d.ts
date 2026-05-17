/**
 * @cinaconnect/pay-ui
 *
 * CinaConnect Pay UI Components — Swap & On-Ramp widgets.
 *
 * Built with React + Web Components architecture.
 * Core logic is framework-agnostic (SwapWidgetCore, OnRampWidgetCore).
 *
 * @example
 * ```tsx
 * import { SwapWidget, OnRampWidget } from '@cinaconnect/pay-ui';
 *
 * // Swap widget
 * <SwapWidget
 *   chainId={1}
 *   walletAddress={address}
 *   supportedTokens={tokens}
 *   onSwapComplete={(receipt) => console.log(receipt.txHash)}
 * />
 *
 * // On-Ramp widget
 * <OnRampWidget
 *   destinationAddress={address}
 *   defaultFiatAmount={100}
 *   defaultFiatCurrency="USD"
 *   onComplete={(result) => console.log(result.orderId)}
 * />
 * ```
 */
export { SwapWidget } from "./SwapWidget.js.js";
export type { SwapWidgetProps } from "./types.js.js";
export { OnRampWidget } from "./OnRampWidget.js.js";
export type { OnRampWidgetProps } from "./types.js.js";
export { SwapWidgetCore } from "./SwapWidgetCore.js.js";
export { OnRampWidgetCore } from "./OnRampWidgetCore.js.js";
export type { SwapWidgetState, SwapWidgetCoreConfig, SwapWidgetCoreState, SlippageConfig, OnRampWidgetState, OnRampWidgetCoreConfig, OnRampWidgetCoreState, } from "./types.js.js";
export { colors, spacing, borderRadius, fontSize, fontWeight, shadows, transitions, zIndices, getWidgetStyles, buttonStyles, inputStyles, cardStyles, } from "./styles.js.js";
//# sourceMappingURL=index.d.ts.map