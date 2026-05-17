import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        name: 'cdn',
        include: ['tests/**/*.test.ts'],
        environment: 'jsdom',
        globals: true,
    },
});
//# sourceMappingURL=vitest.config.js.map