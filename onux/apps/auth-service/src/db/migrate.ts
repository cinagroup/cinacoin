/**
 * Database migration runner
 * Executes SQL migration files in order
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const pool = getPool();
  const migrationsDir = path.join(__dirname, '../../migrations');

  console.log('Starting database migration...');

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get list of migration files
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${sqlFiles.length} migration files`);

  // Get already executed migrations
  const executed = await pool.query('SELECT name FROM migrations');
  const executedNames = new Set(executed.rows.map((r) => r.name));

  // Execute pending migrations
  for (const file of sqlFiles) {
    if (executedNames.has(file)) {
      console.log(`⏭️  Skipping ${file} (already executed)`);
      continue;
    }

    console.log(`📦 Executing ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ ${file} completed`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ ${file} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('✅ Migration completed successfully');
  await closePool();
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
