'use client';

import { useState, useCallback, useMemo } from 'react';
import DemoLayout from '@/components/DemoLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProviderQuote {
  providerId: string;
  providerName: string;
  icon: string;
  cryptoAmount: number;
  totalCost: number;
  fees: { totalFeePercent: number; fixedFee: number };
  estimatedTime: number;
  requiresKyc: boolean;
  paymentMethods: string[];
  regions: string[];
  isBest: boolean;
  token: string;
}

interface TokenOption {
  symbol: string;
  name: string;
  icon: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const TOKENS: TokenOption[] = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'USDC', name: 'USD Coin', icon: '◎' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY'];

const REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'KR', name: 'South Korea' },
];

/**
 * Simulate provider quotes with deterministic mock data.
 * In production, this would call the OnRampAggregator SDK.
 */
function generateMockQuotes(
  fiatAmount: number,
  currency: string,
  token: string,
  region: string,
): ProviderQuote[] {
  const rates: Record<string, number> = {
    ETH: 3000,
    BTC: 65000,
    USDC: 1,
    MATIC: 0.6,
    SOL: 150,
  };

  const baseRate = rates[token] ?? 3000;

  // Provider configs with realistic fee differences
  const providers = [
    {
      providerId: 'moonpay' as const,
      providerName: 'MoonPay',
      icon: '🌙',
      feePercent: 4.5,
      fixedFee: 4.99,
      time: 10,
      kyc: true,
      methods: ['credit_card', 'debit_card', 'bank_transfer', 'apple_pay'],
      regions: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'KR', 'SG', 'HK'],
      spread: 0.998, // slight rate variation
    },
    {
      providerId: 'ramp' as const,
      providerName: 'Ramp',
      icon: '🟢',
      feePercent: 2.5,
      fixedFee: 1.50,
      time: 5,
      kyc: true,
      methods: ['credit_card', 'debit_card', 'bank_transfer', 'apple_pay', 'google_pay'],
      regions: ['US', 'GB', 'DE', 'FR', 'JP', 'SG', 'HK', 'CA', 'AU'],
      spread: 1.002,
    },
    {
      providerId: 'transak' as const,
      providerName: 'Transak',
      icon: '🔷',
      feePercent: 2.0,
      fixedFee: 0.0,
      time: 15,
      kyc: true,
      methods: ['credit_card', 'debit_card', 'bank_transfer'],
      regions: ['US', 'GB', 'DE', 'FR', 'JP', 'KR', 'SG', 'HK', 'CA', 'AU'],
      spread: 0.995,
    },
  ];

  const quotes = providers.map((p) => {
    const regionSupported = p.regions.includes(region);
    if (!regionSupported) return null;

    const effectiveRate = baseRate / p.spread;
    const cryptoAmount = fiatAmount / effectiveRate;
    const feeAmount = fiatAmount * (p.feePercent / 100) + p.fixedFee;
    const totalCost = fiatAmount + feeAmount;

    return {
      providerId: p.providerId,
      providerName: p.providerName,
      icon: p.icon,
      cryptoAmount,
      totalCost,
      fees: { totalFeePercent: p.feePercent, fixedFee: p.fixedFee },
      estimatedTime: p.time,
      requiresKyc: p.kyc,
      paymentMethods: p.methods,
      regions: p.regions,
      isBest: false,
      token,
    };
  }).filter(Boolean) as ProviderQuote[];

  // Mark the best (lowest total cost)
  if (quotes.length > 0) {
    const best = quotes.reduce((a, b) => a.totalCost < b.totalCost ? a : b);
    best.isBest = true;
  }

  return quotes;
}

/** Build a simulated MoonPay widget URL. */
function buildWidgetUrl(
  amount: number,
  currency: string,
  token: string,
): string {
  const apiKey = process.env.NEXT_PUBLIC_MOONPAY_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_MOONPAY_API_KEY is required');
  }
  const url = new URL('https://buy.moonpay.com');
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('currencyCode', token.toLowerCase());
  url.searchParams.set('baseCurrencyAmount', amount.toString());
  url.searchParams.set('baseCurrencyCode', currency.toLowerCase());
  url.searchParams.set('theme', 'dark');
  url.searchParams.set('redirectURL', typeof window !== 'undefined' ? window.location.href : '');
  return url.toString();
}

