import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ---------------------------------------------------------------------------
// Styles (inline to avoid bundling CSS dependencies)
// ---------------------------------------------------------------------------
const styles = {
    container: {
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#fff",
        maxWidth: "400px",
    },
    title: {
        fontSize: "14px",
        fontWeight: 600,
        color: "#1e293b",
        marginBottom: "12px",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        fontSize: "13px",
        color: "#475569",
    },
    value: {
        fontWeight: 500,
        color: "#0f172a",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
    },
    divider: {
        borderTop: "1px solid #e2e8f0",
        margin: "8px 0",
    },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
    },
    badgeGreen: {
        backgroundColor: "#dcfce7",
        color: "#166534",
    },
    badgeRed: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
    },
    badgeAmber: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
    },
    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0 0",
        fontSize: "14px",
        fontWeight: 600,
        color: "#0f172a",
    },
    usdText: {
        fontSize: "12px",
        color: "#64748b",
        fontWeight: 400,
    },
};
/**
 * Displays estimated gas cost in native token and USD,
 * sponsorship availability, and paymaster balance status.
 */
export const GasEstimator = ({ estimate, sponsorshipConfig, paymasterBalanceWei, tokenSymbol = "ETH", }) => {
    const nativeCost = formatEther(estimate.estimatedCostWei);
    const isSponsorAvailable = sponsorshipConfig?.sponsorGas === true;
    const isBalanceLow = sponsorshipConfig?.balanceThreshold !== undefined &&
        paymasterBalanceWei !== undefined &&
        paymasterBalanceWei < sponsorshipConfig.balanceThreshold;
    return (_jsxs("div", { style: styles.container, children: [_jsx("div", { style: styles.title, children: "\u26FD Gas Estimate" }), _jsx(GasRow, { label: "Verification Gas", value: formatGas(estimate.verificationGasLimit) }), _jsx(GasRow, { label: "Call Gas", value: formatGas(estimate.callGasLimit) }), _jsx(GasRow, { label: "Pre-Verification", value: formatGas(estimate.preVerificationGas) }), _jsx("div", { style: styles.divider }), _jsxs("div", { style: styles.totalRow, children: [_jsx("span", { children: "Total" }), _jsxs("span", { children: [nativeCost, " ", tokenSymbol, estimate.estimatedCostUsd > 0 && (_jsxs("span", { style: styles.usdText, children: [" ($", estimate.estimatedCostUsd.toFixed(2), ")"] }))] })] }), _jsx("div", { style: styles.divider }), isSponsorAvailable ? (_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Badge, { style: styles.badgeGreen, children: "\u2713 Sponsorable" }), isBalanceLow ? (_jsx(Badge, { style: styles.badgeAmber, children: "\u26A0 Low Paymaster Balance" })) : (_jsx(Badge, { style: styles.badgeGreen, children: "\u25CF Paymaster Active" }))] })) : (_jsx(Badge, { style: styles.badgeRed, children: "\u2717 Not Sponsorable" }))] }));
};
const GasRow = ({ label, value }) => (_jsxs("div", { style: styles.row, children: [_jsx("span", { children: label }), _jsx("span", { style: styles.value, children: value })] }));
const Badge = ({ style, children }) => (_jsx("span", { style: { ...styles.badge, ...style }, children: children }));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Format wei to a short ETH-like string. */
function formatEther(wei) {
    const divisor = 10n ** 18n;
    const whole = wei / divisor;
    const frac = wei % divisor;
    const fracStr = frac.toString().padStart(18, "0").slice(0, 6);
    return `${whole}.${fracStr}`;
}
/** Format gas units with commas. */
function formatGas(gas) {
    return gas.toLocaleString();
}
//# sourceMappingURL=GasEstimator.js.map