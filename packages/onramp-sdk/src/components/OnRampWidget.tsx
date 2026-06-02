/**
 * OnRampWidget — React Component
 *
 * A fully interactive on-ramp widget that lets users:
 * - Select fiat currency and amount
 * - Compare providers and pick the best quote
 * - Launch the selected provider's widget/popup
 * - Handle completion callbacks
 *
 * @example
 * ```tsx
 * <OnRampWidget
 *   aggregator={myAggregator}
 *   destinationAddress={walletAddress}
 *   defaultFiatAmount={100}
 *   onPurchaseComplete={(result) => console.log('Done!', result)}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import type {
  OnRampQuote,
  OnRampQuoteParams,
  OnRampResult,
  OnRampWidgetParams,
  OnRampProviderId,
  UserPreferences,
} from "../types.js";
import type { OnRampAggregator } from "../aggregator.js";

/* ── props ──────────────────────────────────────────────────────── */

export interface OnRampWidgetProps {
  /** OnRampAggregator instance */
  aggregator: OnRampAggregator;
  /** Destination wallet address */
  destinationAddress: `0x${string}`;
  /** Default fiat amount */
  defaultFiatAmount?: number;
  /** Default fiat currency */
  defaultFiatCurrency?: string;
  /** Default crypto token to buy */
  defaultCryptoToken?: string;
  /** User region (ISO 3166-1 alpha-2) */
  userRegion?: string;
  /** Chain ID for the destination */
  chainId?: number;
  /** User preferences for filtering */
  preferences?: UserPreferences;
  /** Enabled provider IDs (empty = all) */
  enabledProviders?: OnRampProviderId[];
  /** Callback when purchase completes */
  onPurchaseComplete?: (result: OnRampResult) => void;
  /** Callback when widget closes */
  onClose?: () => void;
  /** Custom CSS class */
  className?: string;
}

/* ── component ──────────────────────────────────────────────────── */

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY"];
const COMMON_TOKENS = ["ETH", "USDC", "USDT", "BTC", "SOL"];

