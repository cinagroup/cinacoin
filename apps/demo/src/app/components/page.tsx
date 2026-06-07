'use client';

import { useState, useCallback, useEffect } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';

/* ── theme presets ── */

const THEMES: Record<string, { name: string; bg: string; card: string; border: string; primary: string; text: string; accent: string }> = {
  dark: {
    name: 'Dark',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas-soft-2)]/60',
    border: 'border-[var(--cc-hairline-strong)]/50',
    primary: 'from-[var(--cc-link)]/80 to-[var(--cc-link)]',
    text: 'text-[var(--cc-ink)]',
    accent: 'text-[var(--cc-link)]',
  },
  light: {
    name: 'Light',
    bg: 'bg-[var(--cc-canvas-soft-2)]',
    card: 'bg-[var(--cc-canvas)]/80',
    border: 'border-[var(--cc-hairline-strong)]/50',
    primary: 'from-[var(--cc-link)]/80 to-[var(--cc-link)]',
    text: 'text-[var(--cc-ink)]',
    accent: 'text-[var(--cc-primary)]',
  },
  midnight: {
    name: 'Midnight',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas)]/60',
    border: 'border-slate-700/50',
    primary: 'from-[var(--cc-link)]/80 to-[var(--cc-link)]',
    text: 'text-[var(--cc-ink)]',
    accent: 'text-[var(--cc-link)]',
  },
  neon: {
    name: 'Neon',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas)]/70',
    border: 'border-[var(--cc-success)]/30',
    primary: 'from-green-400 to-emerald-600',
    text: 'text-[var(--cc-success)]/70',
    accent: 'text-[var(--cc-success)]',
  },
  sunset: {
    name: 'Sunset',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas)]/60',
    border: 'border-orange-500/30',
    primary: 'from-[var(--cc-link)]/80 to-[var(--cc-link)]',
    text: 'text-orange-100',
    accent: 'text-orange-400',
  },
  ocean: {
    name: 'Ocean',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas)]/50',
    border: 'border-cyan-500/30',
    primary: 'from-cyan-500 to-teal-600',
    text: 'text-[var(--cc-cyan-soft)]',
    accent: 'text-[var(--cc-cyan)]',
  },
  rose: {
    name: 'Rose',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas)]/60',
    border: 'border-pink-500/30',
    primary: 'from-pink-500 to-rose-600',
    text: 'text-pink-100',
    accent: 'text-pink-400',
  },
  minimal: {
    name: 'Minimal',
    bg: 'bg-[var(--cc-canvas)]',
    card: 'bg-[var(--cc-canvas)]/30',
    border: 'border-[var(--cc-hairline)]/40',
    primary: 'from-gray-400 to-gray-600',
    text: 'text-[var(--cc-body)]',
    accent: 'text-[var(--cc-muted)]',
  },
};

/* ── code block ── */

function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative rounded-md overflow-hidden border border-[var(--cc-hairline-strong)]/40">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--cc-canvas)]/60 border-b border-[var(--cc-hairline-strong)]/40">
        <span className="text-[12px] text-[var(--cc-body)] font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className={`text-[12px] px-2 py-1 rounded transition-all ${
            copied ? 'text-[var(--cc-success)] bg-[var(--cc-success)]/15' : 'text-[var(--cc-body)] hover:text-[var(--cc-body)]'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs text-[var(--cc-body)] font-mono overflow-x-auto bg-[var(--cc-canvas)]/50 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

/* ── component showcase card ── */

