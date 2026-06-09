/**
 * GET /verify/check?domain=example.com
 * Check the verification status of a domain.
 * Performs live DNS verification if the domain is registered.
 */
import { Hono } from 'hono';
import type { Env, VerifyResult } from '../../lib/types.js';
import { normalizeDomain, isValidDomain, verifyDomainDns } from '../../lib/dns.js';
import {
  getDomainRecord,
  updateDomainStatus,
  incrementCheckCount,
  isRecordExpired,
} from '../../lib/kv-store.js';

export default function checkRoute(app: Hono<{ Bindings: Env }>) {
  app.get('/verify/check', async (c) => {
    const domainParam = c.req.query('domain');
    if (!domainParam) {
      return c.json(
        { error: 'missing_parameter', message: 'Missing required parameter: domain' },
        400
      );
    }

    const domain = normalizeDomain(domainParam);

    if (!isValidDomain(domain)) {
      return c.json(
        { error: 'invalid_domain', message: 'Invalid domain format' },
        400
      );
    }

    // Get domain record from KV
    const record = await getDomainRecord(c.env.VERIFY_KV, domain);

    if (!record) {
      return c.json(
        {
          domain,
          status: 'not_found',
          verified: false,
          appName: null,
          lastVerifiedAt: null,
          expiresAt: null,
          message: 'Domain is not registered with CINAcoin Verify API',
        } satisfies VerifyResult,
        404
      );
    }

    // Check if record has expired
    if (isRecordExpired(record)) {
      const ttl = parseInt(c.env.CACHE_TTL_SECONDS || '3600', 10);
      await updateDomainStatus(c.env.VERIFY_KV, domain, 'expired', ttl);
      return c.json(
        {
          domain,
          status: 'expired',
          verified: false,
          appName: record.appName,
          lastVerifiedAt: record.lastVerifiedAt,
          expiresAt: record.expiresAt,
          message: 'Domain verification has expired. Please re-verify.',
        } satisfies VerifyResult,
        200
      );
    }

    // Perform live DNS verification
    try {
      const isVerified = await verifyDomainDns(domain, record.token, c.env);
      const ttl = parseInt(c.env.CACHE_TTL_SECONDS || '3600', 10);

      if (isVerified && record.status !== 'verified') {
        // Domain just became verified
        await updateDomainStatus(c.env.VERIFY_KV, domain, 'verified', ttl);
        await incrementCheckCount(c.env.VERIFY_KV, domain, ttl);

        const updated = await getDomainRecord(c.env.VERIFY_KV, domain);
        return c.json(
          {
            domain,
            status: 'verified',
            verified: true,
            appName: updated?.appName || record.appName,
            lastVerifiedAt: updated?.lastVerifiedAt || new Date().toISOString(),
            expiresAt: updated?.expiresAt,
            message: 'Domain verification successful',
          } satisfies VerifyResult,
          200
        );
      } else if (isVerified) {
        // Already verified, just increment check count
        await incrementCheckCount(c.env.VERIFY_KV, domain, ttl);
        return c.json(
          {
            domain,
            status: 'verified',
            verified: true,
            appName: record.appName,
            lastVerifiedAt: record.lastVerifiedAt,
            expiresAt: record.expiresAt,
            message: 'Domain is verified',
          } satisfies VerifyResult,
          200
        );
      } else {
        // DNS check failed
        if (record.status === 'verified') {
          // Was verified but now failing — mark as unverified
          await updateDomainStatus(c.env.VERIFY_KV, domain, 'unverified', ttl);
        }
        await incrementCheckCount(c.env.VERIFY_KV, domain, ttl);

        return c.json(
          {
            domain,
            status: 'unverified',
            verified: false,
            appName: record.appName,
            lastVerifiedAt: record.lastVerifiedAt,
            expiresAt: record.expiresAt,
            message: 'DNS TXT record verification failed. Please check your DNS configuration.',
          } satisfies VerifyResult,
          200
        );
      }
    } catch (err) {
      // DNS query error — return cached status
      console.error('DNS verification error:', err);
      return c.json(
        {
          domain,
          status: record.status,
          verified: record.status === 'verified',
          appName: record.appName,
          lastVerifiedAt: record.lastVerifiedAt,
          expiresAt: record.expiresAt,
          message: 'DNS query failed. Returning cached status.',
        } satisfies VerifyResult,
        200
      );
    }
  });
}
