import { Hono } from 'hono';
import type { Env } from '../db/types';

export function keyRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // DELETE /api/keys/:id — Revoke an API key
  app.delete('/keys/:id', async (c) => {
    const db = c.env.DB;
    const keyId = c.req.param('id');

    const existing = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(keyId).first();
    if (!existing) {
      return c.json({ error: 'API key not found' }, 404);
    }

    await db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').bind(keyId).run();
    return c.json({ message: 'API key revoked successfully' });
  });

  return app;
}
