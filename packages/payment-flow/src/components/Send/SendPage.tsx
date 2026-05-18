import { useState, useCallback } from "react";
import type { Token, ChainId } from "../../types";

// ---------------------------------------------------------------------------
// Default token list
// ---------------------------------------------------------------------------

const DEFAULT_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", chain: "ethereum", contractAddress: "", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", chain: "ethereum", contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
  { symbol: "USDT", name: "Tether", chain: "ethereum", contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
  { symbol: "MATIC", name: "Polygon", chain: "polygon", contractAddress: "", decimals: 18 },
];

const NETWORK_FEE_ESTIMATES: Record<ChainId, string> = {
  ethereum: "~$4.20",
  polygon: "~$0.01",
  arbitrum: "~$0.15",
  optimism: "~$0.10",
  base: "~$0.05",
  solana: "~$0.001",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface SendPageProps {
  tokens?: Token[];
  onSend?: (params: { recipientAddress: string; token: Token; amount: string; chain: ChainId }) => void;
}

/**
 * Send page — transfer tokens to any on-chain address.
 *
 * Features:
 * - Recipient address input
 * - Token selector + amount
 * - Network fee estimate
 * - Confirmation screen
 * - Transaction status (pending/confirmed/failed)
 */
export function SendPage({ tokens = DEFAULT_TOKENS, onSend }: SendPageProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "confirm" | "status">("input");
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | "failed">("pending");
  const [txHash, setTxHash] = useState("");

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientAddress) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(recipientAddress);
  const isAmountValid = parseFloat(amount) > 0;
  const canProceed = isValidAddress && isAmountValid && recipientAddress.length > 0;

  const estimatedFee = NETWORK_FEE_ESTIMATES[selectedToken.chain] ?? "~$0.10";

  const handleConfirm = useCallback(() => {
    setStep("confirm");
  }, []);

  const handleSend = useCallback(() => {
    setStep("status");
    setTxStatus("pending");
    const hash = `0x${Math.random().toString(16).slice(2, 64)}`;
    setTxHash(hash);
    onSend?.({
      recipientAddress,
      token: selectedToken,
      amount,
      chain: selectedToken.chain,
    });

    // Simulate chain confirmation
    setTimeout(() => setTxStatus("confirmed"), 3000);
  }, [recipientAddress, selectedToken, amount, onSend]);

  const handleReset = useCallback(() => {
    setRecipientAddress("");
    setAmount("");
    setSelectedToken(tokens[0]);
    setStep("input");
    setTxStatus("pending");
    setTxHash("");
  }, [tokens]);

  // ------------------------------------------------------------------
  // Status view
  // ------------------------------------------------------------------

  if (step === "status") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl bg-white/5 p-8">
        {txStatus === "pending" && (
          <>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Sending…</h2>
            <p className="text-gray-400 text-sm mb-4">Waiting for network confirmation</p>
          </>
        )}
        {txStatus === "confirmed" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Transaction Confirmed</h2>
            <p className="text-gray-400 text-sm mb-2">
              {amount} {selectedToken.symbol} sent to
            </p>
            <code className="bg-black/30 text-green-400 px-3 py-1 rounded text-xs mb-4 break-all">
              {recipientAddress}
            </code>
            <p className="text-gray-500 text-xs mb-6 break-all max-w-xs">
              Tx: {txHash}
            </p>
          </>
        )}
        {txStatus === "failed" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Transaction Failed</h2>
            <p className="text-gray-400 text-sm mb-4">Something went wrong. Please try again.</p>
          </>
        )}
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Send Again
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Confirmation screen
  // ------------------------------------------------------------------

  if (step === "confirm") {
    return (
      <div className="max-w-md mx-auto rounded-2xl bg-white/5 p-6 backdrop-blur">
        <h2 className="text-xl font-bold text-white mb-6">Confirm Transaction</h2>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">To</span>
            <code className="text-white text-xs break-all max-w-[200px]">{recipientAddress}</code>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Amount</span>
            <span className="text-white font-medium">{amount} {selectedToken.symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee</span>
            <span className="text-yellow-400">{estimatedFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network</span>
            <span className="text-white capitalize">{selectedToken.chain}</span>
          </div>
          <hr className="border-gray-700" />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-300">Total</span>
            <span className="text-white">{amount} {selectedToken.symbol}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("input")}
            className="flex-1 py-3 rounded-xl font-medium bg-black/20 text-gray-300 hover:bg-black/30 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Confirm &amp; Send
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Input screen
  // ------------------------------------------------------------------

  return (
    <div className="max-w-md mx-auto rounded-2xl bg-white/5 p-6 backdrop-blur">
      <h2 className="text-xl font-bold text-white mb-6">Send</h2>

      {/* Recipient address */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="0x… or Solana address"
          className={`w-full bg-black/20 text-white rounded-xl p-3 outline-none transition-colors ${
            recipientAddress.length > 0 && !isValidAddress ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-blue-600"
          }`}
        />
        {recipientAddress.length > 0 && !isValidAddress && (
          <p className="text-red-400 text-xs mt-1">Invalid address format</p>
        )}
      </div>

      {/* Token + Amount */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Amount</label>
        <div className="flex items-center gap-2 bg-black/20 rounded-xl p-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-white text-lg outline-none"
            min="0"
          />
          <select
            value={selectedToken.symbol}
            onChange={(e) => {
              const token = tokens.find((t) => t.symbol === e.target.value);
              if (token) setSelectedToken(token);
            }}
            className="bg-black/30 text-white rounded-lg px-3 py-1 text-sm outline-none"
          >
            {tokens.map((t) => (
              <option key={t.symbol} value={t.symbol} className="bg-gray-800">
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fee estimate */}
      <div className="mb-6 flex justify-between text-sm">
        <span className="text-gray-400">Network Fee (est.)</span>
        <span className="text-yellow-400">{estimatedFee}</span>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!canProceed}
        className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
          canProceed ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        Continue
      </button>
    </div>
  );
}
