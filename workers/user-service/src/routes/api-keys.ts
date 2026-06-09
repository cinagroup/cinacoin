/**
 * API Key Management Routes
 *
 * GET    /api/api-keys           — List API keys for a user
 * POST   /api/api-keys           — Create a new API key (returns plaintext key ONCE)
 * DELETE /api/api-keys/:id       — Delete an API key
 */

import { Hono } from 'hono';
import type { Env } from '../db/schema';
import type { AuthVariables } from '../middleware/auth';
import { requireAuth, sha256 } from '../middleware/auth';
import { requireScope } from '../middleware/rbac';
import {
  listApiKeys,
  createApiKey,
  deleteApiKey,
  deleteApiKeyByUser,
  getUserById,
} from '../db/queries';

type Variables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};

const apiKeys = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require authentication
apiKeys.use('*', requireAuth);

/**
 * Generate a random API key string.
 * Uses crypto.getRandomValues for CSPRNG.
 */
function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const prefix = 'ck'; // cinacoin key
  const encoded = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${encoded}`;
}

// ─── List API Keys ────────────────────────────────────────────────────────────
apiKeys.get('/', requireScope('api_keys:read'), async (c) => {
  const authType = c.get('authType');
  // Non-admin users can only see their own keys
  const userId = authType === 'admin'
    ? (c.req.query('user_id') ?? c.get('userId'))
    : c.get('userId');

  const keys = await listApiKeys(c.env.DB, userId);

  // Strip key_hash from response — never expose hashes
  const safe = keys.map((k) => ({
    id: k.id,
    user_id: k.user_id,
    name: k.name,
    scopes: JSON.parse(k.scopes),
    expires_at: k.expires_at,
    created_at: k.created_at,
  }));

  return c.json({ data: safe });
});

// ─── Create API Key ───────────────────────────────────────────────────────────
apiKeys.post('/', requireScope('api_keys:write'), async (c) => {
  const body = await c.req.json();

  if (!body.name || typeof body.name !== 'string') {
    return c.json({ error: 'name is required' }, 400);
  }
  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    return c.json({ error: 'scopes must be a non-empty array' }, 400);
  }

  const authType = c.get('authType');
  const userId = body.user_id ?? c.get('userId');

  // Non-admin can only create keys for themselves
  if (authType !== 'admin' && body.user_id && body.user_id !== c.get('userId')) {
    return c.json({ error: 'Cannot create keys for other users' }, 403);
  }

  // Validate user exists
  const user = await getUserById(c.env.DB, userId, c.env.CACHE);
  if (!user) {
    return c.json({ error: 'User not found' }, 400);
  }

  // Generate the plaintext key and its hash
  const plaintextKey = generateApiKey();
  const keyHash = await sha256(plaintextKey);

  const apiKey = await createApiKey(c.env.DB, {
    user_id: userId,
    name: body.name,
    key_hash: keyHash,
    scopes: body.scopes,
    expires_at: body.expires_at,
  }, c.env.CACHE);

  // Return the plaintext key ONLY on creation — it cannot be retrieved again
  return c.json(
    {
      data: {
        id: apiKey.id,
        user_id: apiKey.user_id,
        name: apiKey.name,
        key: plaintextKey, // ⚠️ Only time this is available
        scopes: body.scopes,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at,
      },
      warning: 'Store this key securely. It will not be shown again.',
    },
    201
  );
});

// ─── Delete API Key ───────────────────────────────────────────────────────────
apiKeys.delete('/:id', requireScope('api_keys:write'), async (c) => {
  const id = c.req.param('id');
  const authType = c.get('authType');
  const userId = c.get('userId');

  let deleted: boolean;
  if (authType === 'admin') {
    deleted = await deleteApiKey(c.env.DB, id, c.env.CACHE);
  } else {
    // Non-admin can only delete their own keys
    deleted = await deleteApiKeyByUser(c.env.DB, id, userId, c.env.CACHE);
  }

  if (!deleted) {
    return c.json({ error: 'API key not found' }, 404);
  }

  return c.json({ data: { deleted: true, id } });
});

export default apiKeys;
