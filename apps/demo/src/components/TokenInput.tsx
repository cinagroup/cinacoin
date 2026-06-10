'use client';

interface TokenOption {
  symbol: string;
  icon: string;
}

interface TokenInputProps {
  value: string;
  onChange: (v: string) => void;
  token: string;
  onTokenChange: (t: string) => void;
  balance?: string;
  label: string;
  tokens?: TokenOption[];
  placeholder?: string;
  maxButton?: boolean;
  onMax?: () => void;
  className?: string;
}

const defaultTokens: TokenOption[] = [
  { symbol: 'ETH', icon: '⟠' },
  { symbol: 'USDC', icon: '◎' },
  { symbol: 'USDT', icon: '₮' },
  { symbol: 'WBTC', icon: '₿' },
  { symbol: 'DAI', icon: '◈' },
];

export default function TokenInput({
  value,
  onChange,
  token,
  onTokenChange,
  balance,
  label,
  tokens = defaultTokens,
  placeholder = '0.0',
  maxButton,
  onMax,
  className = '',
}: TokenInputProps) {
  const selectedToken = tokens.find((t) => t.symbol === token) ?? tokens[0];

  return (
    <div className={`bg-[var(--cc-canvas)] rounded-[6px] p-4 border border-[var(--cc-hairline)] focus-within:border-[var(--cc-ink)] transition-colors ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[14px] font-medium text-[var(--cc-muted)]">{label}</span>
        <div className="flex items-center gap-2">
          {balance !== undefined && (
            <span className="text-[12px] text-[var(--cc-body)]">
              Balance: <span className="text-[var(--cc-body)]">{balance}</span>
            </span>
          )}
          {maxButton && onMax && (
            <button
              onClick={onMax}
              aria-label={`Set maximum ${label} amount`}
              className="text-[12px] font-semibold text-[var(--cc-link)] hover:text-[var(--cc-link-deep)] transition-colors px-2 py-1 rounded bg-[var(--cc-link)]/10 hover:bg-[var(--cc-link)]/20"
            >
              MAX
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Token selector */}
        <div className="relative">
          <select
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            className="appearance-none bg-[var(--cc-canvas-soft-2)] hover:bg-[var(--cc-muted)]/80 rounded-[6px] px-3 py-2 transition-colors border border-[var(--cc-hairline)] text-[14px] text-[var(--cc-ink)] font-semibold cursor-pointer pr-8 h-[40px]"
          >
            {tokens.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.icon} {t.symbol}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--cc-muted)] text-[12px]">
            ▾
          </span>
        </div>

        {/* Amount input */}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) {
              onChange(v);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-right text-[24px] font-semibold text-[var(--cc-ink)] outline-none placeholder:text-[var(--cc-body)]"
        />
      </div>
    </div>
  );
}
