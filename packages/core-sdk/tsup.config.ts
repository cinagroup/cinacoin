import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
    chains: 'src/chains/index.ts',
    'utils/signature': 'src/utils/signature.ts',
    'utils/chain': 'src/utils/chain.ts',
    'utils/circuitBreaker': 'src/utils/circuitBreaker.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
