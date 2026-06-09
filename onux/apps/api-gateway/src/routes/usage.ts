import { Hono } from 'hono';
import type { Env, RequestContext } from '../lib/types';
import { authMiddleware } from '../middleware/auth';
import { createSuccessResponse, parsePagination } from '../lib/utils';

/**
 * Usage analytics routes
 * Query API usage statistics and request logs
 */
export function usageRoutes() {
  const router = new Hono<{
    Bindings: Env;
    Variables: { context: RequestContext };
  }>();

  // Get usage summary
  router.get('/summary', authMiddleware, async (c) => {
    const context = c.get('context');
    const projectId = context.projectId;

    // Get total requests in last 24h
    const last24h = await c.env.DB
      .prepare(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as errors
         FROM request_logs 
         WHERE project_id = ? AND created_at > datetime('now', '-24 hours')`
      )
      .bind(projectId)
      .first<{ total: number; errors: number }>();

    // Get daily stats for last 7 days
    const dailyStats = await c.env.DB
      .prepare(
        `SELECT date(created_at) as date,
                COUNT(*) as requests,
                SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as errors,
                AVG(duration_ms) as avg_duration_ms
         FROM request_logs
         WHERE project_id = ? AND created_at > datetime('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY date DESC`
      )
      .bind(projectId)
      .all();

    // Get top endpoints
    const topEndpoints = await c.env.DB
      .prepare(
        `SELECT path, COUNT(*) as count, AVG(duration_ms) as avg_duration_ms
         FROM request_logs
         WHERE project_id = ? AND created_at > datetime('now', '-24 hours')
         GROUP BY path
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(projectId)
      .all();

    return c.json(
      createSuccessResponse(
        {
          last24h: {
            totalRequests: last24h?.total || 0,
            totalErrors: last24h?.errors || 0,
            errorRate: last24h?.total ? ((last24h.errors || 0) / last24h.total * 100).toFixed(2) + '%' : '0%',
          },
          dailyStats: dailyStats.results,
          topEndpoints: topEndpoints.results,
        },
        { requestId: context.requestId }
      )
    );
  });

  // Get request logs
  router.get('/logs', authMiddleware, async (c) => {
    const context = c.get('context');
    const projectId = context.projectId;
    const url = new URL(c.req.url);
    const { limit, offset } = parsePagination(url);

    const logs = await c.env.DB
      .prepare(
        'SELECT * FROM request_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .bind(projectId, limit, offset)
      .all();

    const countResult = await c.env.DB
      .prepare('SELECT COUNT(*) as total FROM request_logs WHERE project_id = ?')
      .bind(projectId)
      .first<{ total: number }>();

    return c.json(
      createSuccessResponse(logs.results, {
        requestId: context.requestId,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: countResult?.total || 0,
        },
      })
    );
  });

  // Get usage by endpoint
  router.get('/endpoints', authMiddleware, async (c) => {
    const context = c.get('context');
    const projectId = context.projectId;
    const url = new URL(c.req.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);

    const stats = await c.env.DB
      .prepare(
        `SELECT endpoint,
                SUM(request_count) as total_requests,
                SUM(error_count) as total_errors,
                AVG(request_count) as avg_daily_requests
         FROM usage_stats
         WHERE project_id = ? AND date > datetime('now', '-' || ? || ' days')
         GROUP BY endpoint
         ORDER BY total_requests DESC`
      )
      .bind(projectId, days)
      .all();

    return c.json(createSuccessResponse(stats.results, { requestId: context.requestId }));
  });

  return router;
}
