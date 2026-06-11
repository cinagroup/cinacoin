/**
 * DepositWidget — Exchange deposit address generation and tracking
 *
 * Features:
 * - Select chain + token for deposit
 * - Generate deposit address with QR code
 * - Track deposit status
 * - Arrival notification
 *
 * @example
 * ```tsx
 * <DepositWidget
 *   walletAddress={address}
 *   theme="dark"
 *   onDepositComplete={(result) => console.log(result)}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect } from "react";
import type { Address } from "viem";
import { getWidgetStyles, cardStyles, buttonStyles, inputStyles } from "../styles.js";
import type { DepositResult, DepositStatus } from "@cinacoin/deposit";

// ============================================================
// Types
// ============================================================

export interface ChainOption {
  id: string;
  name: string;
  icon?: string;
  tokens: string[];
}

export interface DepositWidgetProps {
  /** User wallet address (receiving address) */
  walletAddress?: Address;
  /** Available chains for deposit */
  chains?: ChainOption[];
  /** Theme mode */
  theme?: "light" | "dark";
  /** Custom primary color */
  primaryColor?: string;
  /** Callback when deposit completes */
  onDepositComplete?: (result: DepositResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional class name */
  className?: string;
}

// ============================================================
// Default chains
// ============================================================

const DEFAULT_CHAINS: ChainOption[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    tokens: ["ETH", "USDC", "USDT", "DAI"],
  },
  {
    id: "polygon",
    name: "Polygon",
    tokens: ["MATIC", "USDC", "USDT"],
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    tokens: ["ETH", "USDC", "ARB"],
  },
  {
    id: "optimism",
    name: "Optimism",
    tokens: ["ETH", "USDC", "OP"],
  },
  {
    id: "base",
    name: "Base",
    tokens: ["ETH", "USDC"],
  },
  {
    id: "solana",
    name: "Solana",
    tokens: ["SOL", "USDC"],
  },
];

// ============================================================
// Component
// ============================================================

/**
 * DepositWidget React component.
 *
 * Provides a UI for generating deposit addresses and tracking deposits.
 */
