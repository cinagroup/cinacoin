import { Hono } from 'hono';
import type { Env, UsageStat } from '../db/types';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const recordUsageSchema = z.object({
  project_id: z.string().uuid().optional(),
  api_key_id: z.string().uuid().optional(),
  endpoint: z.string().max(200).optional(),
  is_error: z.boolean().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const getUsageQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  granularity: z.enum(['daily', 'hourly']).default('daily'),
});

const getUsageSummaryQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(365)).default('30'),
});

const getUsageStatsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1000)).default('100'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).default('0'),
});

export function usageRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  // POST /api/usage/record — Record a usage event (protected)
  app.post('/usage/record', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const rawBody = await c.req.json();
    const validation = recordUsageSchema.safeParse(rawBody);

    if (!validation.success) {
      return c.json({ error: validation.error.flatten() }, 400);
    }

    const body = validation.data;

    // Use authenticated project if not specified
    const projectId = body.project_id || c.get('projectId');
    if (!projectId) {
      return c.json({ error: 'project_id is required' }, 400);
    }

    const apiKeyId = body.api_key_id || c.get('apiKeyId');
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
        projectId,
        apiKeyId || null,
        body.endpoint || '',
        body.is_error ? 1 : 0,
        today,
        body.is_error ? 1 : 0
      )
      .run();

    return c.json({ recorded: true, date: today }, 201);
  });

  // GET /api/usage/:project_id — Get usage stats (protected)
  app.get('/usage/:project_id', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('project_id');
    const parsed = getUsageQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400);
    }
    const { start_date, end_date, granularity } = parsed.data;

    let query = 'SELECT * FROM usage_stats WHERE project_id = ?';
    const params: (string | number)[] = [projectId];

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }
    query += ' ORDER BY date DESC';

    const { results } = await db.prepare(query).bind(...params).all<UsageStat>();

    // Calculate summary
    const totalRequests = results.reduce((sum: number, r: UsageStat) => sum + r.request_count, 0);
    const totalErrors = results.reduce((sum: number, r: UsageStat) => sum + r.error_count, 0);

    return c.json({
      usage_stats: results,
      summary: {
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) : '0',
        granularity,
        dateRange: {
          start: start_date || (results.length > 0 ? results[results.length - 1].date : null),
          end: end_date || (results.length > 0 ? results[0].date : null),
        },
      },
    });
  });

  // GET /api/usage/:project_id/summary — Get usage summary with aggregation (protected)
  app.get('/usage/:project_id/summary', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const projectId = c.req.param('project_id');
    const parsed = getUsageSummaryQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400);
    }
    const { days } = parsed.data;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0, 10);

    // Total requests and errors
    const totalQuery = `
      SELECT
        SUM(request_count) as total_requests,
        SUM(error_count) as total_errors,
        COUNT(*) as days_active
      FROM usage_stats
      WHERE project_id = ? AND date >= ?
    `;
    const totalResult = await db.prepare(totalQuery).bind(projectId, startDateStr).first<{
      total_requests: number;
      total_errors: number;
      days_active: number;
    }>();

    // Top endpoints by request count
    const topEndpointsQuery = `
      SELECT endpoint, SUM(request_count) as total_requests
      FROM usage_stats
      WHERE project_id = ? AND date >= ?
      GROUP BY endpoint
      ORDER BY total_requests DESC
      LIMIT 10
    `;
    const { results: topEndpoints } = await db.prepare(topEndpointsQuery).bind(projectId, startDateStr).all<{
      endpoint: string;
      total_requests: number;
    }>();

    // Daily breakdown
    const dailyQuery = `
      SELECT date, request_count, error_count
      FROM usage_stats
      WHERE project_id = ? AND date >= ?
      ORDER BY date ASC
    `;
    const { results: dailyStats } = await db.prepare(dailyQuery).bind(projectId, startDateStr).all<UsageStat>();

    const totalRequests = totalResult?.total_requests ?? 0;
    const totalErrors = totalResult?.total_errors ?? 0;

    return c.json({
      projectId,
      period: {
        days,
        start: startDateStr,
        end: new Date().toISOString().slice(0, 10),
      },
      totals: {
        requests: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? parseFloat((totalErrors / totalRequests * 100).toFixed(2)) : 0,
        avgRequestsPerDay: days > 0 ? parseFloat((totalRequests / days).toFixed(2)) : 0,
      },
      topEndpoints: topEndpoints || [],
      dailyStats: dailyStats || [],
    });
  });

  // GET /api/usage/stats — Get all usage stats (admin, protected)
  app.get('/usage/stats', apiKeyAuth, async (c) => {
    const db = c.env.DB;
    const parsed = getUsageStatsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400);
    }
    const { limit, offset } = parsed.data;

    const query = `
      SELECT us.*, p.name as project_name
      FROM usage_stats us
      LEFT JOIN projects p ON us.project_id = p.id
      ORDER BY us.date DESC
      LIMIT ? OFFSET ?
    `;

    const { results } = await db.prepare(query).bind(limit, offset).all<UsageStat & { project_name: string }>();

    return c.json({ usage_stats: results, total: results.length });
  });

  return app;
}
