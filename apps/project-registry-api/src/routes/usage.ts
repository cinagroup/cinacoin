import { Hono } from 'hono';
import type { Env, UsageStat } from '../db/types';

export function usageRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // POST /api/usage/record — Record a usage event
  app.post('/usage/record', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json<{
      project_id: string;
      api_key_id?: string;
      endpoint?: string;
      is_error?: boolean;
      date?: string;
    }>();

    if (!body.project_id) {
      return c.json({ error: 'project_id is required' }, 400);
    }

    const today = body.date || new Date().toISOString().slice(0, 10);
    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO usage_stats (id, project_id, api_key_id, endpoint, request_count, error_count, date)
         VALUES (?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(project_id, date) DO UPDATE SET
           request_count = request_count + 1,
           error_count = error_count + ?`
      )
      .bind(
        id,
        body.project_id,
        body.api_key_id || null,
        body.endpoint || '',
        body.is_error ? 1 : 0,
        today,
        body.is_error ? 1 : 0
      )
      .run();

    return c.json({ recorded: true, date: today }, 201);
  });

  // GET /api/usage/:project_id — Get usage stats
  app.get('/usage/:project_id', async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('project_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    let query = 'SELECT * FROM usage_stats WHERE project_id = ?';
    const params: (string | number)[] = [projectId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    query += ' ORDER BY date DESC';

    const { results } = await db.prepare(query).bind(...params).all<UsageStat>();
    return c.json({ usage_stats: results });
  });

  return app;
}
