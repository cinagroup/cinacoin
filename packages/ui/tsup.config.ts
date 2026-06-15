import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    Modal: 'src/Modal.tsx',
    Brand: 'src/Brand.tsx',
    SiteHeader: 'src/SiteHeader.tsx',
    SiteFooter: 'src/SiteFooter.tsx',
    EmptyState: 'src/EmptyState.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
});
