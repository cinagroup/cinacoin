import { createMiddleware } from 'hono/factory';
import type { Env } from '../db/types';
import { hashApiKey } from './auth';

export const apiKeyAuth = createMiddleware<{ Bindings: Env; Variables: { apiKeyId: string; projectId: string } }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const apiKey = authHeader.slice(7);
  const keyHash = await hashApiKey(apiKey);

  const db = c.env.DB;
  const result = await db
    .prepare('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1')
    .bind(keyHash)
    .first<Record<string, unknown>>();

  if (!result) {
    return c.json({ error: 'Invalid or inactive API key' }, 403);
  }

  // Update last_used_at
  await db
    .prepare('UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?')
    .bind(result.id as string)
    .run();

  c.set('apiKeyId', result.id as string);
  c.set('projectId', result.project_id as string);

  await next();
});
