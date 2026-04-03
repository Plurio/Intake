import { describe, it, expect } from 'vitest';
import {
  parseConsentFromDataLayerItem,
  parseGtagCommand,
  parseCustomEvent,
  parseKnownCMPEvent,
  KNOWN_CONSENT_EVENTS
} from '@/privacy/consent-parsers';
import type { ConsentListenerConfig } from '@/types';

describe('privacy/consent-parsers', () => {
  const defaultConfig: ConsentListenerConfig = {
    enabled: true,
    default_consent: 'denied'
  };

  describe('parseGtagCommand()', () => {
    it('should parse consent update command', () => {
      const result = parseGtagCommand(['consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied'
      }]);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should parse consent default command', () => {
      const result = parseGtagCommand(['consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      }]);
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });

    it('should return null for non-consent commands', () => {
      expect(parseGtagCommand(['config', 'GA-12345'])).toBeNull();
      expect(parseGtagCommand(['event', 'page_view'])).toBeNull();
    });

    it('should return null for invalid consent data', () => {
      expect(parseGtagCommand(['consent', 'update', 'invalid'])).toBeNull();
      expect(parseGtagCommand(['consent', 'update', null])).toBeNull();
    });

    it('should return null for empty consent object', () => {
      expect(parseGtagCommand(['consent', 'update', {}])).toBeNull();
    });

    it('should handle partial consent data', () => {
      const result = parseGtagCommand(['consent', 'update', {
        analytics_storage: 'granted'
      }]);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - OneTrust', () => {
    it('should parse OneTrustGroupsUpdated event with analytics granted', () => {
      const result = parseKnownCMPEvent({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,C0002,'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should parse OneTrustGroupsUpdated with ads granted', () => {
      const result = parseKnownCMPEvent({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,C0002,C0004,'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse OneTrustGroupsUpdated with only necessary cookies', () => {
      const result = parseKnownCMPEvent({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,'
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });

    it('should detect OptanonActiveGroups even without event name', () => {
      const result = parseKnownCMPEvent({
        OptanonActiveGroups: ',C0001,C0002,C0004,'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });
  });

  describe('parseKnownCMPEvent() - Cookiebot', () => {
    it('should parse CookiebotOnAccept with full consent', () => {
      const result = parseKnownCMPEvent({
        event: 'CookiebotOnAccept',
        CookieConsent: {
          statistics: true,
          marketing: true
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse CookiebotOnDecline with no consent', () => {
      const result = parseKnownCMPEvent({
        event: 'CookiebotOnDecline',
        CookieConsent: {
          statistics: false,
          marketing: false
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });

    it('should parse CookiebotOnLoad with partial consent', () => {
      const result = parseKnownCMPEvent({
        event: 'CookiebotOnLoad',
        CookieConsent: {
          statistics: true,
          marketing: false
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Axeptio', () => {
    it('should parse consent.answer with full consent', () => {
      const result = parseKnownCMPEvent({
        event: 'consent.answer',
        privacy_consent_value: 'full'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse consent.answer with partial consent', () => {
      const result = parseKnownCMPEvent({
        event: 'consent.answer',
        privacy_consent_value: 'partial'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should parse consent.answer with refusal', () => {
      const result = parseKnownCMPEvent({
        event: 'consent.answer',
        privacy_consent_value: 'refusal'
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Sirdata', () => {
    it('should parse sirdataConsent event', () => {
      const result = parseKnownCMPEvent({
        event: 'sirdataConsent'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse sirdataNoConsent event', () => {
      const result = parseKnownCMPEvent({
        event: 'sirdataNoConsent'
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Consentmo', () => {
    it('should parse consent_status with full consent', () => {
      const result = parseKnownCMPEvent({
        event: 'consent_status',
        analytics: true,
        marketing: true
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse consent_status with no consent', () => {
      const result = parseKnownCMPEvent({
        event: 'consent_status',
        analytics: false,
        marketing: false
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Didomi', () => {
    it('should parse didomi:consent event with analytics granted', () => {
      const result = parseKnownCMPEvent({
        event: 'didomi:consent',
        purposes: {
          analytics: { enabled: true },
          advertising: { enabled: false }
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should parse Didomi.consent.changed event', () => {
      const result = parseKnownCMPEvent({
        event: 'Didomi.consent.changed',
        purposes: {
          analytics: true,
          advertising: true
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });
  });

  describe('parseKnownCMPEvent() - Termly', () => {
    it('should parse termly_consent event', () => {
      const result = parseKnownCMPEvent({
        event: 'termly_consent',
        analytics: true,
        advertising: false
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should parse termly.consent event with marketing', () => {
      const result = parseKnownCMPEvent({
        event: 'termly.consent',
        analytics: false,
        marketing: true
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'granted'
      });
    });
  });

  describe('parseKnownCMPEvent() - TrustArc', () => {
    it('should parse truste.consent.update event', () => {
      const result = parseKnownCMPEvent({
        event: 'truste.consent.update',
        consentDecision: {
          analytics: true,
          targeting: true
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse TrustArcConsentUpdate event', () => {
      const result = parseKnownCMPEvent({
        event: 'TrustArcConsentUpdate',
        consent: {
          performance: true,
          advertising: false
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Iubenda', () => {
    it('should parse iubenda_consent_given event', () => {
      const result = parseKnownCMPEvent({
        event: 'iubenda_consent_given',
        purposes: {
          measurement: true,
          marketing: true
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse iubenda_consent_rejected event', () => {
      const result = parseKnownCMPEvent({
        event: 'iubenda_consent_rejected'
      });
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Klaro', () => {
    it('should parse klaro-consent event', () => {
      const result = parseKnownCMPEvent({
        event: 'klaro-consent',
        services: {
          analytics: true,
          marketing: false
        }
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });
  });

  describe('parseKnownCMPEvent() - Generic events', () => {
    it('should parse consent_update with direct fields', () => {
      const result = parseKnownCMPEvent({
        event: 'consent_update',
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should parse consent_changed with analytics/statistics fields', () => {
      const result = parseKnownCMPEvent({
        event: 'consent_changed',
        statistics: true,
        advertising: true
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should parse direct consent fields without event name', () => {
      const result = parseKnownCMPEvent({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should return null for unknown event', () => {
      const result = parseKnownCMPEvent({
        event: 'unknown_event',
        someData: true
      });
      
      expect(result).toBeNull();
    });
  });

  describe('parseCustomEvent()', () => {
    it('should parse custom event with field mapping', () => {
      const config: ConsentListenerConfig = {
        enabled: true,
        default_consent: 'denied',
        event_names: ['my_consent_event'],
        field_mapping: {
          analytics_storage: 'myAnalytics',
          ad_storage: 'myMarketing'
        }
      };
      
      const result = parseCustomEvent({
        event: 'my_consent_event',
        myAnalytics: true,
        myMarketing: false
      }, config);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should handle string values in custom event', () => {
      const config: ConsentListenerConfig = {
        enabled: true,
        default_consent: 'denied',
        field_mapping: {
          analytics_storage: 'analyticsConsent',
          ad_storage: 'adsConsent'
        }
      };
      
      const result = parseCustomEvent({
        analyticsConsent: 'granted',
        adsConsent: 'denied'
      }, config);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should return null if no field mapping', () => {
      const config: ConsentListenerConfig = {
        enabled: true,
        default_consent: 'denied'
      };
      
      const result = parseCustomEvent({ some: 'data' }, config);
      expect(result).toBeNull();
    });
  });

  describe('parseConsentFromDataLayerItem()', () => {
    it('should handle array items (gtag commands)', () => {
      const result = parseConsentFromDataLayerItem(
        ['consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted' }],
        defaultConfig
      );
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should handle object items (CMP events)', () => {
      const result = parseConsentFromDataLayerItem({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,C0002,C0004,'
      }, defaultConfig);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should use custom parser when provided', () => {
      const config: ConsentListenerConfig = {
        enabled: true,
        default_consent: 'denied',
        custom_parser: (item) => {
          if (item.myCustomEvent) {
            return {
              analytics_storage: item.myCustomEvent.analytics ? 'granted' : 'denied',
              ad_storage: item.myCustomEvent.ads ? 'granted' : 'denied'
            };
          }
          return null;
        }
      };
      
      const result = parseConsentFromDataLayerItem({
        myCustomEvent: {
          analytics: true,
          ads: false
        }
      }, config);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'denied'
      });
    });

    it('should prioritize custom parser over built-in parsers', () => {
      const config: ConsentListenerConfig = {
        enabled: true,
        default_consent: 'denied',
        custom_parser: () => ({
          analytics_storage: 'denied',
          ad_storage: 'denied'
        })
      };
      
      // Even though this is a valid OneTrust event, custom parser takes priority
      const result = parseConsentFromDataLayerItem({
        event: 'OneTrustGroupsUpdated',
        OptanonActiveGroups: ',C0001,C0002,C0004,'
      }, config);
      
      expect(result).toEqual({
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    });

    it('should return null for null/undefined items', () => {
      expect(parseConsentFromDataLayerItem(null, defaultConfig)).toBeNull();
      expect(parseConsentFromDataLayerItem(undefined, defaultConfig)).toBeNull();
    });

    it('should return null for primitive values', () => {
      expect(parseConsentFromDataLayerItem('string', defaultConfig)).toBeNull();
      expect(parseConsentFromDataLayerItem(123, defaultConfig)).toBeNull();
      expect(parseConsentFromDataLayerItem(true, defaultConfig)).toBeNull();
    });

    it('should handle array-like objects (GTM format)', () => {
      // GTM stores gtag commands as objects with numeric string keys
      const result = parseConsentFromDataLayerItem({
        '0': 'consent',
        '1': 'update',
        '2': {
          analytics_storage: 'granted',
          ad_storage: 'granted'
        }
      }, defaultConfig);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });

    it('should handle array-like consent default command (GTM format)', () => {
      const result = parseConsentFromDataLayerItem({
        '0': 'consent',
        '1': 'default',
        '2': {
          functionality_storage: 'granted',
          security_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          analytics_storage: 'granted',
          personalization_storage: 'granted'
        }
      }, defaultConfig);
      
      expect(result).toEqual({
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    });
  });

  describe('KNOWN_CONSENT_EVENTS', () => {
    it('should include all common CMP events', () => {
      expect(KNOWN_CONSENT_EVENTS).toContain('OneTrustGroupsUpdated');
      expect(KNOWN_CONSENT_EVENTS).toContain('CookiebotOnAccept');
      expect(KNOWN_CONSENT_EVENTS).toContain('consent.answer');
      expect(KNOWN_CONSENT_EVENTS).toContain('sirdataConsent');
      expect(KNOWN_CONSENT_EVENTS).toContain('consent_status');
      expect(KNOWN_CONSENT_EVENTS).toContain('didomi:consent');
      expect(KNOWN_CONSENT_EVENTS).toContain('consent_update');
    });
  });
});

