import { Hono } from 'hono';
import type { Env, ApiKey } from '../db/types';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { hashApiKey, generateApiKey } from '../middleware/auth';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const updateApiKeySchema = z.object({
  label: z.string().max(100).optional(),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().optional(),
});

export function keyRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // GET /api/keys/:id — Get API key details (protected)
  app.get('/keys/:id', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const keyId = c.req.param('id');

    const key = await db.prepare(
      'SELECT id, project_id, label, permissions, is_active, last_used_at, created_at, expires_at FROM api_keys WHERE id = ?'
    ).bind(keyId).first<ApiKey>();

    if (!key) {
      return c.json({ error: 'API key not found' }, 404);
    }

    return c.json(key);
  });

  // PUT /api/keys/:id — Update API key (protected)
  app.put('/keys/:id', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const keyId = c.req.param('id');
    const rawBody = await c.req.json();
    const validation = updateApiKeySchema.safeParse(rawBody);

    if (!validation.success) {
      return c.json({ error: validation.error.flatten() }, 400);
    }

    const body = validation.data;

    const existing = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(keyId).first<ApiKey>();
    if (!existing) {
      return c.json({ error: 'API key not found' }, 404);
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (body.label !== undefined) {
      updates.push('label = ?');
      params.push(body.label);
    }
    if (body.permissions !== undefined) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(body.permissions));
    }
    if (body.expires_at !== undefined) {
      updates.push('expires_at = ?');
      params.push(body.expires_at);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json(existing);
    }

    await db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`).bind(...params, keyId).run();

    const updated = await db.prepare(
      'SELECT id, project_id, label, permissions, is_active, last_used_at, created_at, expires_at FROM api_keys WHERE id = ?'
    ).bind(keyId).first<ApiKey>();

    return c.json(updated);
  });

  // DELETE /api/keys/:id — Revoke an API key (protected)
  app.delete('/keys/:id', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const keyId = c.req.param('id');

    const existing = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(keyId).first();
    if (!existing) {
      return c.json({ error: 'API key not found' }, 404);
    }

    await db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').bind(keyId).run();
    return c.json({ message: 'API key revoked successfully' });
  });

  // POST /api/keys/:id/rotate — Rotate an API key (protected)
  app.post('/keys/:id/rotate', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const keyId = c.req.param('id');

    const existing = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(keyId).first<ApiKey>();
    if (!existing) {
      return c.json({ error: 'API key not found' }, 404);
    }

    // Deactivate the old key
    await db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').bind(keyId).run();

    // Generate a new key
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const newKeyId = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO api_keys (id, project_id, key_hash, label, permissions, is_active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(
        newKeyId,
        existing.project_id,
        keyHash,
        existing.label + ' (rotated)',
        existing.permissions,
        existing.expires_at,
        new Date().toISOString()
      )
      .run();

    const newKey = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(newKeyId).first();
    return c.json({ ...newKey, key: rawKey }, 201);
  });

  return app;
}
