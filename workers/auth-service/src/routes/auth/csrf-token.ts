/**
 * GET /auth/csrf-token
 * Generates a CSRF token tied to a session ID for frontend use.
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';

const app = new Hono<{ Bindings: Env }>();

app.get('/csrf-token', async (c) => {
  // Generate random CSRF token (32 bytes = 64 hex chars)
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const csrfToken = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Get or create session ID from header
  let sessionId = c.req.header('X-Session-ID');
  if (!sessionId) {
    const sessionBytes = new Uint8Array(16);
    crypto.getRandomValues(sessionBytes);
    sessionId = Array.from(sessionBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Store CSRF token in KV, tied to session ID, 24 hour TTL
  const ttl = 24 * 60 * 60; // 24 hours
  await c.env.KV.put(`csrf:${sessionId}`, csrfToken, {
    expirationTtl: ttl,
  });

  return c.json({
    csrfToken,
    sessionId,
    expiresIn: ttl,
  });
});

export default app;
