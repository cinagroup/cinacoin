"use client";

import { useState, useEffect } from "react";
import { CreditCard, ArrowRight, Loader2, CheckCircle2, AlertCircle, RefreshCw, Moon, Zap, Diamond } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet, shortenAddress } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";

/* ── Mock provider quotes ── */
const PROVIDERS = [
  {
    id: "moonpay",
    name: "MoonPay",
    icon: Moon,
    amount: 100,
    receiveAmount: "0.0263",
    fee: "2.99",
    rate: "3,802.45",
    eta: "5-10 min",
  },
  {
    id: "transak",
    name: "Transak",
    icon: Zap,
    amount: 100,
    receiveAmount: "0.0261",
    fee: "3.49",
    rate: "3,816.79",
    eta: "3-5 min",
  },
  {
    id: "ramp",
    name: "Ramp Network",
    icon: Diamond,
    amount: 100,
    receiveAmount: "0.0259",
    fee: "1.50",
    rate: "3,861.00",
    eta: "10-15 min",
  },
];

export default function OnRampPage() {
  const { account, status } = useWallet();
  const { success, error: showError } = useToast();

  const isConnected = status === "connected";

  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("USD");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  // Simulate loading quotes
  useEffect(() => {
    setQuotesLoading(true);
    const timer = setTimeout(() => setQuotesLoading(false), 800);
    return () => clearTimeout(timer);
  }, [amount]);

  const handlePurchase = async () => {
    if (!selectedProvider) {
      showError("Select provider", "Please choose a payment provider");
      return;
    }
    setLoading(true);
    // Simulate purchase flow
    await new Promise((r) => setTimeout(r, 2000));
    setPurchaseComplete(true);
    const provider = PROVIDERS.find((p) => p.id === selectedProvider);
    success(
      "Purchase initiated",
      `Buying ~${provider?.receiveAmount} ETH via ${provider?.name}`
    );
    setLoading(false);
  };

  const presetAmounts = ["50", "100", "250", "500", "1000"];

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-md mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ONRAMP</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Buy crypto.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to purchase crypto with fiat.</p>
        </div>
      </DemoLayout>
    );
  }

  if (purchaseComplete) {
    return (
      <DemoLayout>
        <div className="max-w-md mx-auto px-4 py-12 text-center cc-page-enter">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-sm bg-[var(--cc-success)]/15 border border-[var(--cc-success)]/25 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[var(--cc-success)]" />
            </div>
          </div>
          <h2 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-3">
            Purchase initiated.
          </h2>
          <p className="text-[var(--cc-body)] mb-2">
            Your order is being processed. Funds will arrive in your wallet shortly.
          </p>
          <p className="text-caption text-[var(--cc-muted)] mb-8">
            Transaction reference: {`0x${Math.random().toString(16).slice(2, 10)}`}
          </p>
          <button
            onClick={() => {
              setPurchaseComplete(false);
              setSelectedProvider(null);
            }}
            className="px-6 py-2.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] rounded-[var(--cc-radius-sm)] font-semibold text-body-sm transition-all shadow-[var(--cc-level2)] active:scale-[0.98]"
          >
            Make another purchase
          </button>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-md mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="mb-6">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ONRAMP</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-2">
            Buy crypto.
          </h1>
          <p className="text-[var(--cc-body)] text-body-sm">
            Purchase ETH with fiat currency · Delivered to {shortenAddress(account.address ?? "")}
          </p>
        </div>

        {/* Amount Input */}
        <div className="p-5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)] mb-4">
          <label className="text-caption text-[var(--cc-muted)] block mb-2">Amount</label>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-display-sm font-semibold text-[var(--cc-muted)]">$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-8 pr-4 py-3 bg-transparent text-display-sm font-semibold text-[var(--cc-ink)] focus:outline-none cc-tabular-nums"
                placeholder="100"
              />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-body-sm font-medium text-[var(--cc-ink)] focus:outline-none focus:border-[var(--cc-hairline-strong)]"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Preset amounts */}
          <div className="flex gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`flex-1 py-1.5 text-caption font-medium rounded-sm transition-all ${
                  amount === preset
                    ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)]'
                    : 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-muted)] hover:text-[var(--cc-ink)] border border-[var(--cc-hairline)]'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Quotes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-body-sm font-medium text-[var(--cc-ink)]">Select provider</p>
            {quotesLoading && <RefreshCw className="w-3.5 h-3.5 text-[var(--cc-muted)] animate-spin" />}
          </div>

          {quotesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)]">
                  <div className="flex items-center gap-3">
                    <div className="cc-skeleton cc-skeleton-circle w-10 h-10" />
                    <div className="flex-1 space-y-2">
                      <div className="cc-skeleton cc-skeleton-text w-24" />
                      <div className="cc-skeleton cc-skeleton-text w-32" />
                    </div>
                    <div className="cc-skeleton cc-skeleton-text w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 cc-stagger">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`w-full p-4 border rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] text-left transition-all cc-animate-slide-up ${
                    selectedProvider === provider.id
                      ? 'border-[var(--cc-hairline-strong)] shadow-[var(--cc-level2)]'
                      : 'border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level1)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] flex items-center justify-center">
                      <provider.icon className="w-5 h-5 text-[var(--cc-ink)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-body-sm text-[var(--cc-ink)]">{provider.name}</p>
                        <span className="text-caption text-[var(--cc-muted)]">· {provider.eta}</span>
                      </div>
                      <p className="text-caption text-[var(--cc-body)] mt-0.5 cc-tabular-nums">
                        ~{provider.receiveAmount} ETH · Fee ${provider.fee}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-body-sm text-[var(--cc-ink)] cc-tabular-nums">${provider.amount}</p>
                      <p className="text-caption text-[var(--cc-muted)] cc-tabular-nums">${provider.rate}/ETH</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={!selectedProvider || loading || quotesLoading}
          className="w-full px-6 py-3.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--cc-radius-sm)] font-semibold transition-all shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : !selectedProvider ? (
            "Select a provider"
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Buy with {PROVIDERS.find((p) => p.id === selectedProvider)?.name}
            </>
          )}
        </button>

        {/* Disclaimer */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--cc-muted)] mt-0.5 shrink-0" />
          <p className="text-caption text-[var(--cc-muted)]">
            Demo uses simulated quotes. Real purchases require integration with on-ramp providers like MoonPay, Transak, or Ramp.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
