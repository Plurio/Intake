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

  test('should split session on mid-session referral when referral_starts_new_session is true', async ({ page, context }) => {
    // The fixture must merge `window.__intkE2eConfig` into its `intk.init({...})`
    // call so this test can flip the flag without touching the (gitignored)
    // fixture file. If you see this test failing with the referral being
    // ignored, update test/e2e-test-page.html to honour __intkE2eConfig.
    await page.addInitScript(() => {
      (window as any).__intkE2eConfig = { referral_starts_new_session: true };
    });

    // First visit with UTM — establishes the initial source + session.
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&utm_campaign=first');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const firstData = await page.evaluate(() => window.intkTestData);
    expect(firstData.current.typ).toBe('utm');
    expect(firstData.session.pgs).toBe(1);
    expect(firstData.udata.vst).toBe(1);
    const initialTouchpointCount = firstData.touchpoints.touchpoints.length;

    await page.waitForTimeout(500);

    // Mid-session referral arrives with the flag on — session should split.
    await page.goto('/test/e2e-test-page.html', { referer: 'https://example.com/page' });
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const secondData = await page.evaluate(() => window.intkTestData);

    expect(secondData.current.typ).toBe('referral');
    expect(secondData.current.src).toBe('example.com');
    expect(secondData.session.pgs).toBe(1);            // page counter reset
    expect(secondData.udata.vst).toBe(2);              // new visit counted
    expect(secondData.touchpoints.touchpoints.length).toBe(initialTouchpointCount + 1);
    // First-touch is untouched.
    expect(secondData.first.typ).toBe('utm');
    expect(secondData.first.cmp).toBe('first');
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

