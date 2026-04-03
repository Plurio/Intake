import { test, expect } from '@playwright/test';

/**
 * E2E tests for first visit with UTM parameters
 */
test.describe('First Visit with UTM', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies before each test
    await context.clearCookies();
  });

  test('should detect UTM traffic on first visit', async ({ page }) => {
    // Navigate with UTM parameters
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&utm_campaign=test_campaign&utm_content=ad1&utm_term=keyword');
    
    // Wait for initialization
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    // Get test data
    const testData = await page.evaluate(() => window.intkTestData);
    
    // Verify current source is UTM
    expect(testData.current.typ).toBe('utm');
    expect(testData.current.src).toBe('google');
    expect(testData.current.mdm).toBe('cpc');
    expect(testData.current.cmp).toBe('test_campaign');
    expect(testData.current.cnt).toBe('ad1');
    expect(testData.current.trm).toBe('keyword');
    
    // Verify first source matches current (first visit)
    expect(testData.first.typ).toBe('utm');
    expect(testData.first.src).toBe('google');
    expect(testData.first.cmp).toBe('test_campaign');
    
    // Verify session data
    expect(testData.session.pgs).toBeGreaterThanOrEqual(1);
    
    // Verify user data
    expect(testData.udata.vst).toBe(1); // First visit
  });

  test('should detect gclid parameter', async ({ page }) => {
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&gclid=test123');
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    const testData = await page.evaluate(() => window.intkTestData);
    
    // gclid should be detected as UTM traffic
    expect(testData.current.typ).toBe('utm');
    expect(testData.current.src).toBe('google');
  });

  test('should create cookies on first visit', async ({ page, context }) => {
    await page.goto('/test/e2e-test-page.html?utm_source=google&utm_medium=cpc&utm_campaign=test');
    
    await page.waitForFunction(() => window.intkInitialized === true, { timeout: 5000 });
    
    // Wait a bit for cookies to be set
    await page.waitForTimeout(100);
    
    const cookies = await context.cookies();
    const intkCookies = cookies.filter(c => c.name.startsWith('intk_'));
    
    // Should have at least these cookies: current, first, session, udata
    const cookieNames = intkCookies.map(c => c.name);
    expect(cookieNames).toContain('intk_current');
    expect(cookieNames).toContain('intk_first');
    expect(cookieNames).toContain('intk_session');
    expect(cookieNames).toContain('intk_udata');
  });
});

