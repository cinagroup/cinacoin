import { createMiddleware } from 'hono/factory';
import type { Env } from '../db/types';
import { hashApiKey } from './auth';

export const apiKeyAuth = createMiddleware<{
  Bindings: Env;
  Variables: { apiKeyId: string; projectId: string; permissions: string[] };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const apiKey = authHeader.slice(7);
  const keyHash = await hashApiKey(apiKey);

  const db = c.env.DB;
  const result = await db
    .prepare(
      'SELECT id, project_id, is_active, expires_at, permissions FROM api_keys WHERE key_hash = ? AND is_active = 1'
    )
    .bind(keyHash)
    .first<{
      id: string;
      project_id: string;
      is_active: number;
      expires_at: string | null;
      permissions: string;
    }>();

  if (!result) {
    return c.json({ error: 'Invalid or inactive API key' }, 403);
  }

  // Check expiration
  if (result.expires_at) {
    const expiresAt = new Date(result.expires_at).getTime();
    if (Date.now() > expiresAt) {
      return c.json({ error: 'API key has expired' }, 403);
    }
  }

  // Update last_used_at
  await db
    .prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), result.id)
    .run();

  c.set('apiKeyId', result.id);
  c.set('projectId', result.project_id);
  c.set('permissions', JSON.parse(result.permissions || '["read","write"]'));

  await next();
});
