/**
 * Vitest configuration for @cinacoin/social-login.
 *
 * Adds a resolve plugin so `.js` imports in test files resolve to `.ts` source files.
 */
import { defineConfig } from 'vitest/config';

/**
 * Plugin that rewrites `.js` imports to `.ts` for local source files.
 */
function tsResolvePlugin() {
  return {
    name: 'social-login-ts-resolve',
    resolveId(source: string, importer: string | undefined) {
      if (!importer) return null;
      if (source.startsWith('.') && source.endsWith('.js')) {
        const tsPath = source.replace(/\.js$/, '.ts');
        return this.resolve(tsPath, importer, { skipSelf: true });
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [tsResolvePlugin()],
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/social-login/src/__tests__/**/*.test.ts',
      'packages/social-login/tests/**/*.test.ts',
    ],
  },
});