function ComponentShowcase({
  title,
  description,
  preview,
  code,
  theme,
}: {
  title: string;
  description: string;
  preview: React.ReactNode;
  code: string;
  theme: (typeof THEMES)['dark'];
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className={`${theme.card} backdrop-blur-xl rounded-[var(--cc-radius-md)] border ${theme.border} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/30 flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold tracking-tight ${theme.text}`}>{title}</h3>
          <p className="text-xs text-[var(--cc-body)] mt-0.5">{description}</p>
        </div>
        <button
          onClick={() => setShowCode(!showCode)}
          className={`text-xs px-3 py-2 rounded-lg transition-all ${
            showCode
              ? 'bg-[var(--cc-link)]/15 text-[var(--cc-link)] border border-[var(--cc-primary)]/30'
              : 'bg-[var(--cc-canvas-soft-2)]/40 text-[var(--cc-muted)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)]'
          }`}
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      {/* Preview */}
      <div className="p-5">{preview}</div>

      {/* Code */}
      {showCode && (
        <div className="border-t border-[var(--cc-hairline-strong)]/30">
          <div className="p-5">
            <CodeBlock code={code} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── main page ── */

export default function ComponentsPage() {
  const { account, status, connectors, connect } = useWallet();
  const { success } = useToast();
  const isConnected = status === 'connected';

  const [themeKey, setThemeKey] = useState('dark');
  const theme = THEMES[themeKey];

  return (
    <DemoLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-[var(--cc-link)]/80 via-[var(--cc-link)]/70 to-[var(--cc-link)]/60 bg-clip-text text-transparent">
            Component Gallery
          </h1>
          <p className="text-[var(--cc-muted)] text-sm">Browse all Cinacoin components with live theme previews</p>
        </div>

        {/* ── Theme Switcher ── */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--cc-ink)]">🎨 Theme Preview</h2>
            <p className="text-xs text-[var(--cc-body)] mt-1">Switch themes to see all components update in real-time</p>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setThemeKey(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    themeKey === key
                      ? `bg-[var(--cc-primary)] text-[var(--cc-on-primary)] shadow-[var(--cc-level2)]`
                      : 'bg-[var(--cc-canvas-soft-2)]/40 text-[var(--cc-muted)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Buttons ── */}
        <ComponentShowcase
          title="Buttons"
          description="Primary, secondary, ghost, and icon button variants"
          theme={theme}
          preview={
            <div className="space-y-4">
              {/* Variants */}
              <div className="flex flex-wrap gap-3 items-center">
                <button className="px-5 py-3 rounded-[100px] font-semibold text-sm bg-[var(--cc-primary)] text-[var(--cc-on-primary)] shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] transition-all hover:-translate-y-0.5">
                  Primary
                </button>
                <button className="px-5 py-3 rounded-md font-semibold text-sm bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-body)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] transition-all">
                  Secondary
                </button>
                <button className="px-5 py-3 rounded-md font-semibold text-sm text-[var(--cc-primary)] hover:text-[var(--cc-ink)] transition-colors">
                  Ghost
                </button>
                <button className="px-5 py-3 rounded-md font-semibold text-sm bg-[var(--cc-error)]/15 text-[var(--cc-error)] border border-[var(--cc-error)]/25 hover:bg-[var(--cc-error)]/25 transition-all">
                  Danger
                </button>
                <button className="px-5 py-3 rounded-md font-semibold text-sm bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/25 hover:bg-[var(--cc-success)]/25 transition-all">
                  Success
                </button>
                <button disabled className="px-5 py-3 rounded-md font-semibold text-sm bg-[var(--cc-canvas-soft-2)]/40 text-[var(--cc-body)] cursor-not-allowed">
                  Disabled
                </button>
              </div>

              {/* Sizes */}
              <div className="flex flex-wrap gap-3 items-center">
                <button className="px-3 py-2 rounded-[100px] text-xs font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)]">
                  Small
                </button>
                <button className="px-5 py-3 rounded-[100px] text-sm font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)]">
                  Medium
                </button>
                <button className="px-8 py-4 rounded-[100px] text-base font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)]">
                  Large
                </button>
              </div>

              {/* Icon buttons */}
              <div className="flex flex-wrap gap-3 items-center">
                <button className="size-10 rounded-md bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-muted)] transition-all flex items-center justify-center text-lg">
                  🔗
                </button>
                <button className="size-10 rounded-md bg-[var(--cc-link)]/15 text-[var(--cc-link)] hover:bg-[var(--cc-link)]/25 border border-[var(--cc-primary)]/25 transition-all flex items-center justify-center text-lg">
                  🔄
                </button>
                <button className="size-10 rounded-md bg-[var(--cc-success)]/15 text-[var(--cc-success)] hover:bg-[var(--cc-success)]/25 border border-[var(--cc-success)]/25 transition-all flex items-center justify-center text-lg">
                  ✓
                </button>
              </div>
            </div>
          }
          code={`// Primary Button
<button className="px-5 py-3 rounded-md font-semibold text-sm
  bg-gradient-to-r from-[var(--cc-link)] to-[var(--cc-link)]/80 text-[var(--cc-on-primary)]
  shadow-[var(--cc-level3)]">
  Connect Wallet
</button>

// Secondary Button
<button className="px-5 py-3 rounded-md font-semibold text-sm
  bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-body)] border border-[var(--cc-hairline-strong)]/40">
  Cancel
</button>

// Ghost Button
<button className="px-5 py-3 rounded-md font-semibold text-sm
  text-[var(--cc-primary)] hover:text-[var(--cc-ink)]">
  Learn More
</button>

// Danger Button
<button className="px-5 py-3 rounded-md font-semibold text-sm
  bg-[var(--cc-error)]/15 text-[var(--cc-error)] border border-[var(--cc-error)]/25">
  Delete
</button>

// Sizes: text-xs/rounded-lg (sm), text-sm/rounded-md (md), text-base/rounded-[var(--cc-radius-md)] (lg)`}
        />

        {/* ── Wallet Card ── */}
        <ComponentShowcase
          title="Wallet Card"
          description="Connected wallet display with address, balance, and chain info"
          theme={theme}
          preview={
            <div className="space-y-3">
              {isConnected ? (
                <div className="flex items-center gap-4 p-4 rounded-md bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/40">
                  <div className="size-12 rounded-full bg-gradient-to-br from-[var(--cc-link)]/80 to-[var(--cc-link)] flex items-center justify-center text-sm font-semibold tracking-tight text-[var(--cc-ink)] shadow-[var(--cc-level3)]">
                    {account.address?.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-[var(--cc-body)] truncate">{shortenAddress(account.address ?? '')}</p>
                    <p className="text-xs text-[var(--cc-body)]">{account.chainName} · Chain ID: {account.chainId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--cc-body)]">{account.balance} {account.chainSymbol}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-md bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/40">
                  <div className="size-12 rounded-full bg-gradient-to-br from-[var(--cc-link)]/80 to-[var(--cc-link)] flex items-center justify-center text-sm font-semibold tracking-tight text-[var(--cc-ink)]">
                    00
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono text-[var(--cc-body)]">0x1a2b...3c4d</p>
                    <p className="text-xs text-[var(--cc-body)]">Ethereum · Chain ID: 1</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--cc-body)]">1.2345 ETH</p>
                  </div>
                </div>
              )}
            </div>
          }
          code={`// Wallet Card Component
<div className="flex items-center gap-4 p-4 rounded-md
  bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/40">
  {/* Avatar */}
  <div className="size-12 rounded-full bg-gradient-to-br
    from-[var(--cc-link)]/80 to-[var(--cc-link)] flex items-center justify-center
    text-sm font-semibold tracking-tight text-[var(--cc-ink)]">
    {address.slice(2, 4).toUpperCase()}
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-mono truncate">
      {shortenAddress(address)}
    </p>
    <p className="text-xs text-[var(--cc-body)]">
      {chainName} · Chain ID: {chainId}
    </p>
  </div>

  {/* Balance */}
  <div className="text-right">
    <p className="text-sm font-semibold">{balance} {symbol}</p>
  </div>
</div>`}
        />

        {/* ── Status Badges ── */}
        <ComponentShowcase
          title="Status Badges"
          description="Connection status, transaction state, and health indicators"
          theme={theme}
          preview={
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {/* Connection status */}
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/25">
                  <span className="size-3 rounded-full bg-[var(--cc-success)] animate-pulse" />
                  Connected
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-warning)]/15 text-[var(--cc-warning)] border border-yellow-500/25">
                  <span className="size-3 rounded-full bg-[var(--cc-warning)] animate-pulse" />
                  Connecting...
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-body)] border border-[var(--cc-hairline-strong)]/40">
                  <span className="size-3 rounded-full bg-[var(--cc-muted)]" />
                  Disconnected
                </span>
              </div>

              {/* Transaction status */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/25">
                  ✓ Completed
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-warning)]/15 text-[var(--cc-warning)] border border-[var(--cc-warning)]/25">
                  <span className="size-3 rounded-full bg-[var(--cc-warning)] animate-pulse" />
                  Pending
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-error)]/15 text-[var(--cc-error)] border border-[var(--cc-error)]/25">
                  ✗ Failed
                </span>
              </div>

              {/* Health badges */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/25">
                  ✓ Operational
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[var(--cc-error)]/15 text-[var(--cc-error)] border border-[var(--cc-error)]/25">
                  ✗ Down
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono bg-[var(--cc-link)]/15 text-[var(--cc-link)] border border-[var(--cc-link)]/25">
                  142ms
                </span>
              </div>
            </div>
          }
          code={`// Connected Status
<span className="inline-flex items-center gap-1.5 px-3 py-2
  rounded-full text-xs font-semibold
  bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/25">
  <span className="size-3 rounded-full bg-[var(--cc-success)] animate-pulse" />
  Connected
</span>

// Pending Transaction
<span className="inline-flex items-center gap-1.5 px-3 py-2
  rounded-full text-xs font-semibold
  bg-[var(--cc-warning)]/15 text-[var(--cc-warning)] border border-[var(--cc-warning)]/25">
  <span className="size-3 rounded-full bg-[var(--cc-warning)] animate-pulse" />
  Pending
</span>

// Latency Badge
<span className="inline-flex items-center gap-1.5 px-3 py-2
  rounded-full text-xs font-mono
  bg-[var(--cc-link)]/15 text-[var(--cc-link)] border border-[var(--cc-link)]/25">
  142ms
</span>`}
        />

        {/* ── Chain Badges ── */}
        <ComponentShowcase
          title="Chain Badges"
          description="Visual network selectors for all supported chains"
          theme={theme}
          preview={
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', initial: 'Ξ' },
                { name: 'Polygon', symbol: 'POL', color: '#8247E5', initial: '⬡' },
                { name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', initial: 'A' },
                { name: 'Base', symbol: 'BASE', color: '#0052FF', initial: 'B' },
                { name: 'Optimism', symbol: 'OP', color: '#FF0420', initial: 'O' },
                { name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', initial: 'B' },
                { name: 'Avalanche', symbol: 'AVAX', color: '#E84142', initial: 'A' },
                { name: 'Solana', symbol: 'SOL', color: '#9945FF', initial: 'S' },
              ].map((c) => (
                <div
                  key={c.symbol}
                  className="group flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--cc-canvas)]/80 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] transition-colors cursor-default shrink-0"
                >
                  <span
                    className="inline-flex size-6 items-center justify-center rounded-full text-[12px] font-semibold tracking-tight text-[var(--cc-ink)]"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initial}
                  </span>
                  <span className="text-xs font-medium text-[var(--cc-muted)] group-hover:text-[var(--cc-body)] transition-colors">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          }
          code={`// Chain Badge Component
<div className="flex items-center gap-2 px-3 py-2 rounded-md
  bg-[var(--cc-canvas)]/80 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)]
  transition-colors cursor-default shrink-0">
  <span className="inline-flex size-6 items-center justify-center
    rounded-full text-[12px] font-semibold tracking-tight text-[var(--cc-ink)]"
    style={{ backgroundColor: chainColor }}>
    {chain.initial}
  </span>
  <span className="text-xs font-medium text-[var(--cc-muted)]
    group-hover:text-[var(--cc-body)] transition-colors">
    {chain.name}
  </span>
</div>`}
        />

        {/* ── Toggle Switch ── */}
        <ComponentShowcase
          title="Toggle Switch"
          description="On/off toggle for settings and preferences"
          theme={theme}
          preview={
            <div className="space-y-4">
              {[
                { label: 'Dark Mode', desc: 'Use dark theme throughout', checked: true },
                { label: 'Auto-Connect', desc: 'Reconnect last wallet on page load', checked: true },
                { label: 'Debug Mode', desc: 'Enable verbose logging in console', checked: false },
                { label: 'Compact Mode', desc: 'Reduce spacing and padding', checked: false },
              ].map((t) => (
                <ToggleDemo key={t.label} label={t.label} desc={t.desc} defaultChecked={t.checked} />
              ))}
            </div>
          }
          code={`// Toggle Switch Component
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={\`relative w-12 h-6 rounded-full transition-colors
        \${checked ? 'bg-[var(--cc-link)]' : 'bg-[var(--cc-canvas-soft-2)]'}\`}
      role="switch" aria-checked={checked}
    >
      <span className={\`absolute top-0.5 left-0.5 w-5 h-5
        rounded-full bg-[var(--cc-canvas)] shadow-md transition-transform
        \${checked ? 'translate-x-6' : 'translate-x-0'}\`} />
    </button>
  );
}

// Usage
<ToggleSwitch checked={darkMode} onChange={setDarkMode} />`}
        />

        {/* ── Input Fields ── */}
        <ComponentShowcase
          title="Input Fields"
          description="Text inputs, search bars, and select dropdowns"
          theme={theme}
          preview={
            <div className="space-y-4">
              {/* Text input */}
              <div>
                <label className="text-sm text-[var(--cc-muted)] mb-1 block">Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/50 rounded-md text-sm text-[var(--cc-body)] placeholder:text-[var(--cc-body)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]/40 focus:border-[var(--cc-primary)]/50 font-mono"
                  readOnly
                  defaultValue="0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"
                />
              </div>

              {/* Search input */}
              <div className="relative">
                <label className="text-sm text-[var(--cc-muted)] mb-1 block">Search Tokens</label>
                <input
                  type="text"
                  placeholder="Search by name, symbol, or address..."
                  className="w-full px-4 py-3 pl-10 bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/50 rounded-md text-sm text-[var(--cc-body)] placeholder:text-[var(--cc-body)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]/40"
                />
                <span className="absolute left-3 top-9 text-[var(--cc-body)]">🔍</span>
              </div>

              {/* Select */}
              <div className="relative">
                <label className="text-sm text-[var(--cc-muted)] mb-1 block">Network</label>
                <select className="w-full px-4 py-3 bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/50 rounded-md text-sm text-[var(--cc-body)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]/40 appearance-none cursor-pointer">
                  <option>Ethereum</option>
                  <option>Polygon</option>
                  <option>Arbitrum</option>
                  <option>Base</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-9 text-[var(--cc-body)] text-xs">▾</span>
              </div>
            </div>
          }
          code={`// Text Input
<input
  type="text"
  placeholder="0x..."
  className="w-full px-4 py-3 bg-[var(--cc-canvas)]/60 border
    border-[var(--cc-hairline-strong)]/50 rounded-md text-sm text-[var(--cc-body)]
    placeholder:text-[var(--cc-body)] focus:outline-none
    focus:ring-2 focus:ring-[var(--cc-link)]/40 font-mono"
/>

// Search Input with icon
<div className="relative">
  <input placeholder="Search..." className="w-full px-4 py-3
    pl-10 bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/50 rounded-md
    text-sm placeholder:text-[var(--cc-body)] focus:outline-none
    focus:ring-2 focus:ring-[var(--cc-link)]/40" />
  <span className="absolute left-3 top-1/2 -translate-y-1/2
    text-[var(--cc-body)]">🔍</span>
</div>

// Select Dropdown
<select className="w-full px-4 py-3 bg-[var(--cc-canvas)]/60 border
  border-[var(--cc-hairline-strong)]/50 rounded-md text-sm appearance-none
  focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]/40">
  <option>Ethereum</option>
  <option>Polygon</option>
</select>`}
        />

        {/* ── Card Layouts ── */}
        <ComponentShowcase
          title="Card Layouts"
          description="Feature cards, stat cards, and info panels"
          theme={theme}
          preview={
            <div className="space-y-4">
              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🔗', title: 'Multi-Chain', desc: '16 chains, one SDK' },
                  { icon: '🔐', title: 'SIWE Auth', desc: 'Sign-In With Ethereum' },
                  { icon: '🔄', title: 'Token Swap', desc: 'DEX aggregation' },
                  { icon: '🌉', title: 'Cross-Chain', desc: 'Unified bridge routing' },
                ].map((f) => (
                  <div key={f.title} className="group p-4 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] hover:bg-[var(--cc-canvas-soft-2)]/60 transition-all cursor-default">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <h4 className="text-sm font-semibold text-[var(--cc-body)]">{f.title}</h4>
                    <p className="text-xs text-[var(--cc-body)] mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: '64', label: 'Packages' },
                  { value: '16', label: 'Chains' },
                  { value: '30+', label: 'Wallets' },
                  { value: '$0', label: 'Cost' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline)]/50">
                    <div className="text-xl font-semibold tracking-tight from-[var(--cc-link)]/80 to-[var(--cc-link)]/60 bg-clip-text text-transparent">
                      {s.value}
                    </div>
                    <div className="text-[12px] text-[var(--cc-body)] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          }
          code={`// Feature Card
<div className="group p-4 rounded-md bg-[var(--cc-canvas)]/50 border
  border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] hover:bg-[var(--cc-canvas-soft-2)]/60
  transition-all cursor-default">
  <div className="text-2xl mb-2">{icon}</div>
  <h4 className="text-sm font-semibold text-[var(--cc-body)]">{title}</h4>
  <p className="text-xs text-[var(--cc-body)] mt-1">{description}</p>
</div>

// Stat Card
<div className="text-center p-3 rounded-md bg-[var(--cc-canvas)]/50
  border border-[var(--cc-hairline)]/50">
  <div className="text-xl font-semibold tracking-tight bg-gradient-to-r
    from-[var(--cc-link)]/80 to-[var(--cc-link)]/60 bg-clip-text text-transparent">
    {value}
  </div>
  <div className="text-[12px] text-[var(--cc-body)] mt-1">{label}</div>
</div>`}
        />

        {/* ── Progress / Loading ── */}
        <ComponentShowcase
          title="Loading States"
          description="Spinners, skeleton loaders, and progress indicators"
          theme={theme}
          preview={
            <div className="space-y-4">
              {/* Spinners */}
              <div className="flex flex-wrap gap-6 items-center">
                <svg className="animate-spin h-6 w-6 text-[var(--cc-primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="inline-flex items-center gap-2 text-sm text-[var(--cc-muted)]">
                  <svg className="animate-spin h-4 w-4 text-[var(--cc-primary)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </span>
                <div className="flex gap-1">
                  <div className="size-3 rounded-full bg-[var(--cc-link)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="size-3 rounded-full bg-[var(--cc-link)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="size-3 rounded-full bg-[var(--cc-link)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>

              {/* Skeleton */}
              <div className="p-4 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline)] space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-[var(--cc-canvas-soft-2)]" />
                  <div className="flex-1">
                    <div className="h-3 bg-[var(--cc-canvas-soft-2)] rounded w-32 mb-2" />
                    <div className="h-2 bg-[var(--cc-canvas-soft-2)] rounded w-48" />
                  </div>
                </div>
                <div className="h-8 bg-[var(--cc-canvas-soft-2)]/50 rounded" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-6 bg-[var(--cc-canvas-soft-2)]/50 rounded" />
                  <div className="h-6 bg-[var(--cc-canvas-soft-2)]/50 rounded" />
                  <div className="h-6 bg-[var(--cc-canvas-soft-2)]/50 rounded" />
                </div>
              </div>
            </div>
          }
          code={`// Spinner
<svg className="animate-spin h-6 w-6 text-[var(--cc-link)]"
  viewBox="0 0 24 24" fill="none">
  <circle className="opacity-25" cx="12" cy="12" r="10"
    stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>

// Skeleton Loader
<div className="animate-pulse space-y-3">
  <div className="h-3 bg-[var(--cc-canvas-soft-2)] rounded w-32" />
  <div className="h-2 bg-[var(--cc-canvas-soft-2)] rounded w-48" />
  <div className="h-8 bg-[var(--cc-canvas-soft-2)]/50 rounded" />
</div>

// Dot loading
<div className="flex gap-1">
  <div className="size-3 rounded-full bg-[var(--cc-link)] animate-bounce"
    style={{ animationDelay: '0ms' }} />
  <div className="size-3 rounded-full bg-[var(--cc-link)] animate-bounce"
    style={{ animationDelay: '150ms' }} />
  <div className="size-3 rounded-full bg-[var(--cc-link)] animate-bounce"
    style={{ animationDelay: '300ms' }} />
</div>`}
        />

        {/* ── Toast / Notification ── */}
        <ComponentShowcase
          title="Toast Notifications"
          description="Success, error, info, and warning toasts"
          theme={theme}
          preview={
            <div className="space-y-3">
              {[
                { type: 'Success', icon: '✓', bg: 'bg-[var(--cc-success)]/15', border: 'border-[var(--cc-success)]/25', text: 'text-[var(--cc-success)]', desc: 'Transaction completed successfully' },
                { type: 'Error', icon: '✗', bg: 'bg-[var(--cc-error)]/15', border: 'border-[var(--cc-error)]/25', text: 'text-[var(--cc-error)]', desc: 'Connection failed: User rejected' },
                { type: 'Info', icon: 'ℹ', bg: 'bg-[var(--cc-link)]/15', border: 'border-[var(--cc-primary)]/25', text: 'text-[var(--cc-link)]', desc: 'Switching to Polygon network' },
                { type: 'Warning', icon: '⚠', bg: 'bg-[var(--cc-warning)]/15', border: 'border-[var(--cc-warning)]/25', text: 'text-[var(--cc-warning)]', desc: 'High gas prices detected' },
              ].map((t) => (
                <div key={t.type} className={`p-3 rounded-md ${t.bg} border ${t.border} flex items-start gap-3`}>
                  <span className={`text-lg ${t.text}`}>{t.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${t.text}`}>{t.type}</p>
                    <p className="text-xs text-[var(--cc-muted)] mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          }
          code={`// Toast Notification
import { useToast } from '@/lib/toast';

const { success, error, info, warning } = useToast();

// Usage:
success('Wallet Connected', '0x1a2b...3c4d on Ethereum');
error('Connection Failed', 'User rejected the request');
info('Network Switch', 'Switching to Polygon');
warning('High Gas', 'Gas prices are above average');`}
        />

        {/* ── Footer ── */}
        <div className="text-center py-8 border-t border-[var(--cc-hairline)]/50">
          <p className="text-sm text-[var(--cc-body)]">
            Cinacoin Component Gallery — {Object.keys(THEMES).length} themes × {8} components
          </p>
          <p className="text-xs text-[var(--cc-ink)] mt-1">
            All components use Tailwind CSS with consistent design tokens
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}

/* ── Toggle demo sub-component ── */

function ToggleDemo({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline)]/40">
      <div>
        <p className="text-sm font-medium text-[var(--cc-body)]">{label}</p>
        <p className="text-xs text-[var(--cc-body)]">{desc}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-[var(--cc-link)]' : 'bg-[var(--cc-canvas-soft-2)]'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--cc-canvas)] shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
