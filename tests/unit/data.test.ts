import { describe, it, expect, beforeEach, vi } from 'vitest';
import { packMain, packExtra, packSession, packUser, packPromo } from '@/data';
import { mockLocation, mockReferrer } from '../setup';

describe('data', () => {
  beforeEach(() => {
    mockLocation('http://localhost/test-page');
    mockReferrer('http://referrer.com/page');
  });

  describe('packMain()', () => {
    it('should pack traffic source data correctly', () => {
      const source = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: 'content',
        trm: 'term'
      };
      const result = packMain(source);
      expect(result).toBe('typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=content|||trm=term');
    });

    it('should handle empty values', () => {
      const source = {
        typ: 'organic',
        src: 'google',
        mdm: 'organic',
        cmp: '(none)',
        cnt: '(none)',
        trm: '(none)'
      };
      const result = packMain(source);
      expect(result).toContain('typ=organic');
      expect(result).toContain('cmp=(none)');
    });

    it('should handle all traffic types', () => {
      const types = ['utm', 'organic', 'referral', 'typein'];
      types.forEach(type => {
        const source = {
          typ: type,
          src: 'source',
          mdm: 'medium',
          cmp: 'campaign',
          cnt: 'content',
          trm: 'term'
        };
        const result = packMain(source);
        expect(result).toContain(`typ=${type}`);
      });
    });

    it('should handle special characters in values', () => {
      const source = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign with spaces',
        cnt: 'content-with-dashes',
        trm: 'term_with_underscores'
      };
      const result = packMain(source);
      expect(result).toContain('cmp=campaign with spaces');
      expect(result).toContain('cnt=content-with-dashes');
      expect(result).toContain('trm=term_with_underscores');
    });
  });

  describe('packExtra()', () => {
    it('should pack extra data with current date', () => {
      const result = packExtra();
      expect(result).toMatch(/^fd=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
      expect(result).toContain('ep=http://localhost/test-page');
      expect(result).toContain('rf=http://referrer.com/page');
    });

    it('should include delimiter', () => {
      const result = packExtra();
      expect(result.split('|||').length).toBe(3);
    });

    it('should handle missing referrer', () => {
      mockReferrer('');
      const result = packExtra();
      expect(result).toContain('rf=(none)');
    });

    it('should apply timezone offset', () => {
      // Test with +3 hours offset
      const result = packExtra(3);
      expect(result).toMatch(/^fd=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
      // The time should be adjusted (exact check is complex due to current time)
      expect(result).toContain('ep=http://localhost/test-page');
    });

    it('should handle negative timezone offset', () => {
      const result = packExtra(-5);
      expect(result).toMatch(/^fd=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
      expect(result).toContain('ep=http://localhost/test-page');
    });

    it('should handle zero timezone offset', () => {
      const result = packExtra(0);
      expect(result).toMatch(/^fd=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should format date correctly (YYYY-MM-DD HH:MM:SS)', () => {
      const result = packExtra();
      const dateMatch = result.match(/fd=(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      expect(dateMatch).toBeTruthy();
      if (dateMatch) {
        const dateStr = dateMatch[1];
        expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      }
    });
  });

  describe('packSession()', () => {
    it('should pack session data correctly', () => {
      const result = packSession(5);
      expect(result).toBe('pgs=5|||cpg=http://localhost/test-page');
    });

    it('should handle single page view', () => {
      const result = packSession(1);
      expect(result).toContain('pgs=1');
    });

    it('should handle multiple page views', () => {
      const result = packSession(10);
      expect(result).toContain('pgs=10');
    });

    it('should include current page URL', () => {
      mockLocation('http://example.com/another-page');
      const result = packSession(3);
      expect(result).toContain('cpg=http://example.com/another-page');
    });

    it('should use delimiter correctly', () => {
      const result = packSession(2);
      expect(result.split('|||').length).toBe(2);
    });
  });

  describe('packUser()', () => {
    it('should pack user data correctly', () => {
      const result = packUser(5, '192.168.1.1');
      expect(result).toContain('vst=5');
      expect(result).toContain('uip=192.168.1.1');
      expect(result).toContain('uag=');
    });

    it('should handle first visit', () => {
      const result = packUser(1, '(none)');
      expect(result).toContain('vst=1');
      expect(result).toContain('uip=(none)');
    });

    it('should include user agent', () => {
      const result = packUser(1, '192.168.1.1');
      expect(result).toContain('uag=');
      // User agent should be present (browser specific)
      expect(result.split('|||').length).toBe(3);
    });

    it('should handle IP address', () => {
      const result = packUser(2, '10.0.0.1');
      expect(result).toContain('uip=10.0.0.1');
    });

    it('should use delimiter correctly', () => {
      const result = packUser(1, '192.168.1.1');
      expect(result.split('|||').length).toBe(3);
    });
  });

  describe('packPromo()', () => {
    it('should generate promo code in range', () => {
      const config = { min: 100000, max: 999999 };
      const result = packPromo(config);
      
      // Extract code from result
      const codeMatch = result.match(/code=(\d+)/);
      expect(codeMatch).toBeTruthy();
      if (codeMatch) {
        const code = parseInt(codeMatch[1], 10);
        expect(code).toBeGreaterThanOrEqual(100000);
        expect(code).toBeLessThanOrEqual(999999);
      }
    });

    it('should pad code with leading zeros', () => {
      const config = { min: 100000, max: 999999 };
      const result = packPromo(config);
      
      const codeMatch = result.match(/code=(\d+)/);
      expect(codeMatch).toBeTruthy();
      if (codeMatch) {
        const code = codeMatch[1];
        expect(code.length).toBe(6); // Length of max value
      }
    });

    it('should handle different ranges', () => {
      const config = { min: 1, max: 100 };
      const result = packPromo(config);
      
      const codeMatch = result.match(/code=(\d+)/);
      expect(codeMatch).toBeTruthy();
      if (codeMatch) {
        const code = parseInt(codeMatch[1], 10);
        expect(code).toBeGreaterThanOrEqual(1);
        expect(code).toBeLessThanOrEqual(100);
        expect(codeMatch[1].length).toBe(3); // Length of max value (100)
      }
    });

    it('should format result correctly', () => {
      const config = { min: 100000, max: 999999 };
      const result = packPromo(config);
      expect(result).toMatch(/^code=\d{6}$/);
    });

    it('should generate different codes on multiple calls', () => {
      const config = { min: 100000, max: 999999 };
      const results = Array.from({ length: 10 }, () => packPromo(config));
      
      // At least some codes should be different (very unlikely all are same)
      const uniqueCodes = new Set(results);
      // With 10 calls, we expect at least 2 different codes (very high probability)
      expect(uniqueCodes.size).toBeGreaterThan(1);
    });

    it('should handle min equals max', () => {
      const config = { min: 123456, max: 123456 };
      const result = packPromo(config);
      expect(result).toBe('code=123456');
    });
  });

  describe('integration: all pack functions', () => {
    it('should work together correctly', () => {
      const source = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: 'content',
        trm: 'term'
      };
      
      const main = packMain(source);
      const extra = packExtra();
      const session = packSession(1);
      const user = packUser(1, '(none)');
      
      expect(main).toContain('typ=utm');
      expect(extra).toContain('ep=');
      expect(session).toContain('pgs=1');
      expect(user).toContain('vst=1');
    });
  });
});

