/**
 * @module types
 * Type definitions for the Verify SDK — contract safety scoring and phishing detection.
 */

// ─── Risk Level ────────────────────────────────────────────────────────────────

/**
 * Risk assessment level derived from the risk score.
 * - safe:       0 – 25
 * - warning:    26 – 50
 * - danger:     51 – 75
 * - critical:   76 – 100
 */
export type RiskLevel = 'safe' | 'warning' | 'danger' | 'critical';

// ─── Verify Flags ──────────────────────────────────────────────────────────────

/**
 * Known suspicious-behaviour patterns detected on a contract.
 *
 * | Flag                   | Meaning                                                      |
 * |------------------------|--------------------------------------------------------------|
 * | honeypot               | Buy allowed but sell blocked (or extremely taxed)            |
 * | rug_pull_risk          | High owner privileges that could enable a rug pull           |
 * | proxy_without_source   | Proxy contract whose implementation source is unverified     |
 * | unlimited_allowance    | ERC-20 approve() has no upper bound                          |
 * | blacklist_function     | Contract can blacklist addresses from trading                |
 * | mint_function          | Unlimited or very high mint capability                       |
 * | pause_function         | Contract can be paused, halting all transfers                |
 * | self_destruct          | contract contains a selfdestruct / CREATE2 self-destruct     |
 * | phishing_domain        | Contract interacts with or references a known phishing site  |
 * | clone_contract         | Contract is a near-exact clone of a known scam               |
 * | unverified_source      | Source code is not verified on any explorer                  |
 */
export type VerifyFlag =
  | 'honeypot'
  | 'rug_pull_risk'
  | 'proxy_without_source'
  | 'unlimited_allowance'
  | 'blacklist_function'
  | 'mint_function'
  | 'pause_function'
  | 'self_destruct'
  | 'phishing_domain'
  | 'clone_contract'
  | 'unverified_source';

// ─── Verify Report ─────────────────────────────────────────────────────────────

export interface VerifyReport {
  /** Contract address being scanned (checksummed). */
  contractAddress: string;

  /** EIP-155 chain ID. */
  chainId: number;

  /** Risk score 0-100; lower is safer. */
  riskScore: number;

  /** Human-friendly risk level derived from `riskScore`. */
  riskLevel: RiskLevel;

  /** Flags triggered during analysis. */
  flags: VerifyFlag[];

  /** Whether the contract is officially verified (matches a known dApp entry). */
  isVerified: boolean;

  /** Supplemental metadata collected during scanning. */
  metadata: {
    /** Contract / project name (if discoverable). */
    name?: string;
    /** Project website URL. */
    website?: string;
    /** Link to a public audit report. */
    audit?: string;
    /** Block timestamp of deployment. */
    deployedAt?: number;
  };

  /** UTC epoch-ms when this report was generated. */
  lastChecked: number;
}

// ─── Domain Verify Report ──────────────────────────────────────────────────────

export interface DomainVerifyReport {
  /** The domain that was checked. */
  domain: string;

  /** Whether the domain is known to be used for phishing. */
  isPhishing: boolean;

  /** 0-1 match against the closest legitimate domain (typosquatting score). */
  similarityScore: number;

  /** Whether the domain appears in the known dApp registry. */
  isKnownDApp: boolean;

  /** Whether the site has a valid SSL certificate. */
  sslValid: boolean;

  /** Closest known legitimate domain (empty string if none). */
  closestMatch: string;

  /** Supplemental details. */
  metadata: {
    sslExpiry?: string;
    registrar?: string;
    dAppName?: string;
    dAppCategory?: string;
  };

  /** UTC epoch-ms when this check was performed. */
  lastChecked: number;
}

// ─── Verify Options ────────────────────────────────────────────────────────────

export interface VerifyOptions {
  /** Etherscan (or compatible) API base URL per chain. */
  explorerApiUrls?: Record<number, string>;

  /** Etherscan API keys per chain. */
  explorerApiKeys?: Record<number, string>;

  /** Cache time-to-live in milliseconds (default 5 min). */
  cacheTtlMs?: number;

  /** Maximum number of concurrent scans in batch mode (default 10). */
  maxConcurrency?: number;

  /** Risk score threshold for `isSafe()` (default 25). */
  safeThreshold?: number;

  /** Custom flag weight overrides (default weights are in scanner). */
  flagWeights?: Partial<Record<VerifyFlag, number>>;
}

// ─── Scan Progress Event ───────────────────────────────────────────────────────

export interface ScanProgressEvent {
  /** Total contracts in the batch. */
  total: number;
  /** Number completed so far. */
  completed: number;
  /** Currently processing address (if available). */
  current?: string;
  /** Report for the just-finished scan (if available). */
  lastReport?: VerifyReport;
}

// ─── Scan Result (for batch) ───────────────────────────────────────────────────

export interface BatchScanResult {
  /** Individual reports keyed by contract address. */
  reports: Record<string, VerifyReport>;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Any errors encountered (keyed by address). */
  errors: Record<string, string>;
}

// ─── Explorer Source (internal helper type) ─────────────────────────────────────

export interface ExplorerSource {
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  isVerified: boolean;
  proxy?: string;
  implementation?: string;
}

// ─── Known dApp Entry ──────────────────────────────────────────────────────────

export type DAppCategory = 'dex' | 'lending' | 'nft' | 'bridge' | 'dao' | 'game';

export interface KnownDAppEntry {
  /** Human-friendly project name. */
  name: string;
  /** Primary domain (e.g. "uniswap.org"). */
  domain: string;
  /** Chains the dApp operates on (EIP-155 IDs). */
  chainIds: number[];
  /** Category of the dApp. */
  category: DAppCategory;
  /** Whether the project maintains official verification. */
  isOfficial: boolean;
  /** Contract addresses per chain (optional). */
  contracts?: Record<number, string[]>;
  /** Link to audit report. */
  auditUrl?: string;
}

// ─── Search Filters ─────────────────────────────────────────────────────────────

export interface DAppSearchFilters {
  category?: DAppCategory;
  chainId?: number;
  isOfficial?: boolean;
}
