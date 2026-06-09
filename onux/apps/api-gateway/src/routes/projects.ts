import { Hono } from 'hono';
import type { Env, RequestContext } from '../lib/types';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/auth';
import { parsePagination, createSuccessResponse } from '../lib/utils';

/**
 * Project management routes
 * CRUD operations for developer projects
 */
export function projectRoutes() {
  const router = new Hono<{
    Bindings: Env;
    Variables: { context: RequestContext };
  }>();

  // List projects (authenticated)
  router.get('/', authMiddleware, async (c) => {
    const context = c.get('context');
    const { limit, offset } = parsePagination(new URL(c.req.url));

    const projects = await c.env.DB
      .prepare('SELECT * FROM projects WHERE owner_address = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(context.projectId || '', limit, offset)
      .all();

    const countResult = await c.env.DB
      .prepare('SELECT COUNT(*) as total FROM projects WHERE owner_address = ?')
      .bind(context.projectId || '')
      .first<{ total: number }>();

    return c.json(
      createSuccessResponse(projects.results, {
        requestId: context.requestId,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: countResult?.total || 0,
        },
      })
    );
  });

  // Get project by ID
  router.get('/:id', authMiddleware, async (c) => {
    const context = c.get('context');
    const id = c.req.param('id');

    const project = await c.env.DB
      .prepare('SELECT * FROM projects WHERE id = ?')
      .bind(id)
      .first();

    if (!project) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 404);
    }

    return c.json(createSuccessResponse(project, { requestId: context.requestId }));
  });

  // Create project
  router.post('/', authMiddleware, requirePermission('write'), async (c) => {
    const context = c.get('context');
    const body = await c.req.json();

    const { name, description, owner_address, chain_ids, redirect_uris, icon_url, website_url } = body;

    if (!name || !owner_address) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'name and owner_address are required' } },
        422
      );
    }

    const id = crypto.randomUUID().replace(/-/g, '');
    const now = new Date().toISOString();

    await c.env.DB
      .prepare(
        `INSERT INTO projects (id, name, description, owner_address, chain_ids, redirect_uris, icon_url, website_url, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
      )
      .bind(
        id,
        name,
        description || '',
        owner_address,
        JSON.stringify(chain_ids || []),
        JSON.stringify(redirect_uris || []),
        icon_url || '',
        website_url || '',
        now,
        now
      )
      .run();

    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();

    return c.json(createSuccessResponse(project, { requestId: context.requestId }), 201);
  });

  // Update project
  router.put('/:id', authMiddleware, requirePermission('write'), async (c) => {
    const context = c.get('context');
    const id = c.req.param('id');
    const body = await c.req.json();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description);
    }
    if (body.chain_ids !== undefined) {
      fields.push('chain_ids = ?');
      values.push(JSON.stringify(body.chain_ids));
    }
    if (body.redirect_uris !== undefined) {
      fields.push('redirect_uris = ?');
      values.push(JSON.stringify(body.redirect_uris));
    }
    if (body.icon_url !== undefined) {
      fields.push('icon_url = ?');
      values.push(body.icon_url);
    }
    if (body.website_url !== undefined) {
      fields.push('website_url = ?');
      values.push(body.website_url);
    }
    if (body.status !== undefined) {
      fields.push('status = ?');
      values.push(body.status);
    }

    if (fields.length === 0) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        422
      );
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await c.env.DB
      .prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();

    return c.json(createSuccessResponse(project, { requestId: context.requestId }));
  });

  // Delete project
  router.delete('/:id', authMiddleware, requirePermission('admin'), async (c) => {
    const context = c.get('context');
    const id = c.req.param('id');

    await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();

    return c.json(createSuccessResponse({ deleted: true, id }, { requestId: context.requestId }));
  });

  return router;
}
