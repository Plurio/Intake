import { test, expect } from '@playwright/test';

/**
 * E2E tests for sessions and visits tracking
 */
test.describe('Sessions and Visits Tracking', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('should create session cookie on first visit', async ({ page, context }) => {
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc');
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    await page.waitForTimeout(100);
    
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'intk_session');
    
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();
  });

  test('should increment pages_seen within session', async ({ page, context }) => {
    // First page load
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const firstPageData = await page.evaluate(() => window.intkTestData);
    
    expect(firstPageData.session.pgs).toBeGreaterThanOrEqual(1);
    
    // Second page load (within session)
    await page.waitForTimeout(500);
    await page.goto('/test/e2e-test-page.html');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const secondPageData = await page.evaluate(() => window.intkTestData);
    
    // Pages seen should increment
    expect(secondPageData.session.pgs).toBeGreaterThan(firstPageData.session.pgs);
  });

  test('should increment visits only when session expires', async ({ page, context }) => {
    // First visit
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const firstVisitData = await page.evaluate(() => window.intkTestData);
    
    expect(firstVisitData.udata.vst).toBe(1);
    
    // Second visit within session (should not increment visits)
    await page.waitForTimeout(500);
    await page.goto('/test/e2e-test-page.html');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const secondVisitData = await page.evaluate(() => window.intkTestData);
    
    // Visits should remain the same (session still active)
    expect(secondVisitData.udata.vst).toBe(1);
  });

  test('should track current page URL', async ({ page }) => {
    const testUrl = '/test/e2e-test-page.html?utm_source=google&utm_medium=cpc';
    await page.goto(testUrl);
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    const testData = await page.evaluate(() => window.intkTestData);
    
    // Current page should be tracked
    expect(testData.session.cpg).toContain('e2e-test-page.html');
  });

  test('should preserve first visit data across sessions', async ({ page, context }) => {
    // First visit with UTM
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&utm_campaign=first');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    await page.waitForTimeout(100); // Wait for cookies to be set
    const firstVisitData = await page.evaluate(() => window.intkTestData);
    
    const firstCampaign = firstVisitData.first.cmp;
    
    // Get cookies before clearing
    const cookiesBefore = await context.cookies();
    const firstCookie = cookiesBefore.find(c => c.name === 'intk_first');
    const udataCookie = cookiesBefore.find(c => c.name === 'intk_udata');
    
    // Simulate session expiry by clearing only session cookie
    await context.clearCookies();
    
    // Restore first and udata cookies to simulate return visit
    if (firstCookie) {
      await context.addCookies([firstCookie]);
    }
    if (udataCookie) {
      await context.addCookies([udataCookie]);
    }
    
    // New visit with different UTM
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&utm_campaign=second');
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    const secondVisitData = await page.evaluate(() => window.intkTestData);
    
    // Current should be new campaign
    expect(secondVisitData.current.cmp).toBe('second');
    
    // First should remain the original campaign
    expect(secondVisitData.first.cmp).toBe(firstCampaign);
  });
});

