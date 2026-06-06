/**
 * SwapWidget — React component for token swapping.
 *
 * Features:
 * - Token pair selection with swap button
 * - Amount input with real-time quote fetching
 * - Slippage settings modal
 * - Route display showing DEX path
 * - Execute swap with transaction status
 * - Success/error states
 *
 * @example
 * ```tsx
 * <SwapWidget
 *   chainId={1}
 *   walletAddress={address}
 *   supportedTokens={tokens}
 *   defaultFromToken={USDC}
 *   defaultToToken={ETH}
 *   theme="dark"
 *   onSwapComplete={(receipt) => console.log(receipt.txHash)}
 * />
 * ```
 */
import React from "react";
import type { SwapWidgetProps } from "./types.js";
export { SwapWidgetCore } from "./SwapWidgetCore.js";
/**
 * SwapWidget React component.
 *
 * Built with React + Web Components architecture.
 * The core logic is in SwapWidgetCore (framework-agnostic).
 */
export declare function SwapWidget(props: SwapWidgetProps): React.ReactElement;
//# sourceMappingURL=SwapWidget.d.ts.map