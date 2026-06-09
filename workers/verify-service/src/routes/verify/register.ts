/**
 * POST /verify/register
 * Register a new domain for verification.
 * Requires ADMIN_API_KEY header for authorization.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, DomainRecord, RegisterRequest } from '../../lib/types.js';
import { generateToken, isValidDomain, normalizeDomain } from '../../lib/dns.js';
import { getDomainRecord, saveDomainRecord, getDomainByToken } from '../../lib/kv-store.js';

const registerSchema = z.object({
  domain: z.string().min(1).max(253),
  appName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
});

export default function registerRoute(app: Hono<{ Bindings: Env }>) {
  app.post('/verify/register', async (c) => {
    // Admin authentication check
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!apiKey || apiKey !== c.env.ADMIN_API_KEY) {
      return c.json(
        { error: 'unauthorized', message: 'Invalid or missing API key' },
        401
      );
    }

    // Parse and validate request body
    let body: RegisterRequest;
    try {
      const raw = await c.req.json();
      body = registerSchema.parse(raw);
    } catch (err) {
      return c.json(
        { error: 'invalid_request', message: 'Invalid request body', details: err },
        400
      );
    }

    const domain = normalizeDomain(body.domain);

    // Validate domain format
    if (!isValidDomain(domain)) {
      return c.json(
        { error: 'invalid_domain', message: 'Invalid domain format' },
        400
      );
    }

    // Check if domain is already registered
    const existing = await getDomainRecord(c.env.VERIFY_KV, domain);
    if (existing) {
      return c.json(
        {
          error: 'domain_exists',
          message: 'Domain is already registered',
          domain,
          status: existing.status,
          token: existing.token,
        },
        409
      );
    }

    // Generate verification token
    const token = generateToken();

    // Create domain record
    const record: DomainRecord = {
      domain,
      token,
      status: 'pending',
      registeredAt: new Date().toISOString(),
      lastVerifiedAt: null,
      expiresAt: null,
      appName: body.appName || null,
      contactEmail: body.contactEmail || null,
      checkCount: 0,
    };

    // Save to KV (no TTL for pending records)
    const ttl = parseInt(c.env.CACHE_TTL_SECONDS || '3600', 10);
    await saveDomainRecord(c.env.VERIFY_KV, record, ttl);

    return c.json(
      {
        success: true,
        domain,
        token,
        message: `Domain registered. Please add a DNS TXT record:`,
        instructions: {
          recordType: 'TXT',
          host: `_cinacoin-verify.${domain}`,
          value: token,
        },
      },
      201
    );
  });
}