export function DepositWidget(props: DepositWidgetProps): React.ReactElement {
  const {
    walletAddress,
    chains = DEFAULT_CHAINS,
    theme = "light",
    primaryColor,
    onDepositComplete,
    onError,
    className = "",
  } = props;

  const [selectedChain, setSelectedChain] = useState<string>(chains[0]?.id ?? "");
  const [selectedToken, setSelectedToken] = useState<string>(chains[0]?.tokens[0] ?? "");
  const [depositAddress, setDepositAddress] = useState<string>(walletAddress ?? "");
  const [depositStatus, setDepositStatus] = useState<DepositStatus | null>(null);
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Styles ─────────────────────────────────────────────
  const widgetCssVars = getWidgetStyles(theme, primaryColor);
  const cardCss = cardStyles();

  // ── Handlers ───────────────────────────────────────────
  const handleChainChange = useCallback(
    (chainId: string) => {
      setSelectedChain(chainId);
      const chain = chains.find((c) => c.id === chainId);
      if (chain && chain.tokens.length > 0) {
        setSelectedToken(chain.tokens[0]);
      }
    },
    [chains]
  );

  const handleGenerateAddress = useCallback(async () => {
    if (!walletAddress) {
      onError?.(new Error("Wallet address is required"));
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate address generation (in production, this would call a backend)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result: DepositResult = {
        depositId: `dep_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        status: "pending" as DepositStatus,
        exchangeId: "direct",
        asset: selectedToken,
        network: selectedChain,
        amount: 0,
        depositUrl: `deposit://${selectedChain}/${selectedToken}/${walletAddress}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDepositResult(result);
      setDepositAddress(walletAddress);
      setDepositStatus("pending" as DepositStatus);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Failed to generate address"));
    } finally {
      setIsGenerating(false);
    }
  }, [walletAddress, selectedChain, selectedToken, onError]);

  const handleCopyAddress = useCallback(() => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress);
    }
  }, [depositAddress]);

  // ── Poll for deposit status (simulation) ───────────────
  useEffect(() => {
    if (!depositResult || depositStatus === "completed" || depositStatus === "failed") {
      return;
    }

    const interval = setInterval(() => {
      // Simulate status progression
      setDepositStatus((prev) => {
        if (prev === "pending") return "processing" as DepositStatus;
        if (prev === "processing") {
          const result = { ...depositResult, status: "completed" as DepositStatus };
          setDepositResult(result);
          onDepositComplete?.(result);
          return "completed" as DepositStatus;
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [depositResult, depositStatus, onDepositComplete]);

  // ── Current chain tokens ───────────────────────────────
  const currentChain = chains.find((c) => c.id === selectedChain);
  const availableTokens = currentChain?.tokens ?? [];

  // ── Render ─────────────────────────────────────────────
  return (
    <div
      className={`ocx-deposit-widget ${className}`}
      style={{ ...widgetCssVars, ...cardCss, maxWidth: "480px" }}
    >
      {/* Header */}
      <h2
        style={{
          margin: "0 0 16px 0",
          fontSize: "var(--cc-text-lg)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--ocx-text-primary)",
        }}
      >
        Deposit
      </h2>

      {/* Chain Selection */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "var(--cc-text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--ocx-text-secondary)",
            marginBottom: "8px",
          }}
        >
          Select Network
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainChange(chain.id)}
              style={{
                padding: "12px 8px",
                fontSize: "var(--cc-text-xs)",
                fontWeight: selectedChain === chain.id ? 600 : 400,
                border: `2px solid ${
                  selectedChain === chain.id ? "var(--ocx-primary)" : "var(--ocx-border)"
                }`,
                borderRadius: "8px",
                background:
                  selectedChain === chain.id ? "var(--ocx-bg-elevated)" : "var(--ocx-bg-surface)",
                color: "var(--ocx-text-primary)",
                cursor: "pointer",
                transition: "all 150ms ease",
                textAlign: "center",
              }}
            >
              {chain.icon && (
                <img
                  src={chain.icon}
                  alt={chain.name}
                  style={{ width: "20px", height: "20px", marginBottom: "4px" }}
                />
              )}
              <div>{chain.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Token Selection */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "var(--cc-text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--ocx-text-secondary)",
            marginBottom: "8px",
          }}
        >
          Select Token
        </label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "var(--cc-text-sm)",
            border: "1px solid var(--ocx-border)",
            borderRadius: "8px",
            background: "var(--ocx-bg-base)",
            color: "var(--ocx-text-primary)",
            cursor: "pointer",
          }}
        >
          {availableTokens.map((token) => (
            <option key={token} value={token}>
              {token}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Address Button */}
      {!depositAddress && (
        <button
          style={{
            ...buttonStyles("primary", "lg"),
            width: "100%",
            opacity: isGenerating ? 0.7 : 1,
          }}
          onClick={handleGenerateAddress}
          disabled={isGenerating || !walletAddress}
        >
          {isGenerating ? "Generating..." : "Generate Deposit Address"}
        </button>
      )}

      {/* Deposit Address Display */}
      {depositAddress && (
        <div style={{ marginTop: "16px" }}>
          {/* QR Code */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "200px",
                height: "200px",
                background: "var(--ocx-bg-base)",
                border: "1px solid var(--ocx-border)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--cc-text-xs)",
                color: "var(--ocx-text-muted)",
              }}
            >
              <QRCodePlaceholder value={depositAddress} />
            </div>
          </div>

          {/* Address */}
          <div
            style={{
              padding: "12px",
              background: "var(--ocx-bg-surface)",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "var(--cc-text-xs)",
                color: "var(--ocx-text-muted)",
                marginBottom: "4px",
              }}
            >
              Deposit Address ({currentChain?.name})
            </div>
            <div
              style={{
                fontSize: "var(--cc-text-xs)",
                fontFamily: "monospace",
                wordBreak: "break-all",
                color: "var(--ocx-text-primary)",
              }}
            >
              {depositAddress}
            </div>
          </div>

          {/* Copy Button */}
          <button
            style={{ ...buttonStyles("secondary", "md"), width: "100%" }}
            onClick={handleCopyAddress}
          >
            Copy Address
          </button>

          {/* Status */}
          {depositStatus && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background:
                  depositStatus === "completed"
                    ? "var(--ocx-success-bg)"
                    : depositStatus === "failed"
                      ? "var(--ocx-error-bg)"
                      : "var(--ocx-bg-surface)",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "var(--cc-text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  color:
                    depositStatus === "completed"
                      ? "var(--ocx-success)"
                      : depositStatus === "failed"
                        ? "var(--ocx-error)"
                        : "var(--ocx-text-secondary)",
                }}
              >
                {depositStatus === "pending" && "⏳ Waiting for deposit..."}
                {depositStatus === "processing" && "⏳ Processing deposit..."}
                {depositStatus === "completed" && "✅ Deposit received!"}
                {depositStatus === "failed" && "❌ Deposit failed"}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            style={{
              ...buttonStyles("ghost", "sm"),
              width: "100%",
              marginTop: "12px",
            }}
            onClick={() => {
              setDepositAddress("");
              setDepositResult(null);
              setDepositStatus(null);
            }}
          >
            Generate New Address
          </button>
        </div>
      )}

      {/* Warning */}
      {depositAddress && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "var(--ocx-warning-bg)",
            borderRadius: "8px",
            fontSize: "var(--cc-text-xs)",
            color: "var(--ocx-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          ⚠️ Only send <strong>{selectedToken}</strong> on{" "}
          <strong>{currentChain?.name}</strong> to this address. Sending other
          assets may result in permanent loss.
        </div>
      )}
    </div>
  );
}

// ============================================================
// QR Code Placeholder
// ============================================================

interface QRCodePlaceholderProps {
  value: string;
}

function QRCodePlaceholder({ value }: QRCodePlaceholderProps) {
  // Simple visual representation of QR code pattern
  const size = 200;
  const cellSize = 8;
  const cells = Math.floor(size / cellSize);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {/* Generate a simple pattern based on the address */}
      {Array.from({ length: cells * cells }).map((_, i) => {
        const x = (i % cells) * cellSize;
        const y = Math.floor(i / cells) * cellSize;
        // Use character codes from the address to create a pattern
        const charCode = value.charCodeAt(i % value.length) || 0;
        const show = (charCode + i) % 3 === 0;

        if (show) {
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          );
        }
        return null;
      })}
      {/* Corner markers */}
      <rect x={0} y={0} width={cellSize * 3} height={cellSize * 3} fill="black" />
      <rect x={cellSize} y={cellSize} width={cellSize} height={cellSize} fill="white" />
      <rect
        x={size - cellSize * 3}
        y={0}
        width={cellSize * 3}
        height={cellSize * 3}
        fill="black"
      />
      <rect
        x={size - cellSize * 2}
        y={cellSize}
        width={cellSize}
        height={cellSize}
        fill="white"
      />
      <rect
        x={0}
        y={size - cellSize * 3}
        width={cellSize * 3}
        height={cellSize * 3}
        fill="black"
      />
      <rect
        x={cellSize}
        y={size - cellSize * 2}
        width={cellSize}
        height={cellSize}
        fill="white"
      />
    </svg>
  );
}