export function OnRampWidget({
  aggregator,
  destinationAddress,
  defaultFiatAmount = 100,
  defaultFiatCurrency = "USD",
  defaultCryptoToken = "ETH",
  userRegion = "US",
  chainId = 1,
  preferences,
  enabledProviders,
  onPurchaseComplete,
  onClose,
  className,
}: OnRampWidgetProps): React.ReactElement {
  const [fiatAmount, setFiatAmount] = useState(defaultFiatAmount);
  const [fiatCurrency, setFiatCurrency] = useState(defaultFiatCurrency);
  const [cryptoToken, setCryptoToken] = useState(defaultCryptoToken);
  const [quotes, setQuotes] = useState<OnRampQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<OnRampQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quoteParams = useMemo<OnRampQuoteParams>(
    () => ({
      fiatCurrency,
      fiatAmount,
      cryptoToken,
      chainId,
      destinationAddress,
      userRegion,
    }),
    [fiatCurrency, fiatAmount, cryptoToken, chainId, destinationAddress, userRegion],
  );

  // Fetch quotes when params change
  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allQuotes = await aggregator.getQuotes(quoteParams);
        if (!cancelled) {
          // Apply preferences filter
          let filtered = allQuotes;
          if (preferences?.maxFeePercent !== undefined) {
            filtered = filtered.filter(
              (q) => q.fees.totalFeePercent <= preferences.maxFeePercent!,
            );
          }
          if (preferences?.maxDeliveryTimeMinutes !== undefined) {
            filtered = filtered.filter(
              (q) => q.estimatedTime <= preferences.maxDeliveryTimeMinutes!,
            );
          }
          if (preferences?.skipKyc) {
            filtered = filtered.filter((q) => !q.requiresKyc);
          }
          setQuotes(filtered);
          setSelectedQuote(filtered[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch quotes");
          setQuotes([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [aggregator, quoteParams, preferences]);

  const handleBuy = useCallback(async () => {
    if (!selectedQuote) return;

    const widgetParams: OnRampWidgetParams = {
      destinationAddress,
      defaultFiatAmount: fiatAmount,
      defaultFiatCurrency: fiatCurrency,
      defaultCryptoToken: cryptoToken,
      userRegion,
      enabledProviders: enabledProviders ?? [selectedQuote.provider],
    };

    const widgetUrl = aggregator.getWidgetUrl(widgetParams);
    if (!widgetUrl) {
      setError("Unable to generate widget URL");
      return;
    }

    // Open provider widget in popup
    const popup = window.open(
      widgetUrl,
      "CinacoinOnRamp",
      "width=480,height=720,scrollbars=yes",
    );

    // Listen for completion message
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "onramp_complete") {
        const result: OnRampResult = {
          ...event.data.result,
          provider: selectedQuote.provider,
        };
        onPurchaseComplete?.(result);
        window.removeEventListener("message", handleMessage);
      } else if (event.data?.type === "onramp_error") {
        setError(event.data.error);
        window.removeEventListener("message", handleMessage);
      }
    };
    window.addEventListener("message", handleMessage);

    // Poll for popup close
    const checkClose = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClose);
        window.removeEventListener("message", handleMessage);
        onClose?.();
      }
    }, 500);
  }, [
    selectedQuote, aggregator, destinationAddress,
    fiatAmount, fiatCurrency, cryptoToken, userRegion,
    enabledProviders, onPurchaseComplete, onClose,
  ]);

  /* ── render ─────────────────────────────────────────────────── */

  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Buy Crypto</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Input section */}
      <div style={{ padding: "16px 20px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", marginBottom: "6px", display: "block" }}>
          You pay
        </label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(Number(e.target.value))}
            min={1}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
            }}
          />
          <select
            value={fiatCurrency}
            onChange={(e) => setFiatCurrency(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              background: "#f9fafb",
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <label style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", marginBottom: "6px", display: "block" }}>
          You receive
        </label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <select
            value={cryptoToken}
            onChange={(e) => setCryptoToken(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              background: "#f9fafb",
            }}
          >
            {COMMON_TOKENS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Quote list */}
        {error && (
          <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}>
            <span style={{ fontSize: "14px" }}>Fetching best rates...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {quotes.map((q) => (
              <QuoteCard
                key={q.provider}
                quote={q}
                isSelected={selectedQuote?.provider === q.provider}
                onSelect={() => setSelectedQuote(q)}
              />
            ))}
            {quotes.length === 0 && !isLoading && (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#6b7280", fontSize: "13px" }}>
                No providers available for your region
              </div>
            )}
          </div>
        )}

        {/* Buy button */}
        <button
          onClick={handleBuy}
          disabled={!selectedQuote || isLoading}
          style={{
            width: "100%",
            padding: "12px",
            background: selectedQuote && !isLoading ? "#3b82f6" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: selectedQuote && !isLoading ? "pointer" : "not-allowed",
          }}
        >
          {isLoading ? "Loading..." : selectedQuote ? `Buy ${cryptoToken} via ${selectedQuote.providerName}` : "Select a provider"}
        </button>
      </div>
    </div>
  );
}

/* ── QuoteCard ──────────────────────────────────────────────────── */

interface QuoteCardProps {
  quote: OnRampQuote;
  isSelected: boolean;
  onSelect: () => void;
}

function QuoteCard({ quote, isSelected, onSelect }: QuoteCardProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        borderRadius: "10px",
        background: isSelected ? "#eff6ff" : "#fff",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: "14px" }}>{quote.providerName}</div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          {quote.fees.totalFeePercent}% fee · ~{quote.estimatedTime} min
          {quote.requiresKyc && " · KYC required"}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>
          {quote.cryptoAmount.toFixed(6)} {quote.cryptoToken}
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          ${quote.totalCost.toFixed(2)} total
        </div>
      </div>
    </button>
  );
}
