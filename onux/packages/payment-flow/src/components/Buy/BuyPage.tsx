import { useState, useCallback } from "react";
import type { Token, ProviderId, PaymentProvider } from "../../types";

// ---------------------------------------------------------------------------
// Default token list
// ---------------------------------------------------------------------------

const DEFAULT_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", chain: "ethereum", contractAddress: "", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", chain: "ethereum", contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
  { symbol: "USDT", name: "Tether", chain: "ethereum", contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
  { symbol: "MATIC", name: "Polygon", chain: "polygon", contractAddress: "", decimals: 18 },
  { symbol: "SOL", name: "Solana", chain: "solana", contractAddress: "", decimals: 9 },
];

const DEFAULT_PROVIDERS: PaymentProvider[] = [
  { id: "moonpay", name: "MoonPay", supportedChains: ["ethereum", "polygon", "arbitrum"], supportedTokens: ["ETH", "USDC", "MATIC"] },
  { id: "coinbase", name: "Coinbase Pay", supportedChains: ["ethereum", "base", "polygon"], supportedTokens: ["ETH", "USDC", "USDT"] },
  { id: "ramp", name: "Ramp Network", supportedChains: ["ethereum", "optimism", "arbitrum"], supportedTokens: ["ETH", "USDC"] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface BuyPageProps {
  /** Override default token list */
  tokens?: Token[];
  /** Override default provider list */
  providers?: PaymentProvider[];
  /** Called when the purchase is initiated */
  onBuy?: (params: { fiatAmount: string; currency: string; token: Token; providerId: ProviderId }) => void;
}

/**
 * Buy (onramp) page — lets users purchase crypto with fiat.
 *
 * Features:
 * - Fiat amount input
 * - Token selector (ETH, USDC, etc.)
 * - Provider selector (MoonPay, Coinbase Pay, Ramp)
 * - Processing states
 * - Completion confirmation
 */
export function BuyPage({ tokens = DEFAULT_TOKENS, providers = DEFAULT_PROVIDERS, onBuy }: BuyPageProps) {
  const [fiatAmount, setFiatAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(providers[0]?.id ?? "moonpay");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  const handleBuy = useCallback(() => {
    if (!fiatAmount || parseFloat(fiatAmount) <= 0) return;
    setStatus("processing");
    onBuy?.({ fiatAmount, currency, token: selectedToken, providerId: selectedProvider });
    // Simulate processing delay (replace with real provider callback)
    setTimeout(() => setStatus("success"), 2000);
  }, [fiatAmount, currency, selectedToken, selectedProvider, onBuy]);

  // Filter providers that support the selected token
  const compatibleProviders = providers.filter((p) =>
    p.supportedTokens.includes(selectedToken.symbol),
  );

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl bg-white/5 p-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Purchase Initiated</h2>
        <p className="text-gray-400 text-center mb-6">
          Your {selectedToken.symbol} purchase is being processed.
          <br />
          You&apos;ll receive {selectedToken.symbol} at your connected wallet once complete.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Make Another Purchase
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto rounded-2xl bg-white/5 p-6 backdrop-blur">
      <h2 className="text-xl font-bold text-white mb-6">Buy Crypto</h2>

      {/* Fiat amount */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">You Pay</label>
        <div className="flex items-center gap-2 bg-black/20 rounded-xl p-3">
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-white text-lg outline-none"
            min="0"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-black/30 text-white rounded-lg px-3 py-1 text-sm outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Token selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">You Receive</label>
        <div className="bg-black/20 rounded-xl p-3">
          <select
            value={selectedToken.symbol}
            onChange={(e) => {
              const token = tokens.find((t) => t.symbol === e.target.value);
              if (token) setSelectedToken(token);
            }}
            className="w-full bg-transparent text-white text-lg outline-none"
          >
            {tokens.map((t) => (
              <option key={t.symbol} value={t.symbol} className="bg-gray-800">
                {t.name} ({t.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Provider selector */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1">Payment Provider</label>
        <div className="grid grid-cols-3 gap-2">
          {compatibleProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`rounded-xl p-3 text-sm font-medium transition-colors ${
                selectedProvider === p.id
                  ? "bg-blue-600 text-white"
                  : "bg-black/20 text-gray-300 hover:bg-black/30"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Buy button */}
      <button
        onClick={handleBuy}
        disabled={!fiatAmount || parseFloat(fiatAmount) <= 0 || status === "processing"}
        className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
          !fiatAmount || parseFloat(fiatAmount) <= 0 || status === "processing"
            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
      >
        {status === "processing" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing…
          </span>
        ) : (
          `Buy ${selectedToken.symbol}`
        )}
      </button>
    </div>
  );
}
