import type { Env, Project } from '../db/types';
import { hashApiKey, generateApiKey } from '../middleware/auth';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { Hono } from 'hono';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1, 'name is required').max(100),
  description: z.string().max(500).optional(),
  owner_address: z.string().max(100).optional(),
  chain_ids: z.array(z.string()).optional(),
  redirect_uris: z.array(z.string()).optional(),
  icon_url: z.string().optional(),
  website_url: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

const createApiKeySchema = z.object({
  label: z.string().max(100).optional(),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).optional(),
  expires_at: z.string().datetime().optional(),
});

export function projectRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // POST /api/projects — Create a project (protected)
  app.post('/', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const body = await c.req.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return c.json({ error: validation.error.flatten() }, 400);
    }

    const { name, description, owner_address, chain_ids, redirect_uris, icon_url, website_url } = validation.data;

    // Use authenticated user's project context, or explicit owner_address
    const ownerAddress = owner_address || c.req.header('X-Owner-Address');
    if (!ownerAddress) {
      return c.json({ error: 'owner_address is required' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO projects (id, name, description, owner_address, chain_ids, redirect_uris, icon_url, website_url, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
      )
      .bind(
        id,
        name,
        description || '',
        ownerAddress,
        JSON.stringify(chain_ids || []),
        JSON.stringify(redirect_uris || []),
        icon_url || '',
        website_url || '',
        now,
        now
      )
      .run();

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
    return c.json(project, 201);
  });

  // GET /api/projects — List projects (public)
  app.get('/', async (c) => {
    const db = c.env.DB;
    const ownerAddress = c.req.query('owner_address');
    const status = c.req.query('status');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = parseInt(c.req.query('offset') || '0');

    let query = 'SELECT * FROM projects WHERE 1=1';
    const params: (string | number)[] = [];

    if (ownerAddress) {
      query += ' AND owner_address = ?';
      params.push(ownerAddress);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const { results } = await stmt.bind(...params).all<Project>();

    // Get actual total count
    let countQuery = 'SELECT COUNT(*) as count FROM projects WHERE 1=1';
    const countParams: string[] = [];
    if (ownerAddress) {
      countQuery += ' AND owner_address = ?';
      countParams.push(ownerAddress);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const { results: countResults } = await db.prepare(countQuery).bind(...countParams).all<{ count: number }>();
    const total = countResults?.[0]?.count ?? results.length;

    return c.json({ projects: results, total, limit, offset });
  });

  // GET /api/projects/:id — Project details (public)
  app.get('/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json(project);
  });

  // PATCH /api/projects/:id — Update project (protected)
  app.patch('/:id', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const rawBody = await c.req.json();
    const validation = updateProjectSchema.safeParse(rawBody);

    if (!validation.success) {
      return c.json({ error: validation.error.flatten() }, 400);
    }

    const body = validation.data;

    const existing = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
    if (body.chain_ids !== undefined) { updates.push('chain_ids = ?'); params.push(JSON.stringify(body.chain_ids)); }
    if (body.redirect_uris !== undefined) { updates.push('redirect_uris = ?'); params.push(JSON.stringify(body.redirect_uris)); }
    if (body.icon_url !== undefined) { updates.push('icon_url = ?'); params.push(body.icon_url); }
    if (body.website_url !== undefined) { updates.push('website_url = ?'); params.push(body.website_url); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }

    if (updates.length === 0) {
      return c.json(existing);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
    return c.json(updated);
  });

  // DELETE /api/projects/:id — Delete project (protected)
  app.delete('/:id', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');

    const existing = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Delete associated API keys first (cascade should handle it, but be explicit)
    await db.prepare('DELETE FROM api_keys WHERE project_id = ?').bind(id).run();
    await db.prepare('DELETE FROM usage_stats WHERE project_id = ?').bind(id).run();
    await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    return c.json({ message: 'Project deleted successfully' });
  });

  // POST /api/projects/:id/keys — Generate API key (protected)
  app.post('/:id/keys', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('id');

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first<Project>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const rawBody = await c.req.json();
    const validation = createApiKeySchema.safeParse(rawBody);

    if (!validation.success) {
      return c.json({ error: validation.error.flatten() }, 400);
    }

    const body = validation.data;

    // Validate expires_at if provided
    if (body.expires_at) {
      const expDate = new Date(body.expires_at);
      if (isNaN(expDate.getTime()) || expDate.getTime() <= Date.now()) {
        return c.json({ error: 'Invalid expires_at: must be a future date' }, 400);
      }
    }

    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyId = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO api_keys (id, project_id, key_hash, label, permissions, is_active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(
        keyId,
        projectId,
        keyHash,
        body.label || '',
        JSON.stringify(body.permissions || ['read', 'write']),
        body.expires_at || null,
        new Date().toISOString()
      )
      .run();

    const key = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(keyId).first();
    return c.json({ ...key, key: rawKey }, 201);
  });

  // GET /api/projects/:id/keys — List API keys (protected)
  app.get('/:id/keys', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('id');

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first<Project>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const keys = await db
      .prepare('SELECT id, project_id, label, permissions, is_active, last_used_at, created_at, expires_at FROM api_keys WHERE project_id = ? ORDER BY created_at DESC')
      .bind(projectId)
      .all();

    return c.json(keys);
  });

  // DELETE /api/projects/:id/keys/:keyId — Revoke a specific API key (protected)
  app.delete('/:id/keys/:keyId', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('id');
    const keyId = c.req.param('keyId');

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first<Project>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const existing = await db.prepare('SELECT * FROM api_keys WHERE id = ? AND project_id = ?').bind(keyId, projectId).first();
    if (!existing) {
      return c.json({ error: 'API key not found' }, 404);
    }

    await db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?').bind(keyId).run();
    return c.json({ message: 'API key revoked successfully' });
  });

  return app;
}
