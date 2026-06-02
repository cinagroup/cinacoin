import type { Env, Project } from '../db/types';
import { hashApiKey, generateApiKey } from '../middleware/auth';
import { Hono } from 'hono';

export function projectRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // POST /api/projects — Create a project
  app.post('/', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json<{
      name: string;
      description?: string;
      owner_address: string;
      chain_ids?: string[];
      redirect_uris?: string[];
      icon_url?: string;
      website_url?: string;
    }>();

    if (!body.name || !body.owner_address) {
      return c.json({ error: 'name and owner_address are required' }, 400);
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
        body.name,
        body.description || '',
        body.owner_address,
        JSON.stringify(body.chain_ids || []),
        JSON.stringify(body.redirect_uris || []),
        body.icon_url || '',
        body.website_url || '',
        now,
        now
      )
      .run();

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
    return c.json(project, 201);
  });

  // GET /api/projects — List projects (owner filter)
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

    return c.json({ projects: results, total: results.length });
  });

  // GET /api/projects/:id — Project details
  app.get('/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json(project);
  });

  // PATCH /api/projects/:id — Update project
  app.patch('/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json<{
      name?: string;
      description?: string;
      chain_ids?: string[];
      redirect_uris?: string[];
      icon_url?: string;
      website_url?: string;
      status?: string;
    }>();

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

  // DELETE /api/projects/:id — Delete project
  app.delete('/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');

    const existing = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    return c.json({ message: 'Project deleted successfully' });
  });

  // POST /api/projects/:id/keys — Generate API key
  app.post('/:id/keys', async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('id');

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first<Project>();
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const body = await c.req.json<{ label?: string; permissions?: string[]; expires_at?: string }>();

    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyId = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO api_keys (id, project_id, key_hash, label, permissions, is_active, expires_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`
      )
      .bind(
        keyId,
        projectId,
        keyHash,
        body.label || '',
        JSON.stringify(body.permissions || ['read', 'write']),
        body.expires_at || null
      )
      .run();

    const key = await db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(keyId).first();
    return c.json({ ...key, key: rawKey }, 201);
  });

  // GET /api/projects/:id/keys — List API keys
  app.get('/:id/keys', async (c) => {
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

  return app;
}
