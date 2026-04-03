import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getConsentStatus,
  getConsentStatusSync,
  checkConsent,
  resolveConsentConfig,
  waitForGtag
} from '@/privacy/consent';
import type { ConsentStatus } from '@/types';

describe('privacy/consent', () => {
  beforeEach(() => {
    // Clear window.gtag before each test
    delete (window as any).gtag;
  });

  describe('waitForGtag()', () => {
    it('should resolve immediately if gtag is already available', async () => {
      (window as any).gtag = vi.fn();

      const startTime = Date.now();
      const result = await waitForGtag(1000);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100); // Should be nearly instant
    });

    it('should resolve false after timeout if gtag is not available', async () => {
      delete (window as any).gtag;

      const startTime = Date.now();
      const result = await waitForGtag(200); // Short timeout for test
      const elapsed = Date.now() - startTime;

      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(200);
      expect(elapsed).toBeLessThan(500); // Should not take too long
    });

    it('should resolve true when gtag becomes available during polling', async () => {
      delete (window as any).gtag;

      // Add gtag after 100ms
      setTimeout(() => {
        (window as any).gtag = vi.fn();
      }, 100);

      const startTime = Date.now();
      const result = await waitForGtag(1000);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(500); // Should resolve shortly after gtag appears
    });
  });

  describe('getConsentStatusSync()', () => {
    it('should return default consent when gtag is not available', () => {
      delete (window as any).gtag;
      const status = getConsentStatusSync('denied');
      expect(status).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });

    it('should return granted when default is granted and gtag is not available', () => {
      delete (window as any).gtag;
      const status = getConsentStatusSync('granted');
      expect(status).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should call gtag when available', () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;

      getConsentStatusSync('denied');

      expect(mockGtag).toHaveBeenCalledWith('consent', 'get', expect.any(Object));
    });
  });

  describe('getConsentStatus()', () => {
    it('should return default consent when gtag is not available', async () => {
      delete (window as any).gtag;
      // timeout=0 so we don't wait for gtag (it's absent)
      const status = await getConsentStatus('denied', 0);
      expect(status).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });

    it('should return granted when default is granted and gtag is not available', async () => {
      delete (window as any).gtag;
      // timeout=0 so we don't wait for gtag (it's absent)
      const status = await getConsentStatus('granted', 0);
      expect(status).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should call gtag and resolve with consent status', async () => {
      const mockGtag = vi.fn((command: string, action: string, params: any) => {
        if (command === 'consent' && action === 'get') {
          // Invoke callbacks via microtask
          Promise.resolve().then(() => {
            params['analytics_storage']('granted');
            params['ad_storage']('granted');
          });
        }
      });

      (window as any).gtag = mockGtag;

      // timeout=0 so we don't wait for gtag (it's already present)
      const status = await getConsentStatus('denied', 0);

      expect(mockGtag).toHaveBeenCalledWith('consent', 'get', expect.any(Object));
      expect(status).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should handle mixed consent statuses', async () => {
      const mockGtag = vi.fn((command: string, action: string, params: any) => {
        if (command === 'consent' && action === 'get') {
          // Invoke callbacks with different statuses via microtask
          // so they execute before the timeout
          Promise.resolve().then(() => {
            params['analytics_storage']('granted');
            params['ad_storage']('denied');
          });
        }
      });

      (window as any).gtag = mockGtag;

      // Pass timeout=0 so we don't wait for gtag (it's already present)
      const status = await getConsentStatus('denied', 0);

      expect(status).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should timeout and return default if Consent Mode does not respond', async () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;

      // timeout=0 so we don't wait for gtag (it's already present)
      // We don't invoke callbacks in mockGtag — the internal consent timeout should fire
      const status = await getConsentStatus('denied', 0);

      // Should return default after timeout
      expect(status).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });
  });

  describe('checkConsent()', () => {
    it('should return true when analytics_storage is granted', () => {
      const status: ConsentStatus = {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      };
      expect(checkConsent(status)).toBe(true);
    });

    it('should return true when analytics_storage is granted even if ad_storage is denied', () => {
      const status: ConsentStatus = {
        analytics_storage: 'granted',
        ad_storage: 'denied'
      };
      expect(checkConsent(status)).toBe(true);
    });

    it('should return false when analytics_storage is denied', () => {
      const status: ConsentStatus = {
        analytics_storage: 'denied',
        ad_storage: 'granted'
      };
      expect(checkConsent(status)).toBe(false);
    });

    it('should return false when both are denied', () => {
      const status: ConsentStatus = {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      };
      expect(checkConsent(status)).toBe(false);
    });
  });

  describe('resolveConsentConfig()', () => {
    it('should return disabled config when config is undefined', () => {
      const resolved = resolveConsentConfig(undefined);
      expect(resolved).toEqual({
        enabled: false,
        defaultConsent: 'denied'
      });
    });

    it('should return disabled config when enabled is false', () => {
      const resolved = resolveConsentConfig({ enabled: false });
      expect(resolved).toEqual({
        enabled: false,
        defaultConsent: 'denied'
      });
    });

    it('should return enabled config with default consent', () => {
      const resolved = resolveConsentConfig({
        enabled: true,
        default_consent: 'granted'
      });
      expect(resolved).toEqual({
        enabled: true,
        defaultConsent: 'granted'
      });
    });

    it('should use denied as default when default_consent is not specified', () => {
      const resolved = resolveConsentConfig({ enabled: true });
      expect(resolved).toEqual({
        enabled: true,
        defaultConsent: 'denied'
      });
    });
  });
});
