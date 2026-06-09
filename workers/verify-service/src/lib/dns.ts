/**
 * DNS verification utilities
 * Uses DNS-over-HTTPS to query TXT records without system DNS dependencies.
 */
import type { Env, DohResponse } from './types.js';

/**
 * Generate a cryptographically random verification token.
 * Format: "cinacoin-verify-<hex32>"
 */
export function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `cinacoin-verify-${hex}`;
}

/**
 * Build the expected DNS TXT record name for a domain.
 * e.g. domain = "example.com" → "_cinacoin-verify.example.com"
 */
export function buildTxtRecordName(domain: string, prefix: string): string {
  return `${prefix}.${domain}`;
}

/**
 * Query DNS TXT records for a given name using DNS-over-HTTPS.
 * Supports Cloudflare (default) and Google providers.
 */
export async function queryTxtRecords(
  name: string,
  provider: string = 'cloudflare'
): Promise<string[]> {
  const url =
    provider === 'google'
      ? `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`
      : `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`;

  const headers: Record<string, string> =
    provider === 'google'
      ? { Accept: 'application/dns-json' }
      : { Accept: 'application/dns-json' };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`DNS query failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as DohResponse;

  // Status 0 = NOERROR, Status 3 = NXDOMAIN
  if (data.Status === 3) {
    return []; // domain/record doesn't exist
  }

  if (data.Status !== 0) {
    throw new Error(`DNS query returned status ${data.Status}`);
  }

  // Filter TXT answers (type 16)
  const txtRecords = (data.Answer || [])
    .filter((a) => a.type === 16)
    .map((a) => {
      // DNS TXT data is often quoted; strip surrounding quotes
      let d = a.data;
      if (d.startsWith('"') && d.endsWith('"')) {
        d = d.slice(1, -1);
      }
      return d;
    });

  return txtRecords;
}

/**
 * Verify that a domain's DNS TXT record contains the expected token.
 * Returns true if at least one TXT record matches the token.
 */
export async function verifyDomainDns(
  domain: string,
  expectedToken: string,
  env: Env
): Promise<boolean> {
  const prefix = env.DNS_TXT_PREFIX || '_cinacoin-verify';
  const provider = env.DNS_OVER_HTTPS_PROVIDER || 'cloudflare';
  const txtName = buildTxtRecordName(domain, prefix);

  const records = await queryTxtRecords(txtName, provider);
  return records.some((r) => r.trim() === expectedToken);
}

/**
 * Validate that a string is a valid domain name.
 * Basic RFC 1035 check — not exhaustive but sufficient for registration.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // Must not start/end with hyphen or dot
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-')) return false;
  // Basic domain regex
  const pattern =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return pattern.test(domain);
}

/**
 * Normalize a domain: lowercase, strip trailing dot, strip protocol/path.
 */
export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  // Strip protocol
  if (d.includes('://')) {
    try {
      const u = new URL(d);
      d = u.hostname;
    } catch {
      // fallback: strip manually
      d = d.replace(/^https?:\/\//, '');
    }
  }
  // Strip path
  d = d.split('/')[0];
  // Strip port
  d = d.split(':')[0];
  // Strip trailing dot
  if (d.endsWith('.')) d = d.slice(0, -1);
  return d;
}
