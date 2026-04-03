import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildUserProfile, pushToDataLayer, sendToDataLayer, pushEmailToDataLayer, pushPhoneToDataLayer, sendEmailToDataLayer, sendPhoneToDataLayer } from '@/integration/data-layer';
import type { IntkData } from '@/types';

describe('data-layer integration', () => {
  let mockDataLayer: any[];
  let originalDataLayer: any;

  beforeEach(() => {
    mockDataLayer = [];
    // Save original dataLayer if exists
    originalDataLayer = (window as any).dataLayer;
    // Mock window.dataLayer
    (window as any).dataLayer = mockDataLayer;
  });

  afterEach(() => {
    // Restore original dataLayer
    if (originalDataLayer !== undefined) {
      (window as any).dataLayer = originalDataLayer;
    } else {
      delete (window as any).dataLayer;
    }
  });

  describe('buildUserProfile', () => {
    it('should build user profile with minimal data', () => {
      const data: IntkData = {
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      };

      const profile = buildUserProfile(data);

      expect(profile).toHaveProperty('traffic_attribution');
      expect(profile).toHaveProperty('identity');
      expect(profile).toHaveProperty('metadata');
      expect(profile.metadata.version).toBe('2.0.0');
      expect(profile.traffic_attribution.first_visit).toBeDefined();
      expect(profile.traffic_attribution.current_visit).toBeDefined();
      expect(profile.traffic_attribution.touchpoint_chain).toEqual([]);
    });

    it('should convert first visit data correctly', () => {
      const data: IntkData = {
        current: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: 'banner1',
          trm: 'keyword1'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: 'http://google.com'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: 'banner1',
          trm: 'keyword1'
        },
        first_add: {
          fd: '2025-01-10 14:20:00',
          ep: 'http://localhost/landing',
          rf: 'http://google.com'
        },
        session: {
          pgs: 3,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      };

      const profile = buildUserProfile(data);

      expect(profile.traffic_attribution.first_visit.type).toBe('utm');
      expect(profile.traffic_attribution.first_visit.source).toBe('google');
      expect(profile.traffic_attribution.first_visit.medium).toBe('cpc');
      expect(profile.traffic_attribution.first_visit.campaign).toBe('campaign1');
      expect(profile.traffic_attribution.first_visit.content).toBe('banner1');
      expect(profile.traffic_attribution.first_visit.term).toBe('keyword1');
      expect(profile.traffic_attribution.first_visit.landing_page).toBe('http://localhost/landing');
      expect(profile.traffic_attribution.first_visit.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO 8601 format
    });

    it('should convert current visit data correctly', () => {
      const data: IntkData = {
        current: {
          typ: 'organic',
          src: 'bing',
          mdm: 'organic',
          cmp: '(none)',
          cnt: '(none)',
          trm: 'search term'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/current',
          rf: 'http://bing.com'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-10 14:20:00',
          ep: 'http://localhost/landing',
          rf: '(none)'
        },
        session: {
          pgs: 5,
          cpg: 'http://localhost/current'
        },
        udata: {
          vst: 2,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      };

      const profile = buildUserProfile(data);

      expect(profile.traffic_attribution.current_visit.type).toBe('organic');
      expect(profile.traffic_attribution.current_visit.source).toBe('bing');
      expect(profile.traffic_attribution.current_visit.medium).toBe('organic');
      expect(profile.traffic_attribution.current_visit.session_page_views).toBe(5);
      expect(profile.traffic_attribution.current_visit.current_page).toBe('http://localhost/current');
    });

    it('should include touchpoint chain', () => {
      const data: IntkData = {
        current: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-10 14:20:00',
          ep: 'http://localhost/landing',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        touchpoints: {
          touchpoints: [
            {
              typ: 'utm',
              src: 'google',
              mdm: 'cpc',
              cmp: 'campaign1',
              cnt: '(none)',
              trm: '(none)',
              ts: 1704892800000 // timestamp in milliseconds
            },
            {
              typ: 'referral',
              src: 'partner.com',
              mdm: 'referral',
              cmp: '(none)',
              cnt: '(none)',
              trm: '(none)',
              ts: 1704979200000
            }
          ]
        }
      };

      const profile = buildUserProfile(data);

      expect(profile.traffic_attribution.touchpoint_chain).toHaveLength(2);
      expect(profile.traffic_attribution.touchpoint_chain[0].type).toBe('utm');
      expect(profile.traffic_attribution.touchpoint_chain[0].source).toBe('google');
      expect(profile.traffic_attribution.touchpoint_chain[1].type).toBe('referral');
      expect(profile.traffic_attribution.touchpoint_chain[1].source).toBe('partner.com');
      expect(profile.traffic_attribution.touchpoint_chain[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include click IDs in identity', () => {
      const data: IntkData = {
        current: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        click_ids: {
          gclid: 'gclid.123',
          fbclid: 'fbclid.456',
          msclkid: 'msclkid.789'
        }
      };

      const profile = buildUserProfile(data);

      expect(profile.identity.click_ids).toBeDefined();
      expect(profile.identity.click_ids?.google).toBe('gclid.123');
      expect(profile.identity.click_ids?.facebook).toBe('fbclid.456');
      expect(profile.identity.click_ids?.microsoft).toBe('msclkid.789');
    });

    it('should include analytics IDs in identity', () => {
      const data: IntkData = {
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        analytics_ids: {
          ga_client_id: '123456789.1663333151',
          ga_session_id: '1663333151',
          amplitude_id: '987654321'
        }
      };

      const profile = buildUserProfile(data);

      expect(profile.identity.analytics_ids).toBeDefined();
      expect(profile.identity.analytics_ids?.google_analytics_client).toBe('123456789.1663333151');
      expect(profile.identity.analytics_ids?.google_analytics_session).toBe('1663333151');
      expect(profile.identity.analytics_ids?.amplitude_client).toBe('987654321');
    });

    it('should include PII hashes in identity', () => {
      const data: IntkData = {
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        pii_hashes: {
          email_hash: 'abc123def456',
          phone_hash: '789ghi012jkl'
        }
      };

      const profile = buildUserProfile(data);

      expect(profile.identity.pii_hashes).toBeDefined();
      expect(profile.identity.pii_hashes?.email_sha256).toBe('abc123def456');
      expect(profile.identity.pii_hashes?.phone_sha256).toBe('789ghi012jkl');
    });

    it('should handle empty identity fields gracefully', () => {
      const data: IntkData = {
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      };

      const profile = buildUserProfile(data);

      expect(profile.identity).toBeDefined();
      // Empty identity should not have undefined fields
      expect(profile.identity.pii_hashes).toBeUndefined();
      expect(profile.identity.click_ids).toBeUndefined();
      expect(profile.identity.analytics_ids).toBeUndefined();
    });

    it('should use custom version', () => {
      const data: IntkData = {
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      };

      const profile = buildUserProfile(data, '1.5.0');
      expect(profile.metadata.version).toBe('1.5.0');
    });
  });

  describe('pushToDataLayer', () => {
    it('should push event to dataLayer', () => {
      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      });

      pushToDataLayer(profile);

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toHaveProperty('event', 'intk_ready');
      expect(mockDataLayer[0]).toHaveProperty('intk_user_profile');
      expect(mockDataLayer[0].intk_user_profile).toEqual(profile);
    });

    it('should initialize dataLayer if it does not exist', () => {
      // Remove dataLayer
      delete (window as any).dataLayer;

      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      });

      pushToDataLayer(profile);

      expect((window as any).dataLayer).toBeDefined();
      expect((window as any).dataLayer).toHaveLength(1);
    });

    it('should not fail if window is undefined', () => {
      // This test is mainly for SSR scenarios, but in jsdom window always exists
      // We'll test that the function handles missing dataLayer gracefully
      const originalDataLayer = (window as any).dataLayer;
      delete (window as any).dataLayer;

      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      });

      // Should initialize dataLayer
      expect(() => pushToDataLayer(profile)).not.toThrow();
      expect((window as any).dataLayer).toBeDefined();

      // Restore dataLayer
      (window as any).dataLayer = originalDataLayer;
    });
  });

  describe('sendToDataLayer', () => {
    it('should build profile and push to dataLayer', () => {
      const data: IntkData = {
        current: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      };

      sendToDataLayer(data);

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0].event).toBe('intk_ready');
      expect(mockDataLayer[0].intk_user_profile.traffic_attribution.first_visit.source).toBe('google');
    });
  });

  describe('pushEmailToDataLayer', () => {
    it('should push intk_email event to dataLayer', () => {
      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        pii_hashes: {
          email_hash: 'abc123def456'
        }
      });

      pushEmailToDataLayer(profile);

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toHaveProperty('event', 'intk_email');
      expect(mockDataLayer[0]).toHaveProperty('intk_user_profile');
      expect(mockDataLayer[0].intk_user_profile).toEqual(profile);
    });

    it('should initialize dataLayer if it does not exist', () => {
      delete (window as any).dataLayer;

      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      });

      pushEmailToDataLayer(profile);

      expect((window as any).dataLayer).toBeDefined();
      expect((window as any).dataLayer).toHaveLength(1);
      expect((window as any).dataLayer[0].event).toBe('intk_email');
    });
  });

  describe('pushPhoneToDataLayer', () => {
    it('should push intk_phone event to dataLayer', () => {
      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        pii_hashes: {
          phone_hash: '789ghi012jkl'
        }
      });

      pushPhoneToDataLayer(profile);

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0]).toHaveProperty('event', 'intk_phone');
      expect(mockDataLayer[0]).toHaveProperty('intk_user_profile');
      expect(mockDataLayer[0].intk_user_profile).toEqual(profile);
    });

    it('should initialize dataLayer if it does not exist', () => {
      delete (window as any).dataLayer;

      const profile = buildUserProfile({
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {}
      });

      pushPhoneToDataLayer(profile);

      expect((window as any).dataLayer).toBeDefined();
      expect((window as any).dataLayer).toHaveLength(1);
      expect((window as any).dataLayer[0].event).toBe('intk_phone');
    });
  });

  describe('sendEmailToDataLayer', () => {
    it('should build profile and push intk_email event to dataLayer', () => {
      const data: IntkData = {
        current: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        pii_hashes: {
          email_hash: 'abc123def456'
        }
      };

      sendEmailToDataLayer(data);

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0].event).toBe('intk_email');
      expect(mockDataLayer[0].intk_user_profile.identity.pii_hashes.email_sha256).toBe('abc123def456');
    });
  });

  describe('sendPhoneToDataLayer', () => {
    it('should build profile and push intk_phone event to dataLayer', () => {
      const data: IntkData = {
        current: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        pii_hashes: {
          phone_hash: '789ghi012jkl'
        }
      };

      sendPhoneToDataLayer(data);

      expect(mockDataLayer).toHaveLength(1);
      expect(mockDataLayer[0].event).toBe('intk_phone');
      expect(mockDataLayer[0].intk_user_profile.identity.pii_hashes.phone_sha256).toBe('789ghi012jkl');
    });
  });

  describe('PII events integration', () => {
    it('should push different event types correctly', () => {
      const data: IntkData = {
        current: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        current_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        first: {
          typ: 'typein',
          src: '(none)',
          mdm: '(none)',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)'
        },
        first_add: {
          fd: '2025-01-15 10:30:00',
          ep: 'http://localhost/test',
          rf: '(none)'
        },
        session: {
          pgs: 1,
          cpg: 'http://localhost/test'
        },
        udata: {
          vst: 1,
          uip: '(none)',
          uag: 'test-agent'
        },
        promo: {},
        pii_hashes: {
          email_hash: 'abc123def456',
          phone_hash: '789ghi012jkl'
        }
      };

      // Simulate 'both' change type - fire email then phone
      sendEmailToDataLayer(data);
      sendPhoneToDataLayer(data);

      expect(mockDataLayer).toHaveLength(2);
      expect(mockDataLayer[0].event).toBe('intk_email');
      expect(mockDataLayer[1].event).toBe('intk_phone');
      
      // Both should have the same profile data
      expect(mockDataLayer[0].intk_user_profile.identity.pii_hashes.email_sha256).toBe('abc123def456');
      expect(mockDataLayer[0].intk_user_profile.identity.pii_hashes.phone_sha256).toBe('789ghi012jkl');
      expect(mockDataLayer[1].intk_user_profile.identity.pii_hashes.email_sha256).toBe('abc123def456');
      expect(mockDataLayer[1].intk_user_profile.identity.pii_hashes.phone_sha256).toBe('789ghi012jkl');
    });
  });
});

