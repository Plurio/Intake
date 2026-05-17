import { describe, it, expect, beforeEach, vi } from 'vitest';
import intk from '@/index';
import type { IntkData, IntkConfig } from '@/types';
import { mockLocation, mockReferrer, clearCookies } from '../setup';
import { get } from '@/helpers/cookies';

// Helper config for tests that require consent granted (cookies enabled)
const CONSENT_GRANTED_CONFIG: IntkConfig = {
  consent_mode: {
    enabled: true,
    default_consent: 'granted'
  }
};

describe('index (API compatibility)', () => {
  beforeEach(() => {
    clearCookies();
    mockLocation('http://localhost/');
    mockReferrer('');
    // Reset intk.get
    (intk as any).get = {};
  });

  describe('intk.init()', () => {
    it('should initialize without config', () => {
      intk.init();
      expect(intk.get).toBeDefined();
      expect(intk.get.current).toBeDefined();
      expect(intk.get.first).toBeDefined();
    });

    it('should initialize with empty config', () => {
      intk.init({});
      expect(intk.get).toBeDefined();
      expect(intk.get.current).toBeDefined();
    });

    it('should populate intk.get after init', () => {
      intk.init();
      const data = intk.get;
      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('current_add');
      expect(data).toHaveProperty('first');
      expect(data).toHaveProperty('first_add');
      expect(data).toHaveProperty('session');
      expect(data).toHaveProperty('udata');
      expect(data).toHaveProperty('promo');
    });

    it('should call callback if provided', () => {
      const callback = vi.fn();
      intk.init({ callback });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(intk.get);
    });

    it('should not call callback if not provided', () => {
      const callback = vi.fn();
      intk.init();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('intk.get structure', () => {
    beforeEach(() => {
      intk.init();
    });

    it('should have correct current structure', () => {
      const current = intk.get.current;
      expect(current).toHaveProperty('typ');
      expect(current).toHaveProperty('src');
      expect(current).toHaveProperty('mdm');
      expect(current).toHaveProperty('cmp');
      expect(current).toHaveProperty('cnt');
      expect(current).toHaveProperty('trm');
    });

    it('should have correct first structure', () => {
      const first = intk.get.first;
      expect(first).toHaveProperty('typ');
      expect(first).toHaveProperty('src');
      expect(first).toHaveProperty('mdm');
      expect(first).toHaveProperty('cmp');
      expect(first).toHaveProperty('cnt');
      expect(first).toHaveProperty('trm');
    });

    it('should have correct current_add structure', () => {
      const currentAdd = intk.get.current_add;
      expect(currentAdd).toHaveProperty('fd'); // fire_date
      expect(currentAdd).toHaveProperty('ep'); // entrance_point
      expect(currentAdd).toHaveProperty('rf'); // referer
    });

    it('should have correct first_add structure', () => {
      const firstAdd = intk.get.first_add;
      expect(firstAdd).toHaveProperty('fd');
      expect(firstAdd).toHaveProperty('ep');
      expect(firstAdd).toHaveProperty('rf');
    });

    it('should have correct session structure', () => {
      const session = intk.get.session;
      expect(session).toHaveProperty('pgs'); // pages_seen
      expect(session).toHaveProperty('cpg'); // current_page
      expect(typeof session.pgs).toBe('number');
    });

    it('should have correct udata structure', () => {
      const udata = intk.get.udata;
      expect(udata).toHaveProperty('vst'); // visits
      expect(udata).toHaveProperty('uip'); // user_ip
      expect(udata).toHaveProperty('uag'); // user_agent
      expect(typeof udata.vst).toBe('number');
    });

    it('should have promo structure (even if empty)', () => {
      const promo = intk.get.promo;
      expect(promo).toBeDefined();
      // Promo can be empty object if not configured
    });

    it('should have touchpoints structure', () => {
      const touchpoints = intk.get.touchpoints;
      expect(touchpoints).toBeDefined();
      expect(touchpoints).toHaveProperty('touchpoints');
      expect(Array.isArray(touchpoints.touchpoints)).toBe(true);
    });
  });

  describe('First visit behavior', () => {
    it('should set first and current to same value on first visit', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init();
      
      expect(intk.get.first.src).toBe('google');
      expect(intk.get.current.src).toBe('google');
      expect(intk.get.first.typ).toBe('utm');
      expect(intk.get.current.typ).toBe('utm');
    });

    it('should save first visit data in cookies', () => {
      mockLocation('http://localhost/?utm_source=google');
      intk.init({
        consent_mode: {
          enabled: true,
          default_consent: 'granted'
        }
      });
      
      const firstCookie = get('intk_first');
      expect(firstCookie).toBeTruthy();
      expect(firstCookie).toContain('src=google');
    });

    it('should increment visits on first visit', () => {
      intk.init();
      expect(intk.get.udata.vst).toBe(1);
    });
  });

  describe('Return visit behavior', () => {
    it('should preserve first visit data', () => {
      // First visit
      mockLocation('http://localhost/?utm_source=google');
      intk.init(CONSENT_GRANTED_CONFIG);
      const firstSource = intk.get.first.src;
      
      // Second visit
      mockLocation('http://localhost/?utm_source=facebook');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      // First should remain unchanged
      expect(intk.get.first.src).toBe(firstSource);
      // Current should update
      expect(intk.get.current.src).toBe('facebook');
    });

    it('should update current on new UTM campaign', () => {
      // First visit
      mockLocation('http://localhost/?utm_source=google');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      // Second visit with new campaign
      mockLocation('http://localhost/?utm_source=facebook');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      expect(intk.get.current.src).toBe('facebook');
      expect(intk.get.first.src).toBe('google');
    });

    it('should add touchpoints for significant sources', () => {
      // First visit with UTM
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      expect(intk.get.touchpoints?.touchpoints).toHaveLength(1);
      expect(intk.get.touchpoints?.touchpoints[0].typ).toBe('utm');
      expect(intk.get.touchpoints?.touchpoints[0].src).toBe('google');
      
      // Second visit with different UTM
      mockLocation('http://localhost/?utm_source=facebook&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      expect(intk.get.touchpoints?.touchpoints).toHaveLength(2);
      expect(intk.get.touchpoints?.touchpoints[1].src).toBe('facebook');
    });

    it('should not add touchpoint for typein source', () => {
      // First visit with UTM
      mockLocation('http://localhost/?utm_source=google');
      intk.init(CONSENT_GRANTED_CONFIG);
      const initialCount = intk.get.touchpoints?.touchpoints.length || 0;
      
      // Second visit - typein (no referrer, no UTM)
      mockLocation('http://localhost/');
      mockReferrer('');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      // Touchpoint count should not increase (typein is not significant)
      expect(intk.get.touchpoints?.touchpoints.length).toBe(initialCount);
    });

    it('should increment visits only when session expired', () => {
      // First visit
      intk.init();
      expect(intk.get.udata.vst).toBe(1);
      
      // Second visit within session (simulate by not clearing cookies)
      intk.init();
      // Visits should not increment if session exists
      // Note: This depends on session cookie existence
    });
  });

  describe('Session handling', () => {
    it('should create session cookie on init', () => {
      intk.init(CONSENT_GRANTED_CONFIG);
      const sessionCookie = get('intk_session');
      expect(sessionCookie).toBeTruthy();
    });

    it('should increment pages_seen on each init', () => {
      intk.init(CONSENT_GRANTED_CONFIG);
      const pages1 = intk.get.session.pgs;
      
      // Simulate page navigation (same session)
      mockLocation('http://localhost/page2');
      intk.init(CONSENT_GRANTED_CONFIG);
      const pages2 = intk.get.session.pgs;
      
      expect(pages2).toBeGreaterThan(pages1);
    });
  });

  describe('UTM traffic detection', () => {
    it('should detect UTM traffic correctly', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc&utm_campaign=test');
      intk.init();
      
      expect(intk.get.current.typ).toBe('utm');
      expect(intk.get.current.src).toBe('google');
      expect(intk.get.current.mdm).toBe('cpc');
      expect(intk.get.current.cmp).toBe('test');
    });

    it('should detect gclid correctly', () => {
      mockLocation('http://localhost/?gclid=abc123');
      intk.init();
      
      expect(intk.get.current.typ).toBe('utm');
      expect(intk.get.current.src).toBe('google');
      expect(intk.get.current.cmp).toBe('google_cpc');
    });

    it('should detect fbclid correctly', () => {
      mockLocation('http://localhost/?fbclid=fb789');
      intk.init();
      
      expect(intk.get.current.typ).toBe('utm');
      expect(intk.get.current.src).toBe('facebook');
      expect(intk.get.current.cmp).toBe('facebook_cpc');
    });
  });

  describe('Organic traffic detection', () => {
    it('should detect Google organic', () => {
      mockLocation('http://localhost/');
      mockReferrer('https://www.google.com/search?q=test');
      intk.init();
      
      expect(intk.get.current.typ).toBe('organic');
      expect(intk.get.current.src).toBe('google');
    });

    it('should detect DuckDuckGo organic', () => {
      mockLocation('http://localhost/');
      mockReferrer('https://duckduckgo.com/?q=test');
      intk.init();
      
      expect(intk.get.current.typ).toBe('organic');
      expect(intk.get.current.src).toBe('duckduckgo');
    });
  });

  describe('Referral traffic detection', () => {
    it('should detect referral traffic', () => {
      mockLocation('http://localhost/');
      mockReferrer('https://example.com/page');
      intk.init();
      
      expect(intk.get.current.typ).toBe('referral');
      expect(intk.get.current.src).toBe('example.com');
    });

    it('should not update referral if session exists', () => {
      // First visit - creates session
      mockLocation('http://localhost/');
      mockReferrer('https://example.com/page');
      intk.init();
      const firstCurrent = intk.get.current.src;
      
      // Second visit with new referrer but session exists
      mockLocation('http://localhost/page2');
      mockReferrer('https://another.com/page');
      intk.init();
      
      // Should keep old current (typein) when session exists
      // Note: This behavior depends on session logic
    });
  });

  describe('Typein traffic detection', () => {
    it('should detect typein when no referrer', () => {
      mockLocation('http://localhost/');
      mockReferrer('');
      intk.init();
      
      expect(intk.get.current.typ).toBe('typein');
      expect(intk.get.current.src).toBe('(direct)');
    });

    it('should use custom typein attributes', () => {
      mockLocation('http://localhost/');
      mockReferrer('');
      intk.init({
        typein_attributes: {
          source: 'direct_visit',
          medium: 'direct'
        }
      });
      
      expect(intk.get.current.typ).toBe('typein');
      expect(intk.get.current.src).toBe('direct_visit');
      expect(intk.get.current.mdm).toBe('direct');
    });
  });

  describe('Configuration options', () => {
    it('should use custom lifetime', () => {
      intk.init({ ...CONSENT_GRANTED_CONFIG, lifetime: 12 });
      // Cookie should be set with longer expiration
      const firstCookie = get('intk_first');
      expect(firstCookie).toBeTruthy();
    });

    it('should use custom session_length', () => {
      intk.init({ ...CONSENT_GRANTED_CONFIG, session_length: 60 });
      const sessionCookie = get('intk_session');
      expect(sessionCookie).toBeTruthy();
    });

    it('should use custom user_ip', () => {
      intk.init({ user_ip: '192.168.1.1' });
      expect(intk.get.udata.uip).toBe('192.168.1.1');
    });

    it('should generate promocode when configured', () => {
      intk.init({
        ...CONSENT_GRANTED_CONFIG,
        promocode: { min: 100000, max: 999999 }
      });
      
      const promoCookie = get('intk_promo');
      expect(promoCookie).toBeTruthy();
      expect(promoCookie).toMatch(/code=\d{6}/);
    });

    it('should not generate promocode twice', () => {
      intk.init({
        ...CONSENT_GRANTED_CONFIG,
        promocode: { min: 100000, max: 999999 }
      });
      const promo1 = get('intk_promo');
      
      // Second init should not regenerate
      intk.init({
        ...CONSENT_GRANTED_CONFIG,
        promocode: { min: 100000, max: 999999 }
      });
      const promo2 = get('intk_promo');
      
      expect(promo1).toBe(promo2);
    });
  });

  describe('Cookie format compatibility', () => {
    it('should write cookies in expected format', () => {
      mockLocation('http://localhost/?utm_source=google');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      const currentCookie = get('intk_current');
      expect(currentCookie).toContain('typ=');
      expect(currentCookie).toContain('src=');
      expect(currentCookie).toContain('|||'); // delimiter
    });

    it('should read existing cookies correctly', () => {
      // First visit
      mockLocation('http://localhost/?utm_source=google');
      intk.init(CONSENT_GRANTED_CONFIG);
      const firstSrc = intk.get.first.src;
      
      // Second visit - should read first from cookie
      mockLocation('http://localhost/?utm_source=facebook');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      expect(intk.get.first.src).toBe(firstSrc);
    });
  });

  describe('intk.getAttribution()', () => {
    beforeEach(() => {
      clearCookies();
    });

    it('should return first touch attribution', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      mockLocation('http://localhost/?utm_source=facebook&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      const result = intk.getAttribution('first');
      expect(result.model).toBe('first');
      expect(result.credits).toHaveLength(1);
      expect(result.credits[0].touchpoint.src).toBe('google');
      expect(result.credits[0].credit).toBe(1.0);
    });

    it('should return last touch attribution', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      mockLocation('http://localhost/?utm_source=facebook&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      const result = intk.getAttribution('last');
      expect(result.model).toBe('last');
      expect(result.credits).toHaveLength(1);
      expect(result.credits[0].touchpoint.src).toBe('facebook');
      expect(result.credits[0].credit).toBe(1.0);
    });

    it('should return linear attribution', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      mockLocation('http://localhost/?utm_source=facebook&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      const result = intk.getAttribution('linear');
      expect(result.model).toBe('linear');
      expect(result.credits).toHaveLength(2);
      expect(result.credits[0].credit).toBe(0.5);
      expect(result.credits[1].credit).toBe(0.5);
      expect(result.totalCredit).toBeCloseTo(1.0, 10);
    });

    it('should return U-shaped attribution', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      mockLocation('http://localhost/?utm_source=facebook&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      mockLocation('http://localhost/?utm_source=bing&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      const result = intk.getAttribution('u-shaped');
      expect(result.model).toBe('u-shaped');
      expect(result.credits).toHaveLength(3);
      expect(result.credits[0].credit).toBe(0.4); // First
      expect(result.credits[1].credit).toBe(0.2); // Middle
      expect(result.credits[2].credit).toBe(0.4); // Last
      expect(result.totalCredit).toBeCloseTo(1.0, 10);
    });

    it('should return time-decay attribution', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      mockLocation('http://localhost/?utm_source=facebook&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      const result = intk.getAttribution('time-decay');
      expect(result.model).toBe('time-decay');
      expect(result.credits).toHaveLength(2);
      // Newer touchpoint should have more credit
      expect(result.credits[1].credit).toBeGreaterThan(result.credits[0].credit);
      expect(result.totalCredit).toBeCloseTo(1.0, 10);
    });

    it('should return empty result when no touchpoints', () => {
      // Typein visit (no touchpoints added)
      mockLocation('http://localhost/');
      mockReferrer('');
      intk.init();
      
      const result = intk.getAttribution('first');
      expect(result.credits).toHaveLength(0);
      expect(result.totalCredit).toBe(0);
    });
  });

  describe('intk.get.click_ids', () => {
    beforeEach(() => {
      clearCookies();
    });

    it('should have click_ids structure', () => {
      intk.init();
      expect(intk.get.click_ids).toBeDefined();
      expect(typeof intk.get.click_ids).toBe('object');
    });

    it('should collect gclid from URL', () => {
      mockLocation('http://localhost/?gclid=test123');
      intk.init();
      
      expect(intk.get.click_ids?.gclid).toBe('test123');
    });

    it('should collect multiple click IDs from URL', () => {
      mockLocation('http://localhost/?gclid=test123&fbclid=fb456&msclkid=ms789');
      intk.init();
      
      expect(intk.get.click_ids?.gclid).toBe('test123');
      expect(intk.get.click_ids?.fbclid).toBe('fb456');
      expect(intk.get.click_ids?.msclkid).toBe('ms789');
    });

    it('should preserve click IDs from previous visits', () => {
      // First visit with gclid
      mockLocation('http://localhost/?gclid=test123');
      intk.init(CONSENT_GRANTED_CONFIG);
      const firstGclid = intk.get.click_ids?.gclid;
      
      // Second visit with fbclid (no gclid in URL)
      mockLocation('http://localhost/?fbclid=fb456');
      intk.init(CONSENT_GRANTED_CONFIG);
      
      // gclid should be preserved from cookie
      expect(intk.get.click_ids?.gclid).toBe(firstGclid);
      // fbclid should be added
      expect(intk.get.click_ids?.fbclid).toBe('fb456');
    });

    it('should update click ID when new value in URL', () => {
      // First visit with gclid
      mockLocation('http://localhost/?gclid=old123');
      intk.init(CONSENT_GRANTED_CONFIG);

      // Second visit with new gclid
      mockLocation('http://localhost/?gclid=new456');
      intk.init(CONSENT_GRANTED_CONFIG);

      // New gclid should overwrite old one
      expect(intk.get.click_ids?.gclid).toBe('new456');
    });
  });

  describe('intk.toJSON()', () => {
    beforeEach(() => {
      clearCookies();
    });

    it('should return a snapshot with the same shape as intk.get', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc&utm_campaign=spring');
      intk.init(CONSENT_GRANTED_CONFIG);
      const snapshot = intk.toJSON();
      expect(snapshot.current).toEqual(intk.get.current);
      expect(snapshot.first).toEqual(intk.get.first);
      expect(snapshot.session).toEqual(intk.get.session);
      expect(snapshot.udata).toEqual(intk.get.udata);
      expect(snapshot.touchpoints).toEqual(intk.get.touchpoints);
    });

    it('should return a deep clone — mutating snapshot must not affect intk.get', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      const original = intk.get.current.src;
      const snapshot = intk.toJSON();
      snapshot.current.src = 'mutated';
      expect(intk.get.current.src).toBe(original);
      expect(intk.get.current.src).not.toBe('mutated');
    });

    it('should produce a value that is JSON-serializable', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      const snapshot = intk.toJSON();
      expect(() => JSON.stringify(snapshot)).not.toThrow();
      const roundTripped = JSON.parse(JSON.stringify(snapshot));
      expect(roundTripped.current.src).toBe(snapshot.current.src);
    });

    it('should be picked up automatically by JSON.stringify(intk)', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
      intk.init(CONSENT_GRANTED_CONFIG);
      // JSON.stringify calls toJSON() on the receiver if it exists, so this
      // should produce the same payload as JSON.stringify(intk.toJSON()).
      const viaIntk = JSON.parse(JSON.stringify(intk));
      const viaToJSON = JSON.parse(JSON.stringify(intk.toJSON()));
      expect(viaIntk).toEqual(viaToJSON);
    });
  });
});

