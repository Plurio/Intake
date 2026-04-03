import { test, expect } from '@playwright/test';

/**
 * E2E tests for organic traffic detection
 */
test.describe('Organic Traffic Detection', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('should detect Google organic traffic', async ({ page }) => {
    // Simulate Google organic referrer
    await page.goto('/test/e2e-test-page.html', {
      referer: 'https://www.google.com/search?q=test+query'
    });
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    const testData = await page.evaluate(() => window.intkTestData);
    
    // Should detect as organic
    expect(testData.current.typ).toBe('organic');
    expect(testData.current.src).toBe('google');
    
    // First visit should also be organic
    expect(testData.first.typ).toBe('organic');
    expect(testData.first.src).toBe('google');
  });

  test('should detect Bing organic traffic', async ({ page }) => {
    await page.goto('/test/e2e-test-page.html', {
      referer: 'https://www.bing.com/search?q=test+query'
    });
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    const testData = await page.evaluate(() => window.intkTestData);
    
    expect(testData.current.typ).toBe('organic');
    expect(testData.current.src).toBe('bing');
  });

  test('should preserve first visit data on return organic visit', async ({ page, context }) => {
    // First visit with UTM
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&utm_campaign=test');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const firstVisitData = await page.evaluate(() => window.intkTestData);
    
    // Wait a bit and navigate again with organic
    await page.waitForTimeout(500);
    await page.goto('/test/e2e-test-page.html', {
      referer: 'https://www.google.com/search?q=test'
    });
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const secondVisitData = await page.evaluate(() => window.intkTestData);
    
    // Current should be organic
    expect(secondVisitData.current.typ).toBe('organic');
    expect(secondVisitData.current.src).toBe('google');
    
    // First should remain UTM
    expect(secondVisitData.first.typ).toBe('utm');
    expect(secondVisitData.first.cmp).toBe('test');
  });
});

