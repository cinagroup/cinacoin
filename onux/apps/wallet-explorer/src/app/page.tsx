"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { WalletConnect } from "@/components/WalletConnect";
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

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 200;

// ============================================================
// Skeleton Card (loading state)
// ============================================================

function WalletCardSkeleton() {
  return (
    <div className="vercel-card animate-fade-in animate-pulse" aria-hidden="true">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--vercel-radius-md)] border border-[var(--vercel-hairline)] bg-[var(--vercel-canvas-soft-2)]">
          <div className="h-8 w-8 rounded-[var(--vercel-radius-sm)] bg-[var(--vercel-hairline)]" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-[var(--vercel-radius-sm)] bg-[var(--vercel-hairline)]" />
          <div className="h-3 w-1/3 rounded-[var(--vercel-radius-sm)] bg-[var(--vercel-hairline)]" />
        </div>
      </div>
      <div className="mt-3 h-3 w-full rounded-[var(--vercel-radius-sm)] bg-[var(--vercel-hairline)]" />
      <div className="mt-3 h-3 w-5/6 rounded-[var(--vercel-radius-sm)] bg-[var(--vercel-hairline)]" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-14 rounded-full bg-[var(--vercel-hairline)]" />
        <div className="h-5 w-12 rounded-full bg-[var(--vercel-hairline)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--vercel-hairline)]" />
      </div>
    </div>
  );
}

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
      className="vercel-card group flex flex-col gap-3 no-underline focus-visible:outline-2 focus-visible:outline-[var(--vercel-link)] focus-visible:outline-offset-2"
      aria-label={`${wallet.name} wallet by ${wallet.developer ?? "Unknown"}. Supports: ${wallet.supportedChainFamilies.map(c => CHAIN_LABELS[c] ?? c).join(", ")}. Platforms: ${wallet.platforms.map(p => PLATFORM_LABELS[p] ?? p).join(", ")}. Popularity: ${wallet.popularity}%. Opens in new tab.`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--vercel-radius-md)] border border-[var(--vercel-hairline)] bg-[var(--vercel-canvas-soft-2)]">
          {showImage ? (
            <img
              src={wallet.logo}
              alt={`${wallet.name} wallet logo`}
              className="h-10 w-10 object-contain"
              loading="lazy"
              decoding="async"
              onError={() => setLogoFailed(true)}
              width={40}
              height={40}
            />
          ) : (
            <span className="vercel-display-sm text-[var(--vercel-ink)]" aria-hidden="true">
              {wallet.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate vercel-body-md font-medium text-[var(--vercel-ink)] group-hover:text-[var(--vercel-link)] transition-colors">
            {wallet.name}
          </h3>
          <p className="truncate vercel-caption text-[var(--vercel-mute)]">
            {wallet.developer ?? "Unknown developer"}
          </p>
        </div>
        {/* Popularity badge */}
        <span className="shrink-0 vercel-badge" aria-label={`Popularity: ${wallet.popularity} percent`}>
          {wallet.popularity}%
        </span>
      </div>

      {/* Description */}
      {wallet.description && (
        <p className="line-clamp-2 vercel-body-sm text-[var(--vercel-body)]">
          {wallet.description}
        </p>
      )}

      {/* Chain tags */}
      <div className="flex flex-wrap gap-1.5" aria-label="Supported chain families">
        {wallet.supportedChainFamilies.slice(0, 3).map((chain) => (
          <span
            key={chain}
            className="vercel-badge"
          >
            {CHAIN_LABELS[chain] ?? chain}
          </span>
        ))}
        {wallet.supportedChainFamilies.length > 3 && (
          <span className="vercel-badge" aria-label={`${wallet.supportedChainFamilies.length - 3} more chains`}>
            +{wallet.supportedChainFamilies.length - 3}
          </span>
        )}
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap gap-1.5" aria-label="Supported platforms">
        {wallet.platforms.map((p) => (
          <span
            key={p}
            className="vercel-badge bg-[var(--vercel-canvas)]"
          >
            {PLATFORM_LABELS[p] ?? p}
          </span>
        ))}
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Features">
        {wallet.supportsWalletConnectV2 && (
          <span className="vercel-badge" style={{ background: '#d3e5ff', color: '#0761d1' }}>
            WC v2
          </span>
        )}
        {wallet.supportsEIP6963 && (
          <span className="vercel-badge" style={{ background: '#d8ccf1', color: '#4c2889' }}>
            EIP-6963
          </span>
        )}
        {wallet.supportsAccountAbstraction && (
          <span className="vercel-badge" style={{ background: '#aaffec', color: '#29bc9b' }}>
            AA
          </span>
        )}
        {wallet.openSource && (
          <span className="vercel-badge" style={{ background: '#ffefcf', color: '#ab570a' }}>
            Open Source
          </span>
        )}
        {wallet.walletType && (
          <span className="vercel-badge">
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
  resultCount,
}: {
  filters: FilterState;
  onFilterChange: (f: Partial<FilterState>) => void;
  chainCounts: Record<string, number>;
  platformCounts: Record<string, number>;
  resultCount: number;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeFilterCount =
    (filters.chainFamily ? 1 : 0) +
    (filters.platform ? 1 : 0) +
    (filters.walletType ? 1 : 0) +
    (filters.showWcV2 ? 1 : 0) +
    (filters.showEIP6963 ? 1 : 0) +
    (filters.showOpenSource ? 1 : 0);

  return (
    <div className="vercel-card" style={{ padding: '20px' }} role="search" aria-label="Wallet filters">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vercel-mute)] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <label htmlFor="wallet-search" className="sr-only">Search wallets</label>
        <input
          ref={searchRef}
          type="search"
          id="wallet-search"
          placeholder="Search wallets..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="vercel-input pl-10"
          autoComplete="off"
        />
      </div>

      {/* Toggle filters button (mobile) */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        aria-expanded={showFilters}
        aria-controls="filter-content"
        className="vercel-btn-secondary mt-3 flex w-full items-center justify-between md:hidden"
      >
        <span>
          Filters {activeFilterCount > 0 && (
            <span className="ml-1 vercel-badge" aria-hidden="true">
              {activeFilterCount}
            </span>
          )}
        </span>
        <svg className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter content */}
      <div
        id="filter-content"
        className={`${showFilters ? "" : "hidden"} mt-4 space-y-4 md:block`}
        aria-hidden={!showFilters}
      >
        {/* Chain family */}
        <div>
          <label htmlFor="chain-family-select" className="mb-1.5 block vercel-caption-mono text-[var(--vercel-mute)]">
            Chain family
          </label>
          <select
            id="chain-family-select"
            value={filters.chainFamily}
            onChange={(e) => onFilterChange({ chainFamily: e.target.value })}
            className="vercel-input"
            aria-label="Filter by chain family"
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
          <label htmlFor="platform-select" className="mb-1.5 block vercel-caption-mono text-[var(--vercel-mute)]">
            Platform
          </label>
          <select
            id="platform-select"
            value={filters.platform}
            onChange={(e) => onFilterChange({ platform: e.target.value })}
            className="vercel-input"
            aria-label="Filter by platform"
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
          <label htmlFor="wallet-type-select" className="mb-1.5 block vercel-caption-mono text-[var(--vercel-mute)]">
            Type
          </label>
          <select
            id="wallet-type-select"
            value={filters.walletType}
            onChange={(e) => onFilterChange({ walletType: e.target.value })}
            className="vercel-input"
            aria-label="Filter by wallet type"
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
          <label htmlFor="sort-select" className="mb-1.5 block vercel-caption-mono text-[var(--vercel-mute)]">
            Sort by
          </label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value })}
            className="vercel-input"
            aria-label="Sort wallets"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Feature toggles */}
        <fieldset className="space-y-2 border-0 p-0">
          <legend className="mb-1.5 block vercel-caption-mono text-[var(--vercel-mute)]">
            Features
          </legend>
          {[
            { key: "showWcV2" as const, label: "WalletConnect v2", id: "wc-v2" },
            { key: "showEIP6963" as const, label: "EIP-6963", id: "eip-6963" },
            { key: "showOpenSource" as const, label: "Open Source", id: "open-source" },
          ].map(({ key, label, id }) => (
            <label key={key} htmlFor={id} className="flex items-center gap-2 vercel-body-sm text-[var(--vercel-body)] cursor-pointer">
              <input
                type="checkbox"
                id={id}
                checked={filters[key]}
                onChange={(e) => onFilterChange({ [key]: e.target.checked })}
                className="h-4 w-4 rounded-[var(--vercel-radius-sm)] border-[var(--vercel-hairline)] text-[var(--vercel-link)] bg-[var(--vercel-canvas)] focus:ring-[var(--vercel-link)] focus:ring-offset-[var(--vercel-canvas)]"
              />
              {label}
            </label>
          ))}
        </fieldset>

        {/* Reset button */}
        {activeFilterCount > 0 && (
          <button
            type="button"
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
            className="vercel-btn-secondary w-full"
            aria-label="Reset all filters"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Infinite Scroll Hook
// ============================================================

function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observer = useRef<IntersectionObserver | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) callback();
      }, { rootMargin: "200px" });
      if (node) observer.current.observe(node);
    },
    [callback, hasMore],
  );
  return sentinelRef;
}

