/**
 * Test Coverage Report Configuration
 *
 * Generates comprehensive coverage reports for all test suites.
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    name: 'coverage-report',
    globals: true,
    environment: 'node',
    include: [
      'packages/*/tests/**/*.test.ts',
      'workers/*/tests/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      'e2e/**',
      'load-tests/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: [
        'text',           // Console output
        'text-summary',   // Summary to console
        'json',           // JSON format
        'json-summary',   // JSON summary
        'html',           // HTML report
        'lcov',           // LCOV for CI
        'clover',         // Clover for Atlassian
        'cobertura',      // Cobertura for Jenkins
      ],
      reportsDirectory: './coverage',
      
      // Files to include in coverage
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/src/**/*.tsx',
        'workers/*/src/**/*.ts',
        'apps/*/src/**/*.ts',
        'apps/*/src/**/*.tsx',
      ],
      
      // Files to exclude from coverage
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/tests/**',
        '**/__tests__/**',
        '**/mocks/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/index.ts',      // Re-exports
        '**/types.ts',      // Type definitions
        '**/constants.ts',  // Constants
      ],
      
      // Coverage thresholds
      thresholds: {
        // Global thresholds
        statements: 70,
        branches: 65,
        functions: 75,
        lines: 70,
        
        // Per-file thresholds (optional)
        // 'packages/core-sdk/src/**/*.ts': {
        //   statements: 80,
        //   branches: 75,
        //   functions: 85,
        //   lines: 80,
        // },
      },
      
      // Watermarks for color coding
      watermarks: {
        statements: [50, 80],
        branches: [50, 75],
        functions: [50, 80],
        lines: [50, 80],
      },
      
      // Skip files with no coverage
      skipFull: false,
      
      // Clean coverage directory before each run
      clean: true,
      
      // Allow uncovered files
      allowExternal: false,
      
      // Extension pattern
      extension: ['.ts', '.tsx', '.js', '.jsx'],
    },
    
    // Test reporters
    reporters: [
      'default',      // Console output
      'json',         // JSON results
      'junit',        // JUnit XML for CI
      'html',         // HTML report
    ],
    
    // Output files
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml',
      html: './test-results/html',
    },
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        execArgv: [],
      },
    },
    
    // Test timeout
    testTimeout: 15000,
    hookTimeout: 10000,
    
    // Retry failed tests
    retry: process.env.CI ? 2 : 0,
    
    // Pass with no tests
    passWithNoTests: true,
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@cinacoin/core-sdk': path.resolve(__dirname, 'packages/core-sdk/src'),
      '@cinacoin/siwe': path.resolve(__dirname, 'packages/siwe/src'),
      '@cinacoin/next': path.resolve(__dirname, 'packages/next/src'),
      '@cinacoin/tx-indexer': path.resolve(__dirname, 'packages/tx-indexer/src'),
      '@cinacoin/config': path.resolve(__dirname, 'packages/config/src'),
      '@cinacoin/ui': path.resolve(__dirname, 'packages/ui/src'),
      '@cinacoin/react': path.resolve(__dirname, 'packages/react/src'),
    },
  },
});
