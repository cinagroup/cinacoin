/**
 * Health check endpoint
 */
import { NextResponse } from 'next/server';
import { getPool } from '@/db/pool';
import { createLogger } from '@/lib/logger';

const logger = createLogger('health');

export async function GET() {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: process.env.npm_package_version || '0.1.0',
  };

  // Check database connection
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    logger.error('Database health check failed', error);
    health.database = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