// ============================================================
// Debounce Hook
// ============================================================

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// Cleanup observer on unmount
function useInfiniteScrollCleanup() {
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        // observers will be GC'd; this is a safety net
      }
    };
  }, []);
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

  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debounced search to avoid re-filtering on every keystroke
  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_MS);

  const allWallets = useMemo(() => getAllWallets(), []);
  const chainCounts = useMemo(() => getChainFamilyCounts(), []);
  const platformCounts = useMemo(() => getPlatformCounts(), []);

  // Simulate initial load
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const filteredWallets = useMemo(() => {
    let result = allWallets;

    // Search (debounced)
    if (debouncedSearch.trim()) {
      result = searchWallets(debouncedSearch.trim());
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
  }, [allWallets, debouncedSearch, filters.chainFamily, filters.platform, filters.walletType, filters.sort, filters.showWcV2, filters.showEIP6963, filters.showOpenSource]);

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const hasMore = visibleCount < filteredWallets.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredWallets.length));
  }, [filteredWallets.length]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  const visibleWallets = filteredWallets.slice(0, visibleCount);

  // Compute active filter labels for screen reader announcement
  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.chainFamily) parts.push(`chain: ${CHAIN_LABELS[filters.chainFamily] ?? filters.chainFamily}`);
    if (filters.platform) parts.push(`platform: ${PLATFORM_LABELS[filters.platform as WalletPlatform] ?? filters.platform}`);
    if (filters.walletType) parts.push(`type: ${TYPE_LABELS[filters.walletType] ?? filters.walletType}`);
    if (filters.showWcV2) parts.push("WalletConnect v2");
    if (filters.showEIP6963) parts.push("EIP-6963");
    if (filters.showOpenSource) parts.push("Open Source");
    return parts.length > 0 ? `Active filters: ${parts.join(", ")}.` : "";
  }, [filters]);

  // Announce results count to screen readers on filter change
  const resultsAnnouncement = useMemo(() => {
    if (!loading) {
      return `${filteredWallets.length} wallet${filteredWallets.length !== 1 ? "s" : ""} found.`;
    }
    return "";
  }, [filteredWallets.length, loading]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--vercel-canvas-soft)', color: 'var(--vercel-ink)' }}>
      {/* Skip to content link for accessibility */}
      <a
        href="#wallet-grid"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-[var(--vercel-radius-sm)]"
        style={{ background: 'var(--vercel-primary)', color: 'var(--vercel-on-primary)' }}
      >
        Skip to wallet grid
      </a>

      {/* Vercel-style Header */}
      <header className="vercel-header" aria-label="Site header">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-full">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Cinacoin" className="h-6 w-auto" />
            <span className="vercel-body-sm font-medium" style={{ color: 'var(--vercel-ink)' }}>Wallet Explorer</span>
          </a>
          
          {/* Search bar in header */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vercel-mute)] pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search wallets..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="vercel-input pl-10"
                autoComplete="off"
              />
            </div>
          </div>
          
          {/* Nav links */}
          <nav className="flex items-center gap-3">
            <a href="https://docs.cinacoin.com" className="vercel-body-sm hidden md:inline-block no-underline" style={{ color: 'var(--vercel-body)' }}>Docs</a>
            <a href="https://cinacoin.com" className="vercel-btn-secondary hidden md:inline-flex" style={{ height: '32px', fontSize: '13px', padding: '0 12px' }}>← Back</a>
            <WalletConnect />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: 'var(--vercel-hairline)', background: 'var(--vercel-canvas)' }}>
        {/* Atmospheric mesh gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 vercel-mesh-gradient" aria-hidden="true" />
        <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-16 relative z-10">
          <h1 className="vercel-display-xl mb-3" style={{ color: 'var(--vercel-ink)' }}>
            Wallet explorer.
          </h1>
          <p className="vercel-body-lg max-w-2xl" style={{ color: 'var(--vercel-body)' }}>
            Discover {WALLET_COUNT}+ wallets for every chain and platform.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 lg:shrink-0" aria-label="Filters">
            <FilterPanel
              filters={filters}
              onFilterChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
              chainCounts={chainCounts}
              platformCounts={platformCounts}
              resultCount={filteredWallets.length}
            />
          </aside>

          {/* Wallet grid */}
          <div className="flex-1" ref={contentRef}>
            {/* Results count */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="vercel-caption-mono" style={{ color: 'var(--vercel-mute)' }}>
                Showing <span className="vercel-body-sm font-medium" style={{ color: 'var(--vercel-ink)' }}>{visibleWallets.length}</span> of{" "}
                <span className="vercel-body-sm font-medium" style={{ color: 'var(--vercel-ink)' }}>{filteredWallets.length}</span> wallets
              </p>
            </div>

            {/* Screen reader live region for results */}
            <div role="status" aria-live="polite" className="sr-only" aria-atomic="true">
              {resultsAnnouncement}
              {activeFiltersSummary}
            </div>

            {filteredWallets.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center rounded-[var(--vercel-radius-md)] border border-dashed py-16 text-center" style={{ borderColor: 'var(--vercel-hairline-strong)', background: 'var(--vercel-canvas)' }} role="status">
                <svg className="mb-4 h-12 w-12" style={{ color: 'var(--vercel-mute)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="vercel-display-md" style={{ color: 'var(--vercel-ink)' }}>
                  No wallets found
                </p>
                <p className="vercel-body-sm mt-1" style={{ color: 'var(--vercel-body)' }}>
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div
                id="wallet-grid"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                aria-label="Wallet list"
              >
                {loading
                  ? Array.from({ length: 12 }).map((_, i) => <WalletCardSkeleton key={i} />)
                  : visibleWallets.map((wallet) => (
                      <WalletCard key={wallet.id} wallet={wallet} />
                    ))
                }
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasMore && !loading && (
              <div ref={sentinelRef} className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--vercel-link)' }} />
                  <span className="vercel-caption-mono" style={{ color: 'var(--vercel-mute)' }}>
                    Loading more wallets…
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Vercel-style Footer */}
      <footer style={{ background: 'var(--vercel-canvas)', borderTop: '1px solid var(--vercel-hairline)', padding: '64px 24px' }}>
        <div className="max-w-[1400px] mx-auto flex flex-wrap gap-12 justify-between">
          <div className="max-w-[280px] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Cinacoin" className="h-5 w-auto" />
              <span className="vercel-body-sm font-medium" style={{ color: 'var(--vercel-ink)' }}>Cinacoin</span>
            </div>
            <p className="vercel-body-sm" style={{ color: 'var(--vercel-mute)' }}>
              Discover {WALLET_COUNT}+ wallets for every chain and platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="vercel-caption-mono mb-3" style={{ color: 'var(--vercel-mute)' }}>EXPLORER</p>
              <a href="https://wallet.cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>All wallets</a>
              <a href="https://docs.cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>Docs</a>
            </div>
            <div>
              <p className="vercel-caption-mono mb-3" style={{ color: 'var(--vercel-mute)' }}>DEVELOPERS</p>
              <a href="https://github.com/cinagroup" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>GitHub</a>
              <a href="https://demo.cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>Demo</a>
            </div>
            <div>
              <p className="vercel-caption-mono mb-3" style={{ color: 'var(--vercel-mute)' }}>COMPANY</p>
              <a href="https://cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>Back to Cinacoin</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-12 pt-6" style={{ borderTop: '1px solid var(--vercel-hairline)' }}>
          <p className="vercel-caption" style={{ color: 'var(--vercel-mute)' }}>
            © {new Date().getFullYear()} Cinacoin. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
