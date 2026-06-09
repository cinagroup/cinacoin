/**
 * Database migrations runner
 */
import { getPool, closePool } from './pool.js';
import { createLogger } from '../lib/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('user-service-migrate');

async function migrate() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.resolve(__dirname, '../../migrations');

  logger.info('Starting database migration...');

  const pool = getPool();

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get already applied migrations
  const { rows: applied } = await pool.query('SELECT name FROM _migrations ORDER BY id');
  const appliedSet = new Set(applied.map((r: any) => r.name));

  // Read migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let appliedCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      logger.info(`Skipping already applied: ${file}`);
      continue;
    }

    logger.info(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      appliedCount++;
      logger.info(`Applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Failed to apply ${file}`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  logger.info(`Migration complete. Applied ${appliedCount} new migration(s).`);
  await closePool();
}

migrate().catch((err) => {
  logger.error('Migration failed', err);
  process.exit(1);
});
