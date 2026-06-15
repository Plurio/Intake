import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildBrowserInfo } from '../../../src/browser/detect';
import { DEFAULT_IN_APP_BROWSERS } from '../../../src/core';

// Sample User-Agents
const UA = {
  CHROME: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  SAFARI: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  FIREFOX: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  EDGE: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  SAMSUNG: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  OPERA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.100 Safari/537.36 OPR/106.0.0.0',
  INSTAGRAM: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 250.0.0.21.109',
  FACEBOOK: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/400.0.0.0.0]',
  TIKTOK: 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016) AppleWebKit/537.36 (KHTML, like Gecko) musical_ly_27.0.0 TikTok/27.0.0 Mobile Safari/537.36',
  TELEGRAM: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TgWebApp/9.0.0',
};

function mockNavigator(ua: string, language = 'en-US') {
  Object.defineProperty(global, 'navigator', {
    value: { userAgent: ua, language },
    writable: true,
    configurable: true,
  });
}

describe('buildBrowserInfo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('browser_type detection', () => {
    it('detects Chrome', () => {
      mockNavigator(UA.CHROME);
      const info = buildBrowserInfo([]);
      expect(info.browser_type).toBe('chrome');
      expect(info.is_in_app).toBe(false);
    });

    it('detects Safari', () => {
      mockNavigator(UA.SAFARI);
      const info = buildBrowserInfo([]);
      expect(info.browser_type).toBe('safari');
    });

    it('detects Firefox', () => {
      mockNavigator(UA.FIREFOX);
      const info = buildBrowserInfo([]);
      expect(info.browser_type).toBe('firefox');
    });

    it('detects Edge (contains Chrome in UA)', () => {
      mockNavigator(UA.EDGE);
      const info = buildBrowserInfo([]);
      expect(info.browser_type).toBe('edge');
    });

    it('detects Samsung Browser (contains Chrome in UA)', () => {
      mockNavigator(UA.SAMSUNG);
      const info = buildBrowserInfo([]);
      expect(info.browser_type).toBe('samsung');
    });

    it('detects Opera (contains Chrome in UA)', () => {
      mockNavigator(UA.OPERA);
      const info = buildBrowserInfo([]);
      expect(info.browser_type).toBe('opera');
    });
  });

  describe('in-app browser detection', () => {
    it('detects Instagram webview', () => {
      mockNavigator(UA.INSTAGRAM, 'ru-RU');
      const info = buildBrowserInfo(DEFAULT_IN_APP_BROWSERS);
      expect(info.browser_type).toBe('in_app');
      expect(info.is_in_app).toBe(true);
      expect(info.in_app_source).toBe('instagram');
    });

    it('detects Facebook webview', () => {
      mockNavigator(UA.FACEBOOK);
      const info = buildBrowserInfo(DEFAULT_IN_APP_BROWSERS);
      expect(info.browser_type).toBe('in_app');
      expect(info.is_in_app).toBe(true);
      expect(info.in_app_source).toBe('facebook');
    });

    it('detects TikTok webview', () => {
      mockNavigator(UA.TIKTOK);
      const info = buildBrowserInfo(DEFAULT_IN_APP_BROWSERS);
      expect(info.browser_type).toBe('in_app');
      expect(info.is_in_app).toBe(true);
      expect(info.in_app_source).toBe('tiktok');
    });

    it('detects Telegram webview', () => {
      mockNavigator(UA.TELEGRAM);
      const info = buildBrowserInfo(DEFAULT_IN_APP_BROWSERS);
      expect(info.browser_type).toBe('in_app');
      expect(info.is_in_app).toBe(true);
      expect(info.in_app_source).toBe('telegram');
    });

    it('is_in_app is false for regular Chrome', () => {
      mockNavigator(UA.CHROME);
      const info = buildBrowserInfo(DEFAULT_IN_APP_BROWSERS);
      expect(info.is_in_app).toBe(false);
      expect(info.in_app_source).toBeUndefined();
    });

    it('in_app_source is absent when not in-app', () => {
      mockNavigator(UA.CHROME);
      const info = buildBrowserInfo(DEFAULT_IN_APP_BROWSERS);
      expect('in_app_source' in info).toBe(false);
    });

    it('works with empty in_app_browsers list', () => {
      mockNavigator(UA.INSTAGRAM);
      const info = buildBrowserInfo([]);
      expect(info.is_in_app).toBe(false);
      expect(info.browser_type).not.toBe('in_app');
    });

    it('skips entries with invalid regex silently', () => {
      mockNavigator(UA.CHROME);
      const info = buildBrowserInfo([{ pattern: '[invalid(', source: 'bad' }]);
      expect(info.is_in_app).toBe(false);
    });
  });

  describe('language', () => {
    it('captures navigator.language', () => {
      mockNavigator(UA.CHROME, 'ru-RU');
      const info = buildBrowserInfo([]);
      expect(info.language).toBe('ru-RU');
    });

    it('captures en-US locale', () => {
      mockNavigator(UA.SAFARI, 'en-US');
      const info = buildBrowserInfo([]);
      expect(info.language).toBe('en-US');
    });
  });

  describe('user_agent', () => {
    it('returns raw navigator.userAgent', () => {
      mockNavigator(UA.CHROME, 'en-US');
      const info = buildBrowserInfo([]);
      expect(info.user_agent).toBe(UA.CHROME);
    });
  });
});
