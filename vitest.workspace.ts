/**
 * Vitest workspace configuration for Cinacoin monorepo.
 * Defines test projects for each package.
 */
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Core packages
  'packages/core-sdk',
  'packages/walletconnect-v2',
  'packages/siwe',
  'packages/next',
  'packages/tx-indexer',
  'packages/config',
  'packages/ui',
  'packages/react',
  'packages/vue',
  'packages/svelte',
  'packages/angular',

  // Adapters
  'packages/adapter-solana',
  'packages/adapter-cosmos',
  'packages/adapter-near',
  'packages/adapter-ton',
  'packages/adapter-tron',
  'packages/adapter-sui',
  'packages/adapter-starknet',
  'packages/adapter-hedera',
  'packages/adapter-bitcoin',
  'packages/adapter-xrpl',

  // Workers
  'workers/api-gateway',
  'workers/auth-service',
  'workers/user-service',
  'workers/router',
  'workers/verify-service',

  // Integration tests
  {
    test: {
      name: 'backend-integration',
      include: ['tests/backend-integration/**/*.test.ts'],
      environment: 'node',
      testTimeout: 30000,
    },
  },
]);
