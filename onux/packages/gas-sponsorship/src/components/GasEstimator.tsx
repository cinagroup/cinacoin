import type { FC } from "react";
import type { GasEstimate, SponsorshipConfig } from "../types";

// ---------------------------------------------------------------------------
// Styles (inline to avoid bundling CSS dependencies)
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GasEstimatorProps {
  /** Gas estimate data from GasSponsor. */
  estimate: GasEstimate;
  /** Optional sponsorship config — when provided, shows sponsorship status. */
  sponsorshipConfig?: SponsorshipConfig | null;
  /** Current paymaster balance (wei) — shows low-balance warning if threshold set. */
  paymasterBalanceWei?: bigint;
  /** Native token symbol (auto-filled from estimate chain). */
  tokenSymbol?: string;
}

/**
 * Displays estimated gas cost in native token and USD,
 * sponsorship availability, and paymaster balance status.
 */
export const GasEstimator: FC<GasEstimatorProps> = ({
  estimate,
  sponsorshipConfig,
  paymasterBalanceWei,
  tokenSymbol = "ETH",
}) => {
  const nativeCost = formatEther(estimate.estimatedCostWei);
  const isSponsorAvailable = sponsorshipConfig?.sponsorGas === true;
  const isBalanceLow =
    sponsorshipConfig?.balanceThreshold !== undefined &&
    paymasterBalanceWei !== undefined &&
    paymasterBalanceWei < sponsorshipConfig.balanceThreshold;

  return (
    <div style={styles.container}>
      <div style={styles.title}>⛽ Gas Estimate</div>

      {/* Gas limits */}
      <GasRow label="Verification Gas" value={formatGas(estimate.verificationGasLimit)} />
      <GasRow label="Call Gas" value={formatGas(estimate.callGasLimit)} />
      <GasRow label="Pre-Verification" value={formatGas(estimate.preVerificationGas)} />

      <div style={styles.divider} />

      {/* Total */}
      <div style={styles.totalRow}>
        <span>Total</span>
        <span>
          {nativeCost} {tokenSymbol}
          {estimate.estimatedCostUsd > 0 && (
            <span style={styles.usdText}> (${estimate.estimatedCostUsd.toFixed(2)})</span>
          )}
        </span>
      </div>

      <div style={styles.divider} />

      {/* Sponsorship badge */}
      {isSponsorAvailable ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Badge style={styles.badgeGreen}>✓ Sponsorable</Badge>
          {isBalanceLow ? (
            <Badge style={styles.badgeAmber}>⚠ Low Paymaster Balance</Badge>
          ) : (
            <Badge style={styles.badgeGreen}>● Paymaster Active</Badge>
          )}
        </div>
      ) : (
        <Badge style={styles.badgeRed}>✗ Not Sponsorable</Badge>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface GasRowProps {
  label: string;
  value: string;
}

const GasRow: FC<GasRowProps> = ({ label, value }) => (
  <div style={styles.row}>
    <span>{label}</span>
    <span style={styles.value}>{value}</span>
  </div>
);

interface BadgeProps {
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Badge: FC<BadgeProps> = ({ style, children }) => (
  <span style={{ ...styles.badge, ...style }}>{children}</span>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format wei to a short ETH-like string. */
function formatEther(wei: bigint): string {
  const divisor = 10n ** 18n;
  const whole = wei / divisor;
  const frac = wei % divisor;
  const fracStr = frac.toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${fracStr}`;
}

/** Format gas units with commas. */
function formatGas(gas: bigint): string {
  return gas.toLocaleString();
}
