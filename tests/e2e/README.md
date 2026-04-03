# Intake E2E Tests

End-to-end tests for Intake using Playwright.

## Overview

E2E tests verify that Intake works correctly in real browser environments, testing:
- First visit scenarios with UTM parameters
- Organic traffic detection
- Referral traffic detection
- Session and visit tracking
- Cookie management

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in specific browser
```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Run tests in UI mode
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

## Test Structure

- `first-visit-utm.spec.ts` - Tests for first visit with UTM parameters
- `organic-traffic.spec.ts` - Tests for organic search traffic detection
- `referral-traffic.spec.ts` - Tests for referral traffic detection
- `sessions-visits.spec.ts` - Tests for session and visit tracking

## Test Page

Tests use `test/e2e-test-page.html` which loads Intake and exposes test data via `window.intkTestData` and `window.intkInitialized`.

## Configuration

Playwright configuration is in `playwright.config.ts`. Tests run against a local HTTP server on port 8000.

## CI/CD Integration

E2E tests are designed to run in CI/CD environments. Set `CI=true` environment variable for CI-specific behavior (retries, single worker, etc.).

