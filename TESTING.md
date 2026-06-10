# Testing Guide - Cinacoin

Comprehensive testing documentation for the Cinacoin monorepo.

## Test Structure

```
cinacoin/
├── packages/
│   ├── core-sdk/tests/          # Core SDK unit tests
│   ├── siwe/tests/              # SIWE tests
│   ├── next/tests/              # Next.js middleware tests
│   ├── tx-indexer/tests/        # TX Indexer tests
│   ├── config/tests/            # Config tests
│   └── ui/tests/                # UI component tests
├── workers/
│   └── api-gateway/tests/       # API Gateway integration tests
├── e2e/
│   └── tests/                   # Playwright E2E tests
├── load-tests/                  # k6 load tests
└── tests/
    └── backend-integration/     # Backend integration tests
```

## Quick Start

### Run all tests
```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Run specific test suites
```bash
# Unit tests
npx vitest run packages/core-sdk/tests/
npx vitest run packages/siwe/tests/
npx vitest run packages/ui/tests/

# Integration tests
npx vitest run --config vitest.config.backend-integration.js

# E2E tests
npx playwright test

# Load tests
k6 run load-tests/api-endpoints.js
```

## Unit Tests

### Framework
- **Vitest** - Fast Vite-native testing framework
- **TypeScript** - Full TypeScript support
- **Coverage** - v8 coverage provider

### Configuration
- Root config: `vitest.config.ts`
- Workspace: `vitest.workspace.ts`
- Coverage: `vitest.config.coverage.ts`

### Coverage Thresholds
- Statements: 70%
- Branches: 65%
- Functions: 75%
- Lines: 70%

### Running Tests

```bash
# All tests
npx vitest run

# Specific package
npx vitest run packages/core-sdk

# With coverage
npx vitest run --coverage

# Watch mode
npx vitest

# UI mode
npx vitest --ui
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

## Integration Tests

### Backend Integration
Tests for backend services and APIs.

```bash
npx vitest run --config vitest.config.backend-integration.js
```

### API Gateway Tests
Tests for authentication, rate limiting, CORS, and error handling.

```bash
npx vitest run workers/api-gateway/tests/
```

## E2E Tests

### Framework
- **Playwright** - Cross-browser E2E testing
- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop and mobile

### Configuration
- Config: `e2e/playwright.config.ts`
- Tests: `e2e/tests/`

### Running Tests

```bash
# All E2E tests
npx playwright test

# Specific test
npx playwright test connect-flow

# With UI
npx playwright test --ui

# Headed mode
npx playwright test --headed

# Specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Test Coverage
- Wallet connection flow
- Transaction signing
- Chain switching
- Message signing
- Error recovery
- Mobile deep linking

## Load Tests

### Framework
- **k6** - Modern load testing tool
- **Scripts**: JavaScript/TypeScript

### Running Tests

```bash
# API endpoints
k6 run load-tests/api-endpoints.js

# WebSocket connections
k6 run load-tests/websocket.js

# Authentication throughput
k6 run load-tests/auth-throughput.js

# Database queries
k6 run load-tests/db-queries.js
```

### Performance Targets
- API p95 latency: < 500ms
- API p99 latency: < 1000ms
- Error rate: < 1%
- WebSocket latency: < 200ms
- Cache hit rate: > 70%

## Coverage Reports

### Generate Reports

```bash
# HTML report
npx vitest run --coverage --reporter=html

# View HTML report
open coverage/index.html

# JSON report
npx vitest run --coverage --reporter=json

# LCOV report (for CI)
npx vitest run --coverage --reporter=lcov
```

### Coverage Types
- **Unit tests**: Core business logic
- **Integration tests**: API endpoints
- **E2E tests**: User flows
- **Load tests**: Performance characteristics

### CI Integration

Coverage reports are automatically generated in CI:
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format
- `test-results/junit.xml` - JUnit XML

## Test Utilities

### Mock Providers

```typescript
// Mock wallet provider
class MockWalletProvider {
  async connect() { /* ... */ }
  async disconnect() { /* ... */ }
  async signMessage() { /* ... */ }
}
```

### Test Helpers

```typescript
// E2E helpers
import { getConnectButton, waitForConnected } from '../helpers/wallet';
```

### Fixtures

```typescript
// Playwright fixtures
import { test, expect } from '../fixtures';
```

## Best Practices

### Unit Tests
1. Test one thing per test
2. Use descriptive test names
3. Mock external dependencies
4. Test edge cases and errors
5. Keep tests independent

### Integration Tests
1. Test real API endpoints
2. Use test databases
3. Clean up after tests
4. Test authentication flows
5. Test error scenarios

### E2E Tests
1. Test user workflows
2. Use realistic data
3. Test across browsers
4. Test mobile devices
5. Handle async operations

### Load Tests
1. Start with small loads
2. Gradually increase
3. Monitor system metrics
4. Identify bottlenecks
5. Set realistic targets

## Debugging Tests

### Unit Tests
```bash
# Debug with VS Code
# Add to .vscode/launch.json

# Debug specific test
npx vitest run --inspect-brk packages/core-sdk/tests/core.test.ts
```

### E2E Tests
```bash
# Debug mode
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip

# Screenshot on failure
# Configured in playwright.config.ts
```

### Load Tests
```bash
# Verbose output
k6 run --verbose load-tests/api-endpoints.js

# Debug logging
K6_LOG_LEVEL=debug k6 run load-tests/api-endpoints.js
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: coverage/
```

### Coverage Badges

Add to README:
```markdown
![Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)
```

## Troubleshooting

### Tests fail in CI but pass locally
- Check environment variables
- Verify dependencies are installed
- Check for race conditions
- Increase timeouts

### Coverage is low
- Add more test cases
- Test edge cases
- Test error paths
- Remove dead code

### E2E tests are flaky
- Add explicit waits
- Use test IDs
- Retry failed tests
- Check for race conditions

### Load tests show high latency
- Check database queries
- Verify caching
- Check network latency
- Monitor server resources

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
