/**
 * CINAcoin Verify API - Frontend Integration SDK
 * 
 * Lightweight client for wallet/dApp integration.
 * Call this when establishing wallet connections to verify dApp domain authenticity.
 */

const VERIFY_API_BASE = 'https://verify.cinacoin.com';

export type VerificationStatus = 'verified' | 'unverified' | 'pending' | 'expired' | 'not_found';

export interface VerifyResult {
  domain: string;
  verified: boolean;
  status: VerificationStatus;
  appName: string | null;
  lastVerifiedAt: string | null;
  expiresAt: string | null;
}

export interface VerifyClientOptions {
  /** Override the default API base URL */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * CINAcoin Verify API Client
 */
export class CINAcoinVerifyClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options: VerifyClientOptions = {}) {
    this.baseUrl = options.baseUrl || VERIFY_API_BASE;
    this.timeout = options.timeout || 5000;
  }

  /**
   * Check if a domain is verified.
   * Use this in wallet connection flows to display verification status.
   */
  async checkDomain(domain: string): Promise<VerifyResult> {
    const url = `${this.baseUrl}/verify/domain?domain=${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Verify API returned ${res.status}`);
      }

      return await res.json() as VerifyResult;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Perform a full verification check (triggers live DNS lookup).
   * Use this for admin dashboards or when you need fresh verification data.
   */
  async fullCheck(domain: string): Promise<VerifyResult & { message: string }> {
    const url = `${this.baseUrl}/verify/check?domain=${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      return await res.json() as VerifyResult & { message: string };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Quick boolean check — is this domain verified?
   * Convenience method for simple UI checks.
   */
  async isVerified(domain: string): Promise<boolean> {
    try {
      const result = await this.checkDomain(domain);
      return result.verified;
    } catch {
      // On error, assume not verified (fail-safe)
      return false;
    }
  }
}

/**
 * Default singleton instance
 */
export const verifyClient = new CINAcoinVerifyClient();

/**
 * React Hook for domain verification (for React-based wallets/dApps)
 * 
 * Usage:
 * ```tsx
 * import { useDomainVerification } from '@cinacoin/verify-sdk';
 * 
 * function CinacoinButton() {
 *   const { verified, status, loading } = useDomainVerification(window.location.hostname);
 *   
 *   return (
 *     <button>
 *       {loading ? 'Checking...' : verified ? '✅ Verified' : '⚠️ Unverified'}
 *       Connect Wallet
 *     </button>
 *   );
 * }
 * ```
 */
export function createUseDomainVerification(React: { useState: any; useEffect: any }) {
  const { useState, useEffect } = React;

  return function useDomainVerification(domain: string | undefined) {
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      if (!domain) return;

      let cancelled = false;
      setLoading(true);
      setError(null);

      verifyClient
        .checkDomain(domain)
        .then((res) => {
          if (!cancelled) setResult(res);
        })
        .catch((err) => {
          if (!cancelled) setError(err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [domain]);

    return {
      verified: result?.verified ?? false,
      status: result?.status ?? 'not_found',
      appName: result?.appName ?? null,
      loading,
      error,
      result,
    };
  };
}

/**
 * Web3Modal / Cinacoin integration helper.
 * Call this in your wallet connection callback to verify the dApp domain.
 */
export async function verifyCinacoinion(): Promise<{
  verified: boolean;
  domain: string;
  status: VerificationStatus;
}> {
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (!domain) {
    return { verified: false, domain: '', status: 'not_found' };
  }

  try {
    const result = await verifyClient.checkDomain(domain);
    return {
      verified: result.verified,
      domain: result.domain,
      status: result.status,
    };
  } catch {
    return { verified: false, domain, status: 'not_found' };
  }
}
