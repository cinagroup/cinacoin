/**
 * UnifiedPayment — Tab-based payment component
 *
 * Provides a unified interface for Buy (onramp), Swap, and Deposit operations.
 * Integrates existing OnRampWidget and SwapWidget with a tab navigation system.
 *
 * @example
 * ```tsx
 * <UnifiedPayment
 *   chainId={1}
 *   walletAddress={address}
 *   defaultTab="buy"
 *   theme="dark"
 *   onPaymentComplete={(type, result) => console.log(type, result)}
 * />
 * ```
 */

import React, { useState } from "react";
import type { Address } from "viem";
import { SwapWidget } from "../SwapWidget.js";
import { OnRampWidget } from "../OnRampWidget.js";
import { getWidgetStyles, cardStyles, buttonStyles } from "../styles.js";
import type { SwapReceipt } from "@cinacoin/swap-sdk";
import type { OnRampResult, OnRampProviderId, TokenInfo } from "@cinacoin/onramp-sdk";

// ============================================================
// Types
// ============================================================

export type PaymentTab = "buy" | "swap" | "deposit";

export interface UnifiedPaymentProps {
  /** Chain ID for swap operations */
  chainId: number;
  /** User wallet address */
  walletAddress?: Address;
  /** Default active tab */
  defaultTab?: PaymentTab;
  /** Supported tokens for swap */
  supportedTokens?: TokenInfo[];
  /** Default fiat amount for buy */
  defaultFiatAmount?: number;
  /** Default fiat currency for buy */
  defaultFiatCurrency?: string;
  /** Default crypto token */
  defaultCryptoToken?: string;
  /** User region for onramp */
  userRegion?: string;
  /** Enabled onramp providers */
  enabledProviders?: OnRampProviderId[];
  /** Theme mode */
  theme?: "light" | "dark";
  /** Custom primary color */
  primaryColor?: string;
  /** Callback when any payment completes */
  onPaymentComplete?: (type: PaymentTab, result: SwapReceipt | OnRampResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional class name */
  className?: string;
}

// ============================================================
// Styles
// ============================================================

const tabStyles = {
  container: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    background: "var(--ocx-bg-surface)",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  tab: {
    flex: 1,
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 150ms ease",
    background: "transparent",
    color: "var(--ocx-text-secondary)",
  },
  tabActive: {
    background: "var(--ocx-bg-base)",
    color: "var(--ocx-text-primary)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
};

// ============================================================
// Component
// ============================================================

/**
 * UnifiedPayment React component.
 *
 * Provides tabbed interface for Buy, Swap, and Deposit operations.
 */
export function UnifiedPayment(props: UnifiedPaymentProps): React.ReactElement {
  const {
    chainId,
    walletAddress,
    defaultTab = "buy",
    supportedTokens = [],
    defaultFiatAmount,
    defaultFiatCurrency = "USD",
    defaultCryptoToken = "ETH",
    userRegion = "US",
    enabledProviders,
    theme = "light",
    primaryColor,
    onPaymentComplete,
    onError,
    className = "",
  } = props;

  const [activeTab, setActiveTab] = useState<PaymentTab>(defaultTab);

  // ── Styles ─────────────────────────────────────────────
  const widgetCssVars = getWidgetStyles(theme, primaryColor);
  const cardCss = cardStyles();

  // ── Handlers ───────────────────────────────────────────
  const handleSwapComplete = (receipt: SwapReceipt) => {
    onPaymentComplete?.("swap", receipt);
  };

  const handleBuyComplete = (result: OnRampResult) => {
    onPaymentComplete?.("buy", result);
  };

  const handleError = (error: Error) => {
    onError?.(error);
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div
      className={`ocx-unified-payment ${className}`}
      style={{ ...widgetCssVars, ...cardCss, maxWidth: "480px" }}
    >
      {/* Header */}
      <h2
        style={{
          margin: "0 0 16px 0",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--ocx-text-primary)",
        }}
      >
        Payment
      </h2>

      {/* Tab Navigation */}
      <div style={tabStyles.container}>
        <button
          style={{
            ...tabStyles.tab,
            ...(activeTab === "buy" ? tabStyles.tabActive : {}),
          }}
          onClick={() => setActiveTab("buy")}
        >
          Buy
        </button>
        <button
          style={{
            ...tabStyles.tab,
            ...(activeTab === "swap" ? tabStyles.tabActive : {}),
          }}
          onClick={() => setActiveTab("swap")}
        >
          Swap
        </button>
        <button
          style={{
            ...tabStyles.tab,
            ...(activeTab === "deposit" ? tabStyles.tabActive : {}),
          }}
          onClick={() => setActiveTab("deposit")}
        >
          Deposit
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "buy" && (
        <OnRampWidget
          destinationAddress={walletAddress ?? "0x0000000000000000000000000000000000000000"}
          defaultFiatAmount={defaultFiatAmount}
          defaultFiatCurrency={defaultFiatCurrency}
          defaultCryptoToken={defaultCryptoToken}
          userRegion={userRegion}
          enabledProviders={enabledProviders}
          theme={theme}
          primaryColor={primaryColor}
          onComplete={handleBuyComplete}
          onError={handleError}
        />
      )}

      {activeTab === "swap" && (
        <SwapWidget
          chainId={chainId}
          walletAddress={walletAddress}
          supportedTokens={supportedTokens}
          theme={theme}
          primaryColor={primaryColor}
          onSwapComplete={handleSwapComplete}
          onError={handleError}
        />
      )}

      {activeTab === "deposit" && (
        <DepositPlaceholder
          walletAddress={walletAddress}
          theme={theme}
        />
      )}
    </div>
  );
}

// ============================================================
// Deposit Placeholder (to be replaced with DepositWidget)
// ============================================================

interface DepositPlaceholderProps {
  walletAddress?: Address;
  theme?: "light" | "dark";
}

function DepositPlaceholder({ walletAddress, theme }: DepositPlaceholderProps) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "var(--ocx-text-secondary)",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏦</div>
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--ocx-text-primary)",
        }}
      >
        Deposit from Exchange
      </h3>
      <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
        Generate deposit addresses and track incoming transfers from major exchanges.
      </p>
      {walletAddress && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "var(--ocx-bg-surface)",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "monospace",
            wordBreak: "break-all",
          }}
        >
          {walletAddress}
        </div>
      )}
    </div>
  );
}