// ─── Provider Card ──────────────────────────────────────────────────────────

function ProviderCard({
  quote,
  onSelect,
  selected,
}: {
  quote: ProviderQuote;
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(quote.providerId)}
      className={`w-full text-left p-4 rounded-md border transition-all ${
        quote.isBest
          ? 'border-[var(--cc-success)]/50 bg-[var(--cc-success)]/5 ring-1 ring-emerald-500/20'
          : selected
          ? 'border-[var(--cc-primary)]/50 bg-[var(--cc-link)]/5 ring-1 ring-blue-500/20'
          : 'border-[var(--cc-hairline-strong)]/50 bg-[var(--cc-canvas-soft-2)]/40 hover:border-[var(--cc-hairline-strong)]/50 hover:bg-[var(--cc-canvas-soft-2)]/60'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[20px]">{quote.icon}</span>
          <span className="font-semibold tracking-tighter text-[var(--cc-ink)]">{quote.providerName}</span>
        </div>
        {quote.isBest && (
          <span className="text-[12px] font-semibold uppercase tracking-normal px-2 py-1 rounded-full bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/30">
            Best Rate
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[14px]">
        <div>
          <span className="text-[var(--cc-body)] text-[12px]">You receive</span>
          <p className="text-[var(--cc-ink)] font-semibold">
            {quote.cryptoAmount.toFixed(6)}{' '}
            <span className="text-[var(--cc-muted)] text-[12px]">{quote.token}</span>
          </p>
        </div>
        <div>
          <span className="text-[var(--cc-body)] text-[12px]">Total cost</span>
          <p className="text-[var(--cc-ink)] font-semibold">${quote.totalCost.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-[var(--cc-body)] text-[12px]">Fee</span>
          <p className="text-[var(--cc-body)]">{quote.fees.totalFeePercent}% + ${quote.fees.fixedFee}</p>
        </div>
        <div>
          <span className="text-[var(--cc-body)] text-[12px]">Time</span>
          <p className="text-[var(--cc-body)]">~{quote.estimatedTime} min</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {quote.requiresKyc && (
          <span className="text-[12px] px-2 py-1 rounded bg-[var(--cc-warning)]/15 text-[var(--cc-warning)] border border-[var(--cc-warning)]/25">
            KYC Required
          </span>
        )}
        {quote.paymentMethods.slice(0, 3).map((m) => (
          <span key={m} className="text-[12px] px-2 py-1 rounded bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)]">
            {m.replace('_', ' ')}
          </span>
        ))}
      </div>
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function OnrampPage() {
  // Form state
  const [fiatAmount, setFiatAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [token, setToken] = useState('ETH');
  const [region, setRegion] = useState('US');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Results
  const [quotes, setQuotes] = useState<ProviderQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Widget state
  const [showWidget, setShowWidget] = useState(false);

  // Validate amount
  const amountNum = parseFloat(fiatAmount);
  const isValidAmount = !isNaN(amountNum) && amountNum > 0;

  // Fetch quotes (simulated)
  const handleGetQuotes = useCallback(() => {
    if (!isValidAmount) return;
    setLoading(true);
    setHasSearched(true);

    // Simulate network delay
    setTimeout(() => {
      const results = generateMockQuotes(amountNum, currency, token, region);
      setQuotes(results);
      if (results.length > 0) {
        setSelectedProvider(results.find((q) => q.isBest)?.providerId ?? results[0].providerId);
      }
      setLoading(false);
    }, 800);
  }, [amountNum, currency, token, region, isValidAmount]);

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.providerId === selectedProvider) ?? null,
    [quotes, selectedProvider],
  );

  const handleOpenWidget = useCallback(() => {
    if (!selectedQuote) return;
    setShowWidget(true);
  }, [selectedQuote]);

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <h1 className="text-[32px] font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-link)]/80 via-[var(--cc-link)] to-[var(--cc-link)]/60 bg-clip-text text-transparent">
            Fiat On-Ramp
          </h1>
          <p className="text-[var(--cc-muted)] text-[14px]">
            Buy crypto with fiat — compare MoonPay, Ramp &amp; Transak rates
          </p>
        </div>

        {/* ── Input Form ─────────────────────────────────── */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 p-6 space-y-5">
          <h2 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">Configure Purchase</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount Input */}
            <div>
              <label className="block text-[14px] text-[var(--cc-muted)] mb-2">Amount</label>
              <div className="flex items-center bg-[var(--cc-canvas)]/60 rounded-md border border-[var(--cc-hairline-strong)]/50 overflow-hidden">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fiatAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d*\.?\d*$/.test(v)) setFiatAmount(v);
                  }}
                  placeholder="100"
                  className="flex-1 bg-transparent px-4 py-3 text-[var(--cc-ink)] text-[18px] font-semibold outline-none placeholder:text-[var(--cc-body)]"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[var(--cc-canvas-soft-2)]/80 text-[var(--cc-ink)] text-[14px] px-3 py-3 border-l border-[var(--cc-hairline-strong)]/50 outline-none cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Token Selection */}
            <div>
              <label className="block text-[14px] text-[var(--cc-muted)] mb-2">Token</label>
              <div className="flex items-center bg-[var(--cc-canvas)]/60 rounded-md border border-[var(--cc-hairline-strong)]/50 overflow-hidden">
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-[var(--cc-ink)] text-[18px] font-semibold outline-none cursor-pointer"
                >
                  {TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol} — {t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <label className="block text-[14px] text-[var(--cc-muted)] mb-2">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[var(--cc-canvas)]/60 text-[var(--cc-ink)] text-[14px] px-4 py-3 rounded-md border border-[var(--cc-hairline-strong)]/50 outline-none cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.code} — {r.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-[14px] text-[var(--cc-muted)] mb-2">Quick Select</label>
              <div className="flex gap-2">
                {[50, 100, 250, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFiatAmount(v.toString())}
                    className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                      fiatAmount === v.toString()
                        ? 'bg-[var(--cc-link)]/20 text-[var(--cc-link)] border border-[var(--cc-primary)]/40'
                        : 'bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)] hover:bg-[var(--cc-muted)]/50 border border-transparent'
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Get Quotes Button */}
          <button
            onClick={handleGetQuotes}
            disabled={!isValidAmount || loading}
            className={`w-full py-4 rounded-md font-semibold text-[16px] transition-all ${
              isValidAmount && !loading
                ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 shadow-[var(--cc-level3)] active:scale-[0.98]'
                : 'bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-body)] cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Fetching quotes...
              </span>
            ) : (
              'Compare Providers'
            )}
          </button>
        </div>

        {/* ── Provider Comparison ────────────────────────── */}
        {hasSearched && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">
              Provider Comparison
              {quotes.length > 0 && (
                <span className="ml-2 text-[14px] text-[var(--cc-body)] font-normal">
                  ({quotes.length} provider{quotes.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 bg-[var(--cc-canvas-soft-2)]/40 rounded-md animate-pulse border border-[var(--cc-hairline-strong)]/30" />
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="bg-[var(--cc-canvas-soft-2)]/60 rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 p-8 text-center">
                <p className="text-[var(--cc-muted)]">
                  No providers available for your region ({region}). Try selecting a different region.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <ProviderCard
                    key={q.providerId}
                    quote={q}
                    onSelect={setSelectedProvider}
                    selected={selectedProvider === q.providerId}
                  />
                ))}
              </div>
            )}

            {/* Selected Provider Action */}
            {selectedQuote && !loading && (
              <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">
                      {selectedQuote.icon} {selectedQuote.providerName}
                    </h3>
                    <p className="text-[14px] text-[var(--cc-muted)]">
                      Receive {selectedQuote.cryptoAmount.toFixed(6)} {token} for ${selectedQuote.totalCost.toFixed(2)} {currency}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenWidget}
                    className="px-6 py-3 rounded-[6px] font-semibold text-[14px] bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 shadow-[var(--cc-level3)] transition-all active:scale-[0.98]"
                  >
                    Buy Now
                  </button>
                </div>

                {/* SDK Usage Example */}
                <details className="group">
                  <summary className="text-[12px] text-[var(--cc-body)] cursor-pointer hover:text-[var(--cc-body)] transition-colors select-none">
                    <span className="group-open:hidden">Show SDK integration code ▸</span>
                    <span className="hidden group-open:inline">Hide code ▾</span>
                  </summary>
                  <pre className="mt-3 p-4 bg-[var(--cc-canvas)]/80 rounded-md text-[12px] text-[var(--cc-body)] overflow-x-auto font-[var(--font-mono)]">
{`import { OnRampAggregator, MoonPayProvider, RampProvider, TransakProvider } from '@cinacoin/onramp-sdk';

const aggregator = new OnRampAggregator();
aggregator.registerProvider(new MoonPayProvider({
  apiKey: process.env.MOONPAY_API_KEY,
  environment: 'production',
}));
aggregator.registerProvider(new RampProvider({ apiKey: process.env.RAMP_API_KEY }));
aggregator.registerProvider(new TransakProvider({
  apiKey: process.env.TRANSAK_API_KEY,
  environment: 'production',
}));

const quote = await aggregator.getBestQuote({
  fiatCurrency: '${currency}',
  fiatAmount: ${amountNum},
  cryptoToken: '${token}',
  chainId: 1,
  destinationAddress: '0xYourWalletAddress',
  userRegion: '${region}',
});`}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* ── Embedded Widget Iframe ─────────────────────── */}
        {showWidget && selectedQuote && (
          <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--cc-hairline-strong)]/50">
              <div className="flex items-center gap-2">
                <span>{selectedQuote.icon}</span>
                <span className="font-semibold tracking-tighter text-[var(--cc-ink)] text-[14px]">{selectedQuote.providerName}</span>
                <span className="text-[12px] text-[var(--cc-body)]">— On-Ramp Widget</span>
              </div>
              <button
                onClick={() => setShowWidget(false)}
                className="text-[var(--cc-muted)] hover:text-[var(--cc-ink)] transition-colors p-1 rounded hover:bg-[var(--cc-canvas-soft-2)]/50"
                aria-label="Close widget"
              >
                ✕
              </button>
            </div>
            <div className="w-full flex justify-center bg-[var(--cc-canvas)]/50 p-4">
              <iframe
                src={buildWidgetUrl(amountNum, currency, token)}
                title={`${selectedQuote.providerName} On-Ramp Widget`}
                width="400"
                height="600"
                style={{ border: 'none', borderRadius: '12px', maxWidth: '100%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
            <div className="px-5 py-3 border-t border-[var(--cc-hairline-strong)]/50">
              <p className="text-[12px] text-[var(--cc-body)]">
                Widget URL: <code className="text-[var(--cc-muted)] break-all">{buildWidgetUrl(amountNum, currency, token)}</code>
              </p>
            </div>
          </div>
        )}

        {/* ── Info Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '🔒',
              title: 'Secure',
              desc: 'All providers are regulated and use KYC/AML compliance.',
            },
            {
              icon: '⚡',
              title: 'Fast',
              desc: 'Receive crypto in minutes with instant payment methods.',
            },
            {
              icon: '🌍',
              title: 'Global',
              desc: 'Support for 150+ countries and multiple fiat currencies.',
            },
          ].map((card) => (
            <div key={card.title} className="bg-[var(--cc-canvas-soft-2)]/40 rounded-md border border-[var(--cc-hairline-strong)]/40 p-5 text-center">
              <span className="text-[24px]">{card.icon}</span>
              <h3 className="text-[var(--cc-ink)] font-semibold mt-2">{card.title}</h3>
              <p className="text-[var(--cc-muted)] text-[14px] mt-1">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="text-center space-y-1 pt-4">
          <div className="flex items-center justify-center gap-2 text-[var(--cc-body)] text-[12px]">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-[var(--cc-link)] to-[var(--cc-violet)]" />
            <span>Powered by <span className="text-[var(--cc-body)] font-semibold">@cinacoin/onramp-sdk</span></span>
          </div>
          <p className="text-[var(--cc-body)] text-[12px]">
            Aggregating MoonPay, Ramp, and Transak for the best on-ramp rates
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
