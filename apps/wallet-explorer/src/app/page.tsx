"use client";

import { useState, useMemo } from "react";
import { SiteHeader, SiteFooter } from "@cinacoin/ui";
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
  const [logoFailed, setLogoFailed] = useState(false);
  const showImage = wallet.logo && !logoFailed;
  return (
    <a
      href={wallet.homepage}
      target="_blank"
      rel="noopener noreferrer"
      className="cc-card group flex flex-col gap-3 border border-[var(--cc-hairline)]"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft-2)]">
          {showImage ? (
            <img
              src={wallet.logo}
              alt={wallet.name}
              className="h-10 w-10 object-contain"
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="text-lg font-semibold text-[var(--cc-ink)]">
              {wallet.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--cc-ink)] group-hover:text-[var(--cc-link)] transition-colors">
            {wallet.name}
          </h3>
          <p className="truncate text-xs text-[var(--cc-muted)]">
            {wallet.developer ?? "Unknown"}
          </p>
        </div>
        {/* Popularity badge */}
        <span className="shrink-0 cc-badge h-5">
          {wallet.popularity}%
        </span>
      </div>

      {/* Description */}
      {wallet.description && (
        <p className="line-clamp-2 text-sm text-[var(--cc-body)]">
          {wallet.description}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {wallet.supportedChainFamilies.slice(0, 3).map((chain) => (
          <span
            key={chain}
            className="rounded bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] px-2 py-0.5 text-xs font-medium text-[var(--cc-body)]"
          >
            {CHAIN_LABELS[chain] ?? chain}
          </span>
        ))}
        {wallet.supportedChainFamilies.length > 3 && (
          <span className="rounded bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] px-2 py-0.5 text-xs font-medium text-[var(--cc-muted)]">
            +{wallet.supportedChainFamilies.length - 3}
          </span>
        )}
      </div>

      {/* Platform icons */}
      <div className="flex flex-wrap gap-1.5">
        {wallet.platforms.map((p) => (
          <span
            key={p}
            className="rounded border border-[var(--cc-hairline)] px-2 py-0.5 text-xs text-[var(--cc-muted)] bg-[var(--cc-canvas)]"
          >
            {PLATFORM_LABELS[p] ?? p}
          </span>
        ))}
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {wallet.supportsWalletConnectV2 && (
          <span className="rounded bg-[var(--cc-link-bg-soft)] text-[var(--cc-link-deep)] dark:bg-[var(--cc-link-bg-soft)]/20 dark:text-[var(--cc-link)] px-2 py-0.5 text-xs font-medium">
            WC v2
          </span>
        )}
        {wallet.supportsEIP6963 && (
          <span className="rounded bg-[var(--cc-violet-soft)] text-[var(--cc-violet-deep)] dark:bg-[var(--cc-violet-soft)]/20 dark:text-[var(--cc-violet)] px-2 py-0.5 text-xs font-medium">
            EIP-6963
          </span>
        )}
        {wallet.supportsAccountAbstraction && (
          <span className="rounded bg-[var(--cc-cyan-soft)] text-[var(--cc-cyan-deep)] dark:bg-[var(--cc-cyan-soft)]/20 dark:text-[var(--cc-cyan)] px-2 py-0.5 text-xs font-medium">
            AA
          </span>
        )}
        {wallet.openSource && (
          <span className="rounded bg-[var(--cc-warning-soft)] text-[var(--cc-warning-deep)] dark:bg-[var(--cc-warning-soft)]/20 dark:text-[var(--cc-warning)] px-2 py-0.5 text-xs font-medium">
            Open Source
          </span>
        )}
        {wallet.walletType && (
          <span className="rounded bg-[var(--cc-canvas-soft-2)] text-[var(--cc-body)] border border-[var(--cc-hairline)] px-2 py-0.5 text-xs font-medium">
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
    <div className="rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-5 shadow-sm">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cc-muted)]"
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
          className="cc-form-input pl-10"
        />
      </div>

      {/* Toggle filters button (mobile) */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mt-3 flex w-full items-center justify-between border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 h-10 rounded-[6px] text-sm font-medium text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft-2)] md:hidden transition-colors"
      >
        <span>
          Filters {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-[var(--cc-canvas-soft-2)] px-1.5 py-0.5 text-xs text-[var(--cc-body)] border border-[var(--cc-hairline)]">
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
          <label className="mb-1.5 block cc-caption-mono text-[var(--cc-muted)]">
            Chain family
          </label>
          <select
            value={filters.chainFamily}
            onChange={(e) => onFilterChange({ chainFamily: e.target.value })}
            className="cc-form-input"
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
          <label className="mb-1.5 block cc-caption-mono text-[var(--cc-muted)]">
            Platform
          </label>
          <select
            value={filters.platform}
            onChange={(e) => onFilterChange({ platform: e.target.value })}
            className="cc-form-input"
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
          <label className="mb-1.5 block cc-caption-mono text-[var(--cc-muted)]">
            Type
          </label>
          <select
            value={filters.walletType}
            onChange={(e) => onFilterChange({ walletType: e.target.value })}
            className="cc-form-input"
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
          <label className="mb-1.5 block cc-caption-mono text-[var(--cc-muted)]">
            Sort by
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value })}
            className="cc-form-input"
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
          <label className="mb-1.5 block cc-caption-mono text-[var(--cc-muted)]">
            Features
          </label>
          {[
            { key: "showWcV2" as const, label: "WalletConnect v2" },
            { key: "showEIP6963" as const, label: "EIP-6963" },
            { key: "showOpenSource" as const, label: "Open Source" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-[var(--cc-body)] cursor-pointer">
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => onFilterChange({ [key]: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--cc-hairline)] text-[var(--cc-link)] bg-[var(--cc-canvas)] focus:ring-0 focus:ring-offset-0"
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
            className="w-full inline-flex items-center justify-center bg-[var(--cc-canvas)] text-[var(--cc-ink)] border border-[var(--cc-hairline-strong)] rounded-[6px] text-xs font-medium h-9 hover:border-[var(--cc-body)] transition-colors"
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
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      {/* Shared site header from @cinacoin/ui */}
      <SiteHeader
        sublabel="Wallet Explorer"
        links={[
          { label: 'Docs', href: 'https://docs.cinacoin.com' },
          { label: '← Back to Cinacoin', href: 'https://cinacoin.com' },
        ]}
      />

      {/* Hero Section */}
      <section className="border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="cc-display-xl text-[var(--cc-ink)] mb-3">
            Wallet explorer
          </h1>
          <p className="cc-body-lg text-[var(--cc-body)] max-w-2xl">
            Discover {WALLET_COUNT}+ wallets for every chain and platform.
          </p>
        </div>
      </section>

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
              <p className="text-sm text-[var(--cc-muted)]">
                Showing <span className="font-semibold text-[var(--cc-ink)]">{filteredWallets.length}</span> of{" "}
                <span className="font-semibold text-[var(--cc-ink)]">{WALLET_COUNT}</span> wallets
              </p>
            </div>

            {filteredWallets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--cc-hairline-strong)] py-16 text-center bg-[var(--cc-canvas)]">
                <svg className="mb-4 h-12 w-12 text-[var(--cc-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-semibold tracking-tight text-[var(--cc-ink)]">
                  No wallets found
                </p>
                <p className="mt-1 text-sm text-[var(--cc-body)]">
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

      {/* Shared site footer from @cinacoin/ui */}
      <SiteFooter
        tagline={`Discover ${WALLET_COUNT}+ wallets for every chain and platform.`}
        columns={[
          {
            heading: 'Explorer',
            links: [
              { label: 'All wallets', href: 'https://wallet.cinacoin.com' },
              { label: 'Docs', href: 'https://docs.cinacoin.com' },
            ],
          },
          {
            heading: 'Developers',
            links: [
              { label: 'GitHub', href: 'https://github.com/cinagroup' },
              { label: 'Demo', href: 'https://demo.cinacoin.com' },
            ],
          },
          {
            heading: 'Company',
            links: [{ label: 'Back to Cinacoin', href: 'https://cinacoin.com' }],
          },
        ]}
      />
    </div>
  );
}
