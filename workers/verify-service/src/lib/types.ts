/**
 * Types for CINAcoin Verify API Service
 */

export interface Env {
  VERIFY_KV: KVNamespace;
  ADMIN_API_KEY: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  DNS_TXT_PREFIX: string;
  CACHE_TTL_SECONDS: string;
  MAX_REGISTERED_DOMAINS: string;
  DNS_OVER_HTTPS_PROVIDER?: string;
}

/**
 * Verification status for a domain
 */
export type VerificationStatus = 'verified' | 'unverified' | 'pending' | 'expired' | 'not_found';

/**
 * Domain registration record stored in KV
 */
export interface DomainRecord {
  /** The registered domain name (e.g. "example.com") */
  domain: string;
  /** The verification token that must appear in DNS TXT record */
  token: string;
  /** Current verification status */
  status: VerificationStatus;
  /** ISO timestamp when the domain was registered */
  registeredAt: string;
  /** ISO timestamp of last successful DNS verification */
  lastVerifiedAt: string | null;
  /** ISO timestamp when the verification expires */
  expiresAt: string | null;
  /** Optional: human-readable name of the dApp */
  appName: string | null;
  /** Optional: contact email */
  contactEmail: string | null;
  /** Number of times verification has been checked */
  checkCount: number;
}

/**
 * Result returned when checking a domain
 */
export interface VerifyResult {
  domain: string;
  status: VerificationStatus;
  verified: boolean;
  appName: string | null;
  lastVerifiedAt: string | null;
  expiresAt: string | null;
  /** Human-readable message */
  message: string;
}

/**
 * Request body for domain registration
 */
export interface RegisterRequest {
  domain: string;
  appName?: string;
  contactEmail?: string;
}

/**
 * Cached DNS lookup result
 */
export interface DnsCacheEntry {
  domain: string;
  records: string[];
  fetchedAt: number; // epoch ms
}

/**
 * DNS-over-HTTPS response (Cloudflare format)
 */
export interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
  Question?: DohQuestion[];
}

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohQuestion {
  name: string;
  type: number;
}

/**
 * API error shape
 */
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
