import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
    test: {
        name: 'pay-ui',
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        environment: 'jsdom',
        globals: true,
    },
    resolve: {
        alias: {
            '@cinaconnect/swap-sdk': path.resolve(__dirname, '../../packages/swap-sdk/src/index.ts'),
            '@cinaconnect/onramp-sdk': path.resolve(__dirname, '../../packages/onramp-sdk/src/index.ts'),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map