"use client";

import { useState, useMemo } from "react";
import {
  getAllWallets,
  getWalletsForChainFamily,
  getWalletsByPlatform,
  getWalletsByType,
  getWcV2Wallets,
  getEIP6963Wallets,
  sortWallets,
  searchWallets,
  getChainFamilyCounts,
  getPlatformCounts,
  WALLET_COUNT,
} from "@cinacoin/wallet-registry";
import type { WalletRegistryEntry, WalletPlatform, WalletChainFamily } from "@cinacoin/wallet-registry";

// ============================================================
// Constants
// ============================================================

const CHAIN_FAMILIES: WalletChainFamily[] = [
  "evm", "solana", "bitcoin", "cosmos", "near", "polkadot",
  "aptos", "sui", "hedera", "xrpl", "starknet", "tron",
  "ton", "cardano", "algorand", "stellar", "flow", "tezos",
  "multiversx", "elrond",
];

const PLATFORMS: WalletPlatform[] = [
  "browser_extension", "mobile", "desktop", "hardware", "web", "cli",
];

const WALLET_TYPES = ["hot", "cold", "smart_contract", "custodial", "social", "embedded"];

const PLATFORM_LABELS: Record<WalletPlatform, string> = {
  browser_extension: "Browser Extension",
  mobile: "Mobile",
  desktop: "Desktop",
  hardware: "Hardware",
  web: "Web",
  cli: "CLI",
};

const CHAIN_LABELS: Record<string, string> = {
  evm: "EVM",
  solana: "Solana",
  bitcoin: "Bitcoin",
  cosmos: "Cosmos",
  near: "NEAR",
  polkadot: "Polkadot",
  aptos: "Aptos",
  sui: "Sui",
  hedera: "Hedera",
  xrpl: "XRPL",
  starknet: "Starknet",
  tron: "Tron",
  ton: "TON",
  cardano: "Cardano",
  algorand: "Algorand",
  stellar: "Stellar",
  flow: "Flow",
  tezos: "Tezos",
  multiversx: "MultiversX",
  elrond: "Elrond",
};

const TYPE_LABELS: Record<string, string> = {
  hot: "Hot Wallet",
  cold: "Cold/Hardware",
  smart_contract: "Smart Contract",
  custodial: "Custodial",
  social: "Social Login",
  embedded: "Embedded",
};

const SORT_OPTIONS = [
  { value: "popularity-desc", label: "Most Popular" },
  { value: "popularity-asc", label: "Least Popular" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "chainCount-desc", label: "Most Chains" },
];

// ============================================================
// Wallet Card Component
// ============================================================

