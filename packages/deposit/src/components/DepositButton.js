import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useDeposit } from "../hooks/useDeposit";
/** Inline styles for portability. */
const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #0f3460, #16213e)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.1s, box-shadow 0.2s",
};
const btnDisabledStyle = {
    ...btnStyle,
    opacity: 0.5,
    cursor: "not-allowed",
};
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
export const DepositButton = ({ label = "Deposit", icon, request, onDepositInitiated, className, style, }) => {
    const { isLoading, initiateDeposit, error } = useDeposit();
    const handleClick = async () => {
        try {
            const result = await initiateDeposit(request);
            onDepositInitiated?.(result);
            if (result.depositUrl) {
                window.open(result.depositUrl, "_blank", "noopener,noreferrer");
            }
        }
        catch {
            // Error captured in hook state
        }
    };
    return (_jsxs("span", { children: [_jsxs("button", { onClick: handleClick, disabled: isLoading, className: className, style: isLoading || !!error ? btnDisabledStyle : { ...btnStyle, ...style }, "aria-label": `Deposit ${request.amount} ${request.asset} via ${request.exchangeId}`, children: [icon, isLoading ? "Processing…" : label] }), error && (_jsx("span", { style: { color: "#ff6b6b", fontSize: 12, marginLeft: 8 }, children: error.message }))] }));
};
//# sourceMappingURL=DepositButton.js.map