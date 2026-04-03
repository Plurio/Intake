import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  packTouchpointChain,
  parseTouchpointChain,
  getTouchpointChain,
  addTouchpoint
} from '@/attribution/touchpoint-chain';
import type { Touchpoint, TouchpointChain, TrafficSource } from '@/types';
import { get, set } from '@/helpers/cookies';

// Mock cookies helpers
vi.mock('@/helpers/cookies', () => {
  const cookies: Record<string, string> = {};
  return {
    get: vi.fn((name: string) => cookies[name] || null),
    set: vi.fn((name: string, value: string) => {
      cookies[name] = value;
    }),
    parse: vi.fn((container: string) => {
      const DELIMITER = '|||';
      const data: Record<string, string> = {};
      const parts = container.split(DELIMITER);
      
      for (const part of parts) {
        const equalIndex = part.indexOf('=');
        if (equalIndex === -1) continue;
        const key = part.substring(0, equalIndex);
        const value = part.substring(equalIndex + 1);
        if (key) {
          data[key] = value;
        }
      }
      
      return data;
    })
  };
});

describe('touchpoint-chain', () => {
  beforeEach(() => {
    // Clear cookies before each test
    vi.mocked(get).mockReturnValue(null);
    vi.mocked(set).mockClear();
  });

  describe('packTouchpointChain()', () => {
    it('should pack empty chain correctly', () => {
      const chain: TouchpointChain = { touchpoints: [] };
      const result = packTouchpointChain(chain);
      expect(result).toBe('');
    });

    it('should pack single touchpoint correctly', () => {
      const touchpoint: Touchpoint = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: 'content',
        trm: 'term',
        ts: 1234567890
      };
      const chain: TouchpointChain = { touchpoints: [touchpoint] };
      const result = packTouchpointChain(chain);
      
      expect(result).toContain('typ=utm');
      expect(result).toContain('src=google');
      expect(result).toContain('ts=1234567890');
    });

    it('should pack multiple touchpoints correctly', () => {
      const touchpoints: Touchpoint[] = [
        {
          typ: 'utm',
          src: 'google',
          mdm: 'cpc',
          cmp: 'campaign1',
          cnt: '',
          trm: '',
          ts: 1000
        },
        {
          typ: 'organic',
          src: 'google',
          mdm: 'organic',
          cmp: '(none)',
          cnt: '(none)',
          trm: '(none)',
          ts: 2000
        }
      ];
      const chain: TouchpointChain = { touchpoints };
      const result = packTouchpointChain(chain);
      
      expect(result).toContain('typ=utm');
      expect(result).toContain('typ=organic');
      expect(result.split(':::')).toHaveLength(2);
    });
  });

  describe('parseTouchpointChain()', () => {
    it('should parse empty string', () => {
      const result = parseTouchpointChain(null);
      expect(result.touchpoints).toEqual([]);
    });

    it('should parse single touchpoint', () => {
      const packed = 'typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=content|||trm=term|||ts=1234567890';
      const result = parseTouchpointChain(packed);
      
      expect(result.touchpoints).toHaveLength(1);
      expect(result.touchpoints[0]).toEqual({
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: 'content',
        trm: 'term',
        ts: 1234567890
      });
    });

    it('should parse multiple touchpoints', () => {
      const tp1 = 'typ=utm|||src=google|||mdm=cpc|||cmp=campaign1|||cnt=|||trm=|||ts=1000';
      const tp2 = 'typ=organic|||src=google|||mdm=organic|||cmp=(none)|||cnt=(none)|||trm=(none)|||ts=2000';
      const packed = `${tp1}:::${tp2}`;
      const result = parseTouchpointChain(packed);
      
      expect(result.touchpoints).toHaveLength(2);
      expect(result.touchpoints[0].typ).toBe('utm');
      expect(result.touchpoints[1].typ).toBe('organic');
    });

    it('should skip invalid touchpoints', () => {
      const tp1 = 'typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=|||trm=|||ts=1000';
      const invalid = 'invalid_format';
      const tp2 = 'typ=organic|||src=google|||mdm=organic|||cmp=(none)|||cnt=(none)|||trm=(none)|||ts=2000';
      const packed = `${tp1}:::${invalid}:::${tp2}`;
      const result = parseTouchpointChain(packed);
      
      expect(result.touchpoints).toHaveLength(2);
    });

    it('should skip touchpoints without timestamp', () => {
      const invalid = 'typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=|||trm=';
      const result = parseTouchpointChain(invalid);
      
      expect(result.touchpoints).toHaveLength(0);
    });
  });

  describe('getTouchpointChain()', () => {
    it('should return empty chain when cookie does not exist', () => {
      vi.mocked(get).mockReturnValue(null);
      const result = getTouchpointChain();
      expect(result.touchpoints).toEqual([]);
    });

    it('should return parsed chain from cookie', () => {
      const packed = 'typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=|||trm=|||ts=1000';
      vi.mocked(get).mockReturnValue(packed);
      const result = getTouchpointChain();
      
      expect(result.touchpoints).toHaveLength(1);
      expect(result.touchpoints[0].typ).toBe('utm');
    });
  });

  describe('addTouchpoint()', () => {
    const lifetime = 25920; // 6 months in minutes
    const cookieDomain = undefined;

    it('should add significant utm source', () => {
      const source: TrafficSource = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: 'content',
        trm: 'term'
      };
      
      vi.mocked(get).mockReturnValue(null);
      const result = addTouchpoint(source, lifetime, cookieDomain);
      
      expect(result.touchpoints).toHaveLength(1);
      expect(result.touchpoints[0].typ).toBe('utm');
      expect(result.touchpoints[0].ts).toBeGreaterThan(0);
      expect(set).toHaveBeenCalled();
    });

    it('should add significant organic source', () => {
      const source: TrafficSource = {
        typ: 'organic',
        src: 'google',
        mdm: 'organic',
        cmp: '(none)',
        cnt: '(none)',
        trm: '(none)'
      };
      
      vi.mocked(get).mockReturnValue(null);
      const result = addTouchpoint(source, lifetime, cookieDomain);
      
      expect(result.touchpoints).toHaveLength(1);
      expect(result.touchpoints[0].typ).toBe('organic');
    });

    it('should add significant referral source', () => {
      const source: TrafficSource = {
        typ: 'referral',
        src: 'example.com',
        mdm: 'referral',
        cmp: '(none)',
        cnt: '(none)',
        trm: '(none)'
      };
      
      vi.mocked(get).mockReturnValue(null);
      const result = addTouchpoint(source, lifetime, cookieDomain);
      
      expect(result.touchpoints).toHaveLength(1);
      expect(result.touchpoints[0].typ).toBe('referral');
    });

    it('should not add typein source (not significant)', () => {
      const source: TrafficSource = {
        typ: 'typein',
        src: '(direct)',
        mdm: '(none)',
        cmp: '(none)',
        cnt: '(none)',
        trm: '(none)'
      };
      
      vi.mocked(get).mockReturnValue(null);
      const result = addTouchpoint(source, lifetime, cookieDomain);
      
      expect(result.touchpoints).toHaveLength(0);
      expect(set).not.toHaveBeenCalled();
    });

    it('should not add duplicate touchpoint', () => {
      const source: TrafficSource = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: '',
        trm: ''
      };
      
      // First add
      vi.mocked(get).mockReturnValue(null);
      const firstResult = addTouchpoint(source, lifetime, cookieDomain);
      expect(firstResult.touchpoints).toHaveLength(1);
      
      // Mock cookie with existing touchpoint
      const existingPacked = packTouchpointChain(firstResult);
      vi.mocked(get).mockReturnValue(existingPacked);
      
      // Try to add duplicate
      const secondResult = addTouchpoint(source, lifetime, cookieDomain);
      
      // Should still have only 1 touchpoint (duplicate not added)
      expect(secondResult.touchpoints).toHaveLength(1);
    });

    it('should add different touchpoint even if type is same', () => {
      const source1: TrafficSource = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign1',
        cnt: '',
        trm: ''
      };
      
      const source2: TrafficSource = {
        typ: 'utm',
        src: 'facebook',
        mdm: 'cpc',
        cmp: 'campaign2',
        cnt: '',
        trm: ''
      };
      
      // Add first
      vi.mocked(get).mockReturnValue(null);
      const firstResult = addTouchpoint(source1, lifetime, cookieDomain);
      expect(firstResult.touchpoints).toHaveLength(1);
      
      // Mock cookie with existing touchpoint
      const existingPacked = packTouchpointChain(firstResult);
      vi.mocked(get).mockReturnValue(existingPacked);
      
      // Add second (different source)
      const secondResult = addTouchpoint(source2, lifetime, cookieDomain);
      
      expect(secondResult.touchpoints).toHaveLength(2);
      expect(secondResult.touchpoints[0].src).toBe('google');
      expect(secondResult.touchpoints[1].src).toBe('facebook');
    });

    it('should limit chain to MAX_TOUCHPOINTS', () => {
      const source: TrafficSource = {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: '',
        trm: ''
      };
      
      // Create chain with MAX_TOUCHPOINTS touchpoints
      const manyTouchpoints: Touchpoint[] = Array.from({ length: 50 }, (_, i) => ({
        typ: 'utm',
        src: `source${i}`,
        mdm: 'cpc',
        cmp: `campaign${i}`,
        cnt: '',
        trm: '',
        ts: 1000 + i
      }));
      
      const existingChain: TouchpointChain = { touchpoints: manyTouchpoints };
      const existingPacked = packTouchpointChain(existingChain);
      vi.mocked(get).mockReturnValue(existingPacked);
      
      // Add one more
      const result = addTouchpoint(source, lifetime, cookieDomain);
      
      // Should still have MAX_TOUCHPOINTS (trimmed)
      expect(result.touchpoints).toHaveLength(50);
      // Last touchpoint should be the new one
      expect(result.touchpoints[result.touchpoints.length - 1].src).toBe('google');
    });

    it('should preserve existing touchpoints when adding new one', () => {
      const existingTouchpoint: Touchpoint = {
        typ: 'organic',
        src: 'google',
        mdm: 'organic',
        cmp: '(none)',
        cnt: '(none)',
        trm: '(none)',
        ts: 1000
      };
      
      const existingChain: TouchpointChain = { touchpoints: [existingTouchpoint] };
      const existingPacked = packTouchpointChain(existingChain);
      vi.mocked(get).mockReturnValue(existingPacked);
      
      const newSource: TrafficSource = {
        typ: 'utm',
        src: 'facebook',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: '',
        trm: ''
      };
      
      const result = addTouchpoint(newSource, lifetime, cookieDomain);
      
      expect(result.touchpoints).toHaveLength(2);
      expect(result.touchpoints[0].typ).toBe('organic');
      expect(result.touchpoints[1].typ).toBe('utm');
    });
  });
});