function WalletCard({ wallet }: { wallet: WalletRegistryEntry }) {
  return (
    <a
      href={wallet.homepage}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-cina-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-cina-500"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
          {wallet.logo ? (
            <img
              src={wallet.logo}
              alt={wallet.name}
              className="h-10 w-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-lg font-semibold text-cina-600">
              {wallet.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-cina-600 dark:text-slate-100 dark:group-hover:text-cina-400">
            {wallet.name}
          </h3>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {wallet.developer ?? "Unknown"}
          </p>
        </div>
        {/* Popularity badge */}
        <span className="shrink-0 rounded-full bg-cina-50 px-2 py-0.5 text-xs font-medium text-cina-600 dark:bg-cina-900/50 dark:text-cina-400">
          {wallet.popularity}%
        </span>
      </div>

      {/* Description */}
      {wallet.description && (
        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
          {wallet.description}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {wallet.supportedChainFamilies.slice(0, 3).map((chain) => (
          <span
            key={chain}
            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          >
            {CHAIN_LABELS[chain] ?? chain}
          </span>
        ))}
        {wallet.supportedChainFamilies.length > 3 && (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            +{wallet.supportedChainFamilies.length - 3}
          </span>
        )}
      </div>

      {/* Platform icons */}
      <div className="flex flex-wrap gap-1.5">
        {wallet.platforms.map((p) => (
          <span
            key={p}
            className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400"
          >
            {PLATFORM_LABELS[p] ?? p}
          </span>
        ))}
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {wallet.supportsWalletConnectV2 && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            WC v2
          </span>
        )}
        {wallet.supportsEIP6963 && (
          <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            EIP-6963
          </span>
        )}
        {wallet.supportsAccountAbstraction && (
          <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">
            AA
          </span>
        )}
        {wallet.openSource && (
          <span className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            Open Source
          </span>
        )}
        {wallet.walletType && (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {TYPE_LABELS[wallet.walletType] ?? wallet.walletType}
          </span>
        )}
      </div>
    </a>
  );
}

// ============================================================
// Filter Panel Component
// ============================================================

interface FilterState {
  search: string;
  chainFamily: string;
  platform: string;
  walletType: string;
  sort: string;
  showWcV2: boolean;
  showEIP6963: boolean;
  showOpenSource: boolean;
}

function FilterPanel({
  filters,
  onFilterChange,
  chainCounts,
  platformCounts,
}: {
  filters: FilterState;
  onFilterChange: (f: Partial<FilterState>) => void;
  chainCounts: Record<string, number>;
  platformCounts: Record<string, number>;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    (filters.chainFamily ? 1 : 0) +
    (filters.platform ? 1 : 0) +
    (filters.walletType ? 1 : 0) +
    (filters.showWcV2 ? 1 : 0) +
    (filters.showEIP6963 ? 1 : 0) +
    (filters.showOpenSource ? 1 : 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search wallets..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-cina-400 focus:outline-none focus:ring-1 focus:ring-cina-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>

      {/* Toggle filters button (mobile) */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:hidden dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <span>
          Filters {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-cina-100 px-1.5 py-0.5 text-xs text-cina-600 dark:bg-cina-900 dark:text-cina-400">
              {activeFilterCount}
            </span>
          )}
        </span>
        <svg className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter content */}
      <div className={`${showFilters ? "" : "hidden"} mt-4 space-y-4 md:block`}>
        {/* Chain family */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Chain Family
          </label>
          <select
            value={filters.chainFamily}
            onChange={(e) => onFilterChange({ chainFamily: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cina-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">All Chains</option>
            {CHAIN_FAMILIES.filter(f => chainCounts[f]).map((f) => (
              <option key={f} value={f}>
                {CHAIN_LABELS[f] ?? f} ({chainCounts[f]})
              </option>
            ))}
          </select>
        </div>

        {/* Platform */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Platform
          </label>
          <select
            value={filters.platform}
            onChange={(e) => onFilterChange({ platform: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cina-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.filter(p => platformCounts[p]).map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]} ({platformCounts[p]})
              </option>
            ))}
          </select>
        </div>

        {/* Wallet type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Type
          </label>
          <select
            value={filters.walletType}
            onChange={(e) => onFilterChange({ walletType: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cina-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">All Types</option>
            {WALLET_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Sort By
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cina-400 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Feature toggles */}
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Features
          </label>
          {[
            { key: "showWcV2" as const, label: "WalletConnect v2" },
            { key: "showEIP6963" as const, label: "EIP-6963" },
            { key: "showOpenSource" as const, label: "Open Source" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => onFilterChange({ [key]: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-cina-600 focus:ring-cina-400"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Reset button */}
        {activeFilterCount > 0 && (
          <button
            onClick={() =>
              onFilterChange({
                chainFamily: "",
                platform: "",
                walletType: "",
                showWcV2: false,
                showEIP6963: false,
                showOpenSource: false,
              })
            }
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function WalletExplorerPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    chainFamily: "",
    platform: "",
    walletType: "",
    sort: "popularity-desc",
    showWcV2: false,
    showEIP6963: false,
    showOpenSource: false,
  });

  const allWallets = getAllWallets();
  const chainCounts = getChainFamilyCounts();
  const platformCounts = getPlatformCounts();

  const filteredWallets = useMemo(() => {
    let result = allWallets;

    // Search
    if (filters.search.trim()) {
      result = searchWallets(filters.search.trim());
    }

    // Chain family
    if (filters.chainFamily) {
      result = result.filter((w) => w.supportedChainFamilies.includes(filters.chainFamily as WalletChainFamily));
    }

    // Platform
    if (filters.platform) {
      result = result.filter((w) => w.platforms.includes(filters.platform as WalletPlatform));
    }

    // Wallet type
    if (filters.walletType) {
      result = result.filter((w) => w.walletType === filters.walletType);
    }

    // Feature toggles
    if (filters.showWcV2) {
      result = result.filter((w) => w.supportsWalletConnectV2);
    }
    if (filters.showEIP6963) {
      result = result.filter((w) => w.supportsEIP6963);
    }
    if (filters.showOpenSource) {
      result = result.filter((w) => w.openSource);
    }

    // Sort
    const [field, direction] = filters.sort.split("-") as [string, "asc" | "desc"];
    result = sortWallets(result, {
      field: field === "chainCount" ? "chainCount" : (field as "popularity" | "name" | "yearFounded"),
      direction,
    });

    return result;
  }, [allWallets, filters]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                🔢 Wallet Explorer
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Discover {WALLET_COUNT}+ wallets for every chain and platform.
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-1 text-sm text-cina-600 hover:text-cina-700 dark:text-cina-400"
            >
              ← Back to Cinacoin
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 lg:shrink-0">
            <FilterPanel
              filters={filters}
              onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
              chainCounts={chainCounts}
              platformCounts={platformCounts}
            />
          </aside>

          {/* Wallet grid */}
          <div className="flex-1">
            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-medium text-slate-700 dark:text-slate-200">{filteredWallets.length}</span> of{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{WALLET_COUNT}</span> wallets
              </p>
            </div>

            {filteredWallets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-600">
                <svg className="mb-4 h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium tracking-tight text-slate-500 dark:text-slate-400">
                  No wallets found
                </p>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredWallets.map((wallet) => (
                  <WalletCard key={wallet.id} wallet={wallet} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <p>
          © {new Date().getFullYear()} Cinacoin Wallet Explorer ·{" "}
          {WALLET_COUNT} wallets indexed ·{" "}
          <a href="https://github.com/cinagroup/Cinacoin" className="text-cina-600 hover:underline dark:text-cina-400">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
