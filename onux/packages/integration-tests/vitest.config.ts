import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env if present
try { dotenv.config({ path: resolve(__dirname, '.env') }); } catch {}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    // Each test hits a real RPC — no parallelism to avoid rate limits
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
