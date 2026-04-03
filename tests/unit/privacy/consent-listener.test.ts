import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDataLayerInterceptor,
  readConsentFromDataLayer,
  pushConsentToDataLayer
} from '@/privacy/consent-listener';
import type { ConsentListenerConfig, ConsentStatus } from '@/types';

describe('privacy/consent-listener', () => {
  const defaultConfig: ConsentListenerConfig = {
    enabled: true,
    default_consent: 'denied'
  };

  beforeEach(() => {
    // Reset dataLayer before each test
    (window as any).dataLayer = [];
  });

  describe('createDataLayerInterceptor()', () => {
    it('should intercept dataLayer.push() calls', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Push a consent event
      window.dataLayer!.push({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      expect(onConsentChange).toHaveBeenCalledWith({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });

    it('should intercept gtag consent commands', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Push gtag consent command
      window.dataLayer!.push(['consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied'
      }]);
      
      expect(onConsentChange).toHaveBeenCalledWith({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
      
      cleanup();
    });

    it('should process existing dataLayer items on init', () => {
      // Pre-populate dataLayer with consent event
      (window as any).dataLayer = [{
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,C0002,C0004,'
      }];
      
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Should have been called with the existing consent
      expect(onConsentChange).toHaveBeenCalledWith({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });

    it('should not call callback for non-consent events', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Push non-consent events
      window.dataLayer!.push({ event: 'page_view' });
      window.dataLayer!.push({ event: 'click', element: 'button' });
      window.dataLayer!.push(['config', 'GA-12345']);
      
      expect(onConsentChange).not.toHaveBeenCalled();
      
      cleanup();
    });

    it('should not call callback for duplicate consent status', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Push same consent event multiple times
      window.dataLayer!.push({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      window.dataLayer!.push({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      // Should only be called once (second is duplicate)
      expect(onConsentChange).toHaveBeenCalledTimes(1);
      
      cleanup();
    });

    it('should call callback when consent status changes', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // First consent event
      window.dataLayer!.push({
        event: 'consent_update',
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
      
      // Second consent event with different status
      window.dataLayer!.push({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      expect(onConsentChange).toHaveBeenCalledTimes(2);
      expect(onConsentChange).toHaveBeenNthCalledWith(1, {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
      expect(onConsentChange).toHaveBeenNthCalledWith(2, {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });

    it('should use custom parser when provided', () => {
      const onConsentChange = vi.fn();
      const config: ConsentListenerConfig = {
        enabled: true,
        default_consent: 'denied',
        custom_parser: (item) => {
          if (item.myConsentEvent) {
            return {
              analytics_storage: item.myConsentEvent.stats ? 'granted' : 'denied',
              ad_storage: item.myConsentEvent.ads ? 'granted' : 'denied'
            };
          }
          return null;
        }
      };
      
      const cleanup = createDataLayerInterceptor(onConsentChange, config);
      
      window.dataLayer!.push({
        myConsentEvent: {
          stats: true,
          ads: false
        }
      });
      
      expect(onConsentChange).toHaveBeenCalledWith({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
      
      cleanup();
    });

    it('should restore original push after cleanup', () => {
      const originalPush = window.dataLayer!.push;
      const onConsentChange = vi.fn();
      
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Verify push was intercepted (different reference)
      expect(window.dataLayer!.push).not.toBe(originalPush);
      
      cleanup();
      
      // After cleanup, should work normally (won't call callback)
      window.dataLayer!.push({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      // The callback was already called once during setup from existing items check
      // After cleanup, the new push should not trigger the callback
      expect(onConsentChange).toHaveBeenCalledTimes(0);
    });

    it('should handle multiple items in single push call', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      // Push multiple items at once (some CMPs do this)
      window.dataLayer!.push(
        { event: 'page_view' },
        { event: 'consent_update', analytics_storage: 'granted', ad_storage: 'granted' }
      );
      
      expect(onConsentChange).toHaveBeenCalledTimes(1);
      expect(onConsentChange).toHaveBeenCalledWith({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });

    it('should return no-op cleanup in non-browser environment', () => {
      const originalWindow = global.window;
      // @ts-ignore - simulate SSR
      delete global.window;
      
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      expect(typeof cleanup).toBe('function');
      // Should not throw when called
      expect(() => cleanup()).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('readConsentFromDataLayer()', () => {
    it('should return null for empty dataLayer', () => {
      (window as any).dataLayer = [];
      
      const result = readConsentFromDataLayer(defaultConfig);
      expect(result).toBeNull();
    });

    it('should return null if no consent events found', () => {
      (window as any).dataLayer = [
        { event: 'page_view' },
        { event: 'click' }
      ];
      
      const result = readConsentFromDataLayer(defaultConfig);
      expect(result).toBeNull();
    });

    it('should return consent from dataLayer', () => {
      (window as any).dataLayer = [
        { event: 'page_view' },
        { event: 'OneTrustGroupsUpdated', OptanonActiveGroups: ',C0001,C0002,' }
      ];
      
      const result = readConsentFromDataLayer(defaultConfig);
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should return latest consent if multiple events', () => {
      (window as any).dataLayer = [
        { event: 'consent_update', analytics_storage: 'denied', ad_storage: 'denied' },
        { event: 'consent_update', analytics_storage: 'granted', ad_storage: 'granted' }
      ];
      
      const result = readConsentFromDataLayer(defaultConfig);
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should return null if dataLayer does not exist', () => {
      delete (window as any).dataLayer;
      
      const result = readConsentFromDataLayer(defaultConfig);
      expect(result).toBeNull();
    });
  });

  describe('pushConsentToDataLayer()', () => {
    it('should push consent event to dataLayer', () => {
      (window as any).dataLayer = [];
      
      const consent: ConsentStatus = {
        analytics_storage: 'granted',
        ad_storage: 'denied'
      };
      
      pushConsentToDataLayer(consent);
      
      expect(window.dataLayer).toHaveLength(1);
      expect(window.dataLayer![0]).toEqual({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should create dataLayer if it does not exist', () => {
      delete (window as any).dataLayer;
      
      pushConsentToDataLayer({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      expect(window.dataLayer).toBeDefined();
      expect(window.dataLayer).toHaveLength(1);
    });

    it('should trigger interceptor callback when pushed', () => {
      const onConsentChange = vi.fn();
      const cleanup = createDataLayerInterceptor(onConsentChange, defaultConfig);
      
      pushConsentToDataLayer({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      expect(onConsentChange).toHaveBeenCalledWith({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });
  });

  describe('integration scenarios', () => {
    it('should handle OneTrust typical flow', () => {
      const consentChanges: ConsentStatus[] = [];
      const cleanup = createDataLayerInterceptor(
        (consent) => consentChanges.push(consent),
        defaultConfig
      );
      
      // Initial page load - OneTrust loads
      window.dataLayer!.push({ event: 'OptanonWrapper' });
      
      // User hasn't interacted yet - no consent event
      expect(consentChanges).toHaveLength(0);
      
      // User accepts all cookies
      window.dataLayer!.push({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,C0002,C0003,C0004,'
      });
      
      expect(consentChanges).toHaveLength(1);
      expect(consentChanges[0]).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      // User changes preferences later
      window.dataLayer!.push({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,'
      });
      
      expect(consentChanges).toHaveLength(2);
      expect(consentChanges[1]).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
      
      cleanup();
    });

    it('should handle Cookiebot typical flow', () => {
      const consentChanges: ConsentStatus[] = [];
      const cleanup = createDataLayerInterceptor(
        (consent) => consentChanges.push(consent),
        defaultConfig
      );
      
      // User accepts cookies
      window.dataLayer!.push({
        event: 'CookiebotOnAccept',
        CookieConsent: {
          necessary: true,
          statistics: true,
          marketing: true,
          preferences: true
        }
      });
      
      expect(consentChanges).toHaveLength(1);
      expect(consentChanges[0]).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });

    it('should handle GTM Consent Mode with gtag', () => {
      const consentChanges: ConsentStatus[] = [];
      const cleanup = createDataLayerInterceptor(
        (consent) => consentChanges.push(consent),
        defaultConfig
      );
      
      // Default consent set by GTM
      window.dataLayer!.push(['consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      }]);
      
      expect(consentChanges).toHaveLength(1);
      expect(consentChanges[0]).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
      
      // User grants consent
      window.dataLayer!.push(['consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      }]);
      
      expect(consentChanges).toHaveLength(2);
      expect(consentChanges[1]).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      cleanup();
    });
  });
});

