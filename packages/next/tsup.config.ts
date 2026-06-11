import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'components/index': 'src/components/index.tsx',
    'app-router/index': 'src/AppKitProvider.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['next', 'react', 'react-dom', 'viem'],
});
