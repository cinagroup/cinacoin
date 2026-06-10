import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'router-worker',
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
