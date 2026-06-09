import { defineConfig } from 'cypress';
export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        specPattern: 'e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'e2e/cypress/support/e2e.ts',
        fixturesFolder: 'e2e/cypress/fixtures',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: false,
        screenshotOnRunFailure: true,
        retries: { runMode: 2, openMode: 0 },
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
        },
    },
});
//# sourceMappingURL=cypress.config.js.map