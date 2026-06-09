/**
 * KV cache layer for domain verification records.
 *
 * Key schema:
 *   domain:<domain>  → DomainRecord JSON
 *   token:<token>    → domain string (reverse lookup)
 */
import type { DomainRecord, VerificationStatus, Env } from './types.js';

const DOMAIN_PREFIX = 'domain:';
const TOKEN_PREFIX = 'token:';

/**
 * Get a domain record from KV.
 */
export async function getDomainRecord(
  kv: KVNamespace,
  domain: string
): Promise<DomainRecord | null> {
  const raw = await kv.get(`${DOMAIN_PREFIX}${domain}`, 'json');
  return raw as DomainRecord | null;
}

/**
 * Save a domain record to KV.
 * Also stores a reverse-lookup key so we can find a domain by token.
 */
export async function saveDomainRecord(
  kv: KVNamespace,
  record: DomainRecord,
  ttlSeconds: number
): Promise<void> {
  await kv.put(`${DOMAIN_PREFIX}${record.domain}`, JSON.stringify(record), {
    expirationTtl: ttlSeconds > 0 ? ttlSeconds : undefined,
  });
  // Reverse lookup: token → domain
  await kv.put(`${TOKEN_PREFIX}${record.token}`, record.domain, {
    expirationTtl: ttlSeconds > 0 ? ttlSeconds : undefined,
  });
}

/**
 * Delete a domain record from KV.
 */
export async function deleteDomainRecord(
  kv: KVNamespace,
  record: DomainRecord
): Promise<void> {
  await kv.delete(`${DOMAIN_PREFIX}${record.domain}`);
  await kv.delete(`${TOKEN_PREFIX}${record.token}`);
}

/**
 * Look up a domain by its verification token.
 */
export async function getDomainByToken(
  kv: KVNamespace,
  token: string
): Promise<string | null> {
  return kv.get(`${TOKEN_PREFIX}${token}`, 'text');
}

/**
 * Update the status of a domain record.
 */
export async function updateDomainStatus(
  kv: KVNamespace,
  domain: string,
  status: VerificationStatus,
  ttlSeconds: number
): Promise<DomainRecord | null> {
  const record = await getDomainRecord(kv, domain);
  if (!record) return null;

  record.status = status;
  if (status === 'verified') {
    record.lastVerifiedAt = new Date().toISOString();
    // Set expiry to 24h from now
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    record.expiresAt = expires.toISOString();
  }

  await saveDomainRecord(kv, record, ttlSeconds);
  return record;
}

/**
 * Increment the check count for a domain.
 */
export async function incrementCheckCount(
  kv: KVNamespace,
  domain: string,
  ttlSeconds: number
): Promise<void> {
  const record = await getDomainRecord(kv, domain);
  if (!record) return;

  record.checkCount = (record.checkCount || 0) + 1;
  await saveDomainRecord(kv, record, ttlSeconds);
}

/**
 * Check if a domain record has expired.
 */
export function isRecordExpired(record: DomainRecord): boolean {
  if (!record.expiresAt) return false;
  return new Date(record.expiresAt).getTime() < Date.now();
}
