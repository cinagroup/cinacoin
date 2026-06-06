import React from "react";
import { DepositRequest, DepositResult } from "../types";
export interface DepositButtonProps {
    /** Label text for the button. Default: "Deposit". */
    label?: string;
    /** Optional icon element to display before the label. */
    icon?: React.ReactNode;
    /** Deposit parameters. */
    request: Omit<DepositRequest, "amount"> & {
        amount: number;
    };
    /** Callback when deposit is successfully initiated. */
    onDepositInitiated?: (result: DepositResult) => void;
    /** Additional CSS class name. */
    className?: string;
    /** Override inline styles. */
    style?: React.CSSProperties;
}
/**
 * Quick deposit button — initiates a deposit flow with pre-filled parameters.
 *
 * @example
 * ```tsx
 * <DepositButton
 *   request={{
 *     exchangeId: "binance",
 *     asset: "USDC",
 *     network: "base",
 *     amount: 100,
 *   }}
 *   onDepositInitiated={(result) => console.log("Deposit:", result.depositId)}
 * />
 * ```
 */
export declare const DepositButton: React.FC<DepositButtonProps>;
//# sourceMappingURL=DepositButton.d.ts.map