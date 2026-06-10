"use client";

import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ChainConfig {
  id: string;
  name: string;
  chainId: number | string;
  rpcUrl: string;
  nativeCurrency: string;
  explorerUrl: string;
  enabled: boolean;
  network: "evm" | "solana" | "bitcoin" | "ton" | "tron" | "cosmos";
  mainnet: boolean;
}

const INITIAL_CHAINS: ChainConfig[] = [
  { id: "ethereum", name: "Ethereum", chainId: 1, rpcUrl: "https://eth.llamarpc.com", nativeCurrency: "ETH", explorerUrl: "https://etherscan.io", enabled: true, network: "evm", mainnet: true },
  { id: "polygon", name: "Polygon", chainId: 137, rpcUrl: "https://polygon-rpc.com", nativeCurrency: "MATIC", explorerUrl: "https://polygonscan.com", enabled: true, network: "evm", mainnet: true },
  { id: "bsc", name: "BNB Smart Chain", chainId: 56, rpcUrl: "https://bsc-dataseed.binance.org", nativeCurrency: "BNB", explorerUrl: "https://bscscan.com", enabled: true, network: "evm", mainnet: true },
  { id: "arbitrum", name: "Arbitrum One", chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc", nativeCurrency: "ETH", explorerUrl: "https://arbiscan.io", enabled: true, network: "evm", mainnet: true },
  { id: "optimism", name: "Optimism", chainId: 10, rpcUrl: "https://mainnet.optimism.io", nativeCurrency: "ETH", explorerUrl: "https://optimistic.etherscan.io", enabled: true, network: "evm", mainnet: true },
  { id: "base", name: "Base", chainId: 8453, rpcUrl: "https://mainnet.base.org", nativeCurrency: "ETH", explorerUrl: "https://basescan.org", enabled: false, network: "evm", mainnet: true },
  { id: "avalanche", name: "Avalanche C-Chain", chainId: 43114, rpcUrl: "https://api.avax.network/ext/bc/C/rpc", nativeCurrency: "AVAX", explorerUrl: "https://snowtrace.io", enabled: false, network: "evm", mainnet: true },
  { id: "solana", name: "Solana", chainId: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", rpcUrl: "https://api.mainnet-beta.solana.com", nativeCurrency: "SOL", explorerUrl: "https://explorer.solana.com", enabled: true, network: "solana", mainnet: true },
  { id: "bitcoin", name: "Bitcoin", chainId: "btc-mainnet", rpcUrl: "", nativeCurrency: "BTC", explorerUrl: "https://blockstream.info", enabled: true, network: "bitcoin", mainnet: true },
  { id: "ton", name: "TON", chainId: "-239", rpcUrl: "https://toncenter.com/api/v2", nativeCurrency: "TON", explorerUrl: "https://tonscan.org", enabled: false, network: "ton", mainnet: true },
  { id: "tron", name: "TRON", chainId: "0x2b6653dc", rpcUrl: "https://api.trongrid.io", nativeCurrency: "TRX", explorerUrl: "https://tronscan.org", enabled: false, network: "tron", mainnet: true },
  { id: "cosmos", name: "Cosmos Hub", chainId: "cosmoshub-4", rpcUrl: "https://rpc-cosmoshub.blockapsis.com", nativeCurrency: "ATOM", explorerUrl: "https://www.mintscan.io/cosmos", enabled: false, network: "cosmos", mainnet: true },
];

const NETWORK_COLORS: Record<string, string> = {
  evm: "#0070f3",
  solana: "#7928ca",
  bitcoin: "#f5a623",
  ton: "#0070f3",
  tron: "#ee0000",
  cosmos: "#888888",
};

export default function ChainsPage() {
  const [chains, setChains] = useState<ChainConfig[]>(INITIAL_CHAINS);
  const [filter, setFilter] = useState<string>("all");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredChains = filter === "all" ? chains : chains.filter((c) => c.network === filter);
  const enabledCount = chains.filter((c) => c.enabled).length;

  const toggleChain = (id: string) => {
    setChains((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const handleSave = () => {
    setSaving(true);
    // Simulate async save
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Networks & Chains</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">
            Configure supported blockchain networks — {enabledCount} of {chains.length} enabled
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          aria-label={saved ? "Changes saved" : "Save chain configuration changes"}
          className="cc-btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? "⋯ Saving" : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      {saved && (
        <div className="bg-[var(--cc-success)]/10 border border-[var(--cc-success)]/30 rounded-[var(--cc-radius-md)] px-4 py-3 cc-body-sm text-[var(--cc-success)]">
          ✓ Chain configuration saved successfully
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cc-card p-4">
          <p className="cc-caption text-[var(--cc-muted)]">Total Networks</p>
          <p className="cc-display-sm text-[var(--cc-ink)]">{chains.length}</p>
        </div>
        <div className="cc-card p-4">
          <p className="cc-caption text-[var(--cc-muted)]">Enabled</p>
          <p className="cc-display-sm text-[var(--cc-success)]">{enabledCount}</p>
        </div>
        <div className="cc-card p-4">
          <p className="cc-caption text-[var(--cc-muted)]">EVM Chains</p>
          <p className="cc-display-sm text-[var(--cc-link)]">{chains.filter((c) => c.network === "evm").length}</p>
        </div>
        <div className="cc-card p-4">
          <p className="cc-caption text-[var(--cc-muted)]">Non-EVM</p>
          <p className="cc-display-sm text-[var(--cc-warning)]">{chains.filter((c) => c.network !== "evm").length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Network filter">
        {[
          { key: "all", label: "All" },
          { key: "evm", label: "EVM" },
          { key: "solana", label: "Solana" },
          { key: "bitcoin", label: "Bitcoin" },
          { key: "ton", label: "TON" },
          { key: "tron", label: "TRON" },
          { key: "cosmos", label: "Cosmos" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className="cc-tab-ghost"
            data-active={filter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chain list */}
      <div className="cc-card-soft overflow-hidden">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[var(--cc-hairline)]">
              <th scope="col" className="ds-table-header">Network</th>
              <th scope="col" className="ds-table-header">Chain ID</th>
              <th scope="col" className="ds-table-header">RPC URL</th>
              <th scope="col" className="ds-table-header">Explorer</th>
              <th scope="col" className="ds-table-header text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredChains.map((chain) => (
              <tr key={chain.id} className="ds-table-row">
                <td className="ds-table-cell">
                  <div className="flex items-center gap-2">
                    <span className="cc-body-sm-strong text-[var(--cc-ink)]">{chain.name}</span>
                    <span
                      className="cc-caption px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${NETWORK_COLORS[chain.network]}20`, color: NETWORK_COLORS[chain.network] }}
                    >
                      {chain.network}
                    </span>
                  </div>
                </td>
                <td className="ds-table-cell">
                  <code className="cc-code bg-[var(--cc-canvas-soft-2)] px-2 py-1 rounded">
                    {typeof chain.chainId === "number" ? chain.chainId.toString() : chain.chainId}
                  </code>
                </td>
                <td className="ds-table-cell">
                  <span className="cc-code text-[var(--cc-muted)] truncate max-w-[200px] block">
                    {chain.rpcUrl || "—"}
                  </span>
                </td>
                <td className="ds-table-cell">
                  <a href={chain.explorerUrl} target="_blank" rel="noopener noreferrer" className="cc-caption text-[var(--cc-link)] hover:underline">
                    {chain.explorerUrl.replace("https://", "")}
                  </a>
                </td>
                <td className="ds-table-cell text-center">
                  <button
                    onClick={() => toggleChain(chain.id)}
                    role="switch"
                    aria-checked={chain.enabled}
                    aria-label={`Toggle ${chain.name} ${chain.enabled ? 'off' : 'on'}`}
                    className={`relative w-10 h-5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cc-link)] ${
                      chain.enabled ? "bg-[var(--cc-success)]" : "bg-[var(--cc-hairline)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--cc-canvas)] shadow transition-transform ${
                        chain.enabled ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom chain add */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-2">Add Custom Network</h3>
        <p className="cc-body-sm text-[var(--cc-muted)] mb-4">
          Add a custom EVM-compatible chain or non-EVM network for your AppKit configuration.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" placeholder="Network name (e.g. zkSync Era)" aria-label="Network name" className="cc-form-input" />
          <input type="text" placeholder="Chain ID (e.g. 324)" aria-label="Chain ID" className="cc-form-input" />
          <input type="text" placeholder="RPC URL" aria-label="RPC URL" className="cc-form-input" />
          <input type="text" placeholder="Native currency symbol (e.g. ETH)" aria-label="Native currency symbol" className="cc-form-input" />
        </div>
        <div className="mt-4 flex justify-end">
          <button className="cc-btn-primary-sm" aria-label="Add custom network">+ Add Network</button>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
