/**
 * Root Vitest configuration for Cinacoin monorepo.
 *
 * Coverage thresholds (monorepo-wide):
 *   statements: 70%   branches: 65%   functions: 75%   lines: 70%
 *
 * Note: passWithNoTests is false — packages without tests will FAIL.
 *       This ensures we track and improve test coverage over time.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/*/tests/**/*.test.ts',
      'packages/*/src/**/*.test.ts',
      'workers/*/tests/**/*.test.ts',
      'workers/*/src/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', 'e2e/**', 'load-tests/**'],
    testTimeout: 15000,
    hookTimeout: 10000,
    passWithNoTests: false, // SECURITY: Fail if a package has no tests
    reporters: ['default', 'json', 'junit'],
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: [
        'packages/*/src/**/*.ts',
        'workers/*/src/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        '**/types.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 75,
        lines: 70,
      },
    },
  },
});
