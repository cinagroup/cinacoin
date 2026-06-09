/**
 * @module domain-verify
 * DomainVerifier — phishing detection, typosquatting check, and known dApp lookup.
 */

import type { DomainVerifyReport } from './types';
import { KnownDAppRegistry } from './registry';

// ─── Known phishing domains (subset / curated list) ──────────────────────────────

const KNOWN_PHISHING_DOMAINS: Set<string> = new Set([
  'uniswapp.org',
  'uniswap-deFi.com',
  'aave-lend.com',
  'metamask-login.com',
  'pancakeswaps.finance',
  'opensea-nft-drop.com',
  'coinbase-wallet-connect.com',
  'trustwallet-login.com',
  'sushiswap-claim.com',
  'curve-fi.xyz',
  'compound-finance.xyz',
  'makerdao-claim.com',
  '1inch-exchange.net',
  'balancer-pool.com',
  'yearn-vault.xyz',
  'dydx-trading.com',
  'arbitrum-bridge.net',
  'optimism-airdrop.com',
  'polygon-migrate.com',
  'solana-wallet.org',
  'binance-verify.com',
  'coinbase-secure-login.com',
  'kraken-login.net',
  'ftx-refund.com',
  'ledger-support.org',
  'trezor-wallet.com',
  'phantom-wallet.net',
  'metamask-support.org',
  'walletconnect-login.com',
  'trust-wallet-auth.com',
]);

// ─── Legitimate domain base names for typosquatting detection ────────────────────

const LEGITIMATE_DOMAINS: string[] = [
  'uniswap.org',
  'aave.com',
  'compound.finance',
  'makerdao.com',
  'sushiswap.com',
  'curve.fi',
  'balancer.fi',
  'yearn.finance',
  'dydx.exchange',
  '1inch.io',
  'opensea.io',
  'pancakeswap.finance',
  'quickswap.exchange',
  'traderjoexyz.com',
  'benqi.fi',
  'gmx.io',
  'stargate.finance',
  'hop.exchange',
  'across.to',
  'synapseprotocol.com',
  'wormhole.com',
  'layerzero.finance',
  'lido.fi',
  'rocketpool.net',
  'frax.finance',
  'liquity.org',
  'reflexer.finance',
  'olympusdao.finance',
  'convex.finance',
  'gitcoin.co',
  'snapshot.org',
  'aragon.org',
  'daohaus.club',
  'rarible.com',
  'foundation.app',
  'zora.co',
  'magiceden.io',
  'axieinfinity.com',
  'sandbox.game',
  'decentraland.org',
  'stepn.com',
  'metamask.io',
  'coinbase.com',
  'binance.com',
  'kraken.com',
  'trustwallet.com',
  'phantom.app',
  'ledger.com',
  'trezor.io',
];

// ─── DomainVerifier ──────────────────────────────────────────────────────────────

export class DomainVerifier {
  /**
   * Check a domain for phishing risk, typosquatting, and known dApp status.
   */
  async checkDomain(domain: string): Promise<DomainVerifyReport> {
    const normalized = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const isPhishing = this.checkPhishing(normalized);
    const { score, closest } = this.computeSimilarity(normalized);
    const knownDApp = KnownDAppRegistry.getDAppByDomain(normalized);
    const sslInfo = await this.checkSSL(normalized);

    return {
      domain: normalized,
      isPhishing,
      similarityScore: score,
      isKnownDApp: !!knownDApp,
      sslValid: sslInfo.valid,
      closestMatch: closest,
      metadata: {
        sslExpiry: sslInfo.expiry,
        registrar: sslInfo.registrar,
        dAppName: knownDApp?.name,
        dAppCategory: knownDApp?.category,
      },
      lastChecked: Date.now(),
    };
  }

  /**
   * Check if domain is in known phishing list.
   */
  private checkPhishing(domain: string): boolean {
    return KNOWN_PHISHING_DOMAINS.has(domain.toLowerCase());
  }

  /**
   * Compute Levenshtein-based similarity against legitimate domains.
   * Returns highest similarity score (0-1) and the closest match.
   */
  private computeSimilarity(domain: string): { score: number; closest: string } {
    let bestScore = 0;
    let closestMatch = '';

    for (const legit of LEGITIMATE_DOMAINS) {
      const dist = this.levenshtein(domain, legit);
      const maxLen = Math.max(domain.length, legit.length);
      const similarity = 1 - dist / maxLen;

      if (similarity > bestScore && similarity < 1.0) {
        bestScore = similarity;
        closestMatch = legit;
      }
    }

    // Also check known dApp registry domains
    for (const entry of KnownDAppRegistry.getAll()) {
      const dist = this.levenshtein(domain, entry.domain);
      const maxLen = Math.max(domain.length, entry.domain.length);
      const similarity = 1 - dist / maxLen;

      if (similarity > bestScore && similarity < 1.0) {
        bestScore = similarity;
        closestMatch = entry.domain;
      }
    }

    return { score: Math.round(bestScore * 100) / 100, closest: closestMatch };
  }

  /**
   * Standard Levenshtein distance.
   */
  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Attempt to validate SSL certificate via fetch.
   * This is a best-effort check — production would use a proper SSL checker.
   */
  private async checkSSL(domain: string): Promise<{
    valid: boolean;
    expiry?: string;
    registrar?: string;
  }> {
    try {
      // Best-effort HTTPS check
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
      });

      clearTimeout(timeout);

      // If we got any response (even error), SSL handshake succeeded
      return { valid: true };
    } catch {
      // Connection failed — could be no SSL, DNS issue, or offline
      return { valid: false };
    }
  }

  /**
   * Batch check multiple domains.
   */
  async batchCheck(domains: string[], maxConcurrency: number = 5): Promise<DomainVerifyReport[]> {
    const results: DomainVerifyReport[] = [];

    for (let i = 0; i < domains.length; i += maxConcurrency) {
      const batch = domains.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(
        batch.map((d) => this.checkDomain(d))
      );
      results.push(...batchResults);
    }

    return results;
  }
}
