/**
 * GET /verify/domain?domain=example.com
 * Lightweight endpoint for wallets to quickly check if a domain is verified.
 * Returns minimal data for fast response.
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { normalizeDomain, isValidDomain } from '../../lib/dns.js';
import { getDomainRecord, isRecordExpired } from '../../lib/kv-store.js';

export default function domainRoute(app: Hono<{ Bindings: Env }>) {
  app.get('/verify/domain', async (c) => {
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
          verified: false,
          status: 'not_found',
          appName: null,
        },
        200
      );
    }

    // Check expiry
    if (isRecordExpired(record)) {
      return c.json(
        {
          domain,
          verified: false,
          status: 'expired',
          appName: record.appName,
        },
        200
      );
    }

    // Return lightweight response
    return c.json(
      {
        domain,
        verified: record.status === 'verified',
        status: record.status,
        appName: record.appName,
        lastVerifiedAt: record.lastVerifiedAt,
        expiresAt: record.expiresAt,
      },
      200
    );
  });
}
