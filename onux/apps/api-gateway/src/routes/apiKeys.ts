import { Hono } from 'hono';
import type { Env, RequestContext } from '../lib/types';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/auth';
import { sha256, generateApiKey, createSuccessResponse } from '../lib/utils';

/**
 * API Key management routes
 * Create, list, revoke API keys for projects
 */
export function apiKeyRoutes() {
  const router = new Hono<{
    Bindings: Env;
    Variables: { context: RequestContext };
  }>();

  // List API keys for a project
  router.get('/', authMiddleware, async (c) => {
    const context = c.get('context');

    const keys = await c.env.DB
      .prepare(
        'SELECT id, project_id, label, permissions, is_active, last_used_at, created_at, expires_at FROM api_keys WHERE project_id = ? ORDER BY created_at DESC'
      )
      .bind(context.projectId || '')
      .all();

    return c.json(createSuccessResponse(keys.results, { requestId: context.requestId }));
  });

  // Create a new API key
  router.post('/', authMiddleware, requirePermission('admin'), async (c) => {
    const context = c.get('context');
    const body = await c.req.json();

    const { label, permissions, expires_at } = body;

    // Generate the raw API key
    const rawKey = generateApiKey('ck_');
    const keyHash = await sha256(rawKey);

    const id = crypto.randomUUID().replace(/-/g, '');

    await c.env.DB
      .prepare(
        `INSERT INTO api_keys (id, project_id, key_hash, label, permissions, is_active, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), ?)`
      )
      .bind(
        id,
        context.projectId || '',
        keyHash,
        label || 'Unnamed Key',
        JSON.stringify(permissions || ['read']),
        expires_at || null
      )
      .run();

    // Return the raw key ONLY on creation (never stored, only the hash)
    return c.json(
      createSuccessResponse(
        {
          id,
          key: rawKey, // Only time the raw key is returned
          label: label || 'Unnamed Key',
          permissions: permissions || ['read'],
          expires_at: expires_at || null,
          created_at: new Date().toISOString(),
        },
        { requestId: context.requestId }
      ),
      201
    );
  });

  // Revoke an API key
  router.delete('/:id', authMiddleware, requirePermission('admin'), async (c) => {
    const context = c.get('context');
    const id = c.req.param('id');

    await c.env.DB
      .prepare('UPDATE api_keys SET is_active = 0 WHERE id = ? AND project_id = ?')
      .bind(id, context.projectId || '')
      .run();

    return c.json(
      createSuccessResponse({ revoked: true, id }, { requestId: context.requestId })
    );
  });

  // Rotate an API key (revoke old, create new)
  router.post('/:id/rotate', authMiddleware, requirePermission('admin'), async (c) => {
    const context = c.get('context');
    const id = c.req.param('id');

    // Get the old key info
    const oldKey = await c.env.DB
      .prepare('SELECT * FROM api_keys WHERE id = ? AND project_id = ?')
      .bind(id, context.projectId || '')
      .first<{ label: string; permissions: string; expires_at: string | null }>();

    if (!oldKey) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'API key not found' } }, 404);
    }

    // Revoke old key
    await c.env.DB
      .prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?')
      .bind(id)
      .run();

    // Create new key with same settings
    const rawKey = generateApiKey('ck_');
    const keyHash = await sha256(rawKey);
    const newId = crypto.randomUUID().replace(/-/g, '');

    await c.env.DB
      .prepare(
        `INSERT INTO api_keys (id, project_id, key_hash, label, permissions, is_active, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), ?)`
      )
      .bind(newId, context.projectId || '', keyHash, oldKey.label + ' (rotated)', oldKey.permissions, oldKey.expires_at)
      .run();

    return c.json(
      createSuccessResponse(
        {
          id: newId,
          key: rawKey,
          label: oldKey.label + ' (rotated)',
          permissions: JSON.parse(oldKey.permissions),
          expires_at: oldKey.expires_at,
          previous_key_id: id,
          created_at: new Date().toISOString(),
        },
        { requestId: context.requestId }
      ),
      201
    );
  });

  return router;
}
