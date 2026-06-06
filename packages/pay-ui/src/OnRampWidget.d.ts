/**
 * OnRampWidget — React component for fiat-to-crypto on-ramping.
 *
 * Features:
 * - Fiat amount input
 * - Currency selection (USD, EUR, GBP, CNY, etc.)
 * - Provider comparison table
 * - Provider selection
 * - Provider redirect to complete purchase
 * - Transaction status display
 *
 * @example
 * ```tsx
 * <OnRampWidget
 *   destinationAddress={address}
 *   defaultFiatAmount={100}
 *   defaultFiatCurrency="USD"
 *   userRegion="US"
 *   theme="dark"
 *   onComplete={(result) => console.log(result.orderId)}
 * />
 * ```
 */
import React from "react";
import type { OnRampWidgetProps } from "./types.js";
export { OnRampWidgetCore } from "./OnRampWidgetCore.js";
/**
 * OnRampWidget React component.
 *
 * Built with React + Web Components architecture.
 * The core logic is in OnRampWidgetCore (framework-agnostic).
 */
export declare function OnRampWidget(props: OnRampWidgetProps): React.ReactElement;
//# sourceMappingURL=OnRampWidget.d.ts.map