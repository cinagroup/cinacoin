import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'cdn',
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
  },
});
