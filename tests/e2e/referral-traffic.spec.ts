import { test, expect } from '@playwright/test';

/**
 * E2E tests for referral traffic detection
 */
test.describe('Referral Traffic Detection', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('should detect referral traffic from external site', async ({ page }) => {
    await page.goto('/test/e2e-test-page.html', {
      referer: 'https://example.com/page'
    });
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    const testData = await page.evaluate(() => window.intkTestData);
    
    // Should detect as referral
    expect(testData.current.typ).toBe('referral');
    expect(testData.current.src).toBe('example.com');
    
    // First visit should also be referral
    expect(testData.first.typ).toBe('referral');
    expect(testData.first.src).toBe('example.com');
  });

  test('should not update referral if session exists', async ({ page, context }) => {
    // First visit with referral
    await page.goto('/test/e2e-test-page.html', {
      referer: 'https://example.com/page'
    });
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const firstVisitData = await page.evaluate(() => window.intkTestData);
    
    // Wait a bit (within session)
    await page.waitForTimeout(500);
    
    // Navigate again with different referral (within session)
    await page.goto('/test/e2e-test-page.html', {
      referer: 'https://another-site.com/page'
    });
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const secondVisitData = await page.evaluate(() => window.intkTestData);
    
    // Current should remain the same (referral doesn't update within session)
    expect(secondVisitData.current.typ).toBe('referral');
    expect(secondVisitData.current.src).toBe('example.com');
    
    // First should remain the same
    expect(secondVisitData.first.typ).toBe('referral');
    expect(secondVisitData.first.src).toBe('example.com');
  });

  test('should detect typein when no referrer', async ({ page }) => {
    await page.goto('/test/e2e-test-page.html');
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    const testData = await page.evaluate(() => window.intkTestData);
    
    // Should detect as typein (no referrer)
    expect(testData.current.typ).toBe('typein');
    
    // First visit should also be typein
    expect(testData.first.typ).toBe('typein');
  });
});

