import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  packClickIds,
  parseClickIds,
  getClickIds,
  collectClickIds
} from '@/identity/click-ids';
import type { ClickIds } from '@/types';
import { get, set } from '@/helpers/cookies';
import { getParam } from '@/helpers/uri';

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

// Mock uri helpers
vi.mock('@/helpers/uri', () => ({
  getParam: vi.fn((name: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  })
}));

describe('click-ids', () => {
  beforeEach(() => {
    // Clear cookies and URL params before each test
    vi.mocked(get).mockReturnValue(null);
    vi.mocked(set).mockClear();
    // Reset window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true
    });
  });

  describe('packClickIds()', () => {
    it('should pack empty click IDs', () => {
      const clickIds: ClickIds = {};
      const result = packClickIds(clickIds);
      expect(result).toBe('');
    });

    it('should pack single click ID', () => {
      const clickIds: ClickIds = { gclid: 'test123' };
      const result = packClickIds(clickIds);
      expect(result).toBe('gclid=test123');
    });

    it('should pack multiple click IDs', () => {
      const clickIds: ClickIds = {
        gclid: 'test123',
        fbclid: 'fb456',
        msclkid: 'ms789'
      };
      const result = packClickIds(clickIds);
      
      expect(result).toContain('gclid=test123');
      expect(result).toContain('fbclid=fb456');
      expect(result).toContain('msclkid=ms789');
      expect(result.split('|||')).toHaveLength(3);
    });

    it('should skip empty values', () => {
      const clickIds: ClickIds = {
        gclid: 'test123',
        fbclid: '',
        msclkid: 'ms789'
      };
      const result = packClickIds(clickIds);
      
      expect(result).toContain('gclid=test123');
      expect(result).toContain('msclkid=ms789');
      expect(result).not.toContain('fbclid');
      expect(result.split('|||')).toHaveLength(2);
    });
  });

  describe('parseClickIds()', () => {
    it('should parse empty string', () => {
      const result = parseClickIds(null);
      expect(result).toEqual({});
    });

    it('should parse single click ID', () => {
      const packed = 'gclid=test123';
      const result = parseClickIds(packed);
      
      expect(result).toEqual({ gclid: 'test123' });
    });

    it('should parse multiple click IDs', () => {
      const packed = 'gclid=test123|||fbclid=fb456|||msclkid=ms789';
      const result = parseClickIds(packed);
      
      expect(result).toEqual({
        gclid: 'test123',
        fbclid: 'fb456',
        msclkid: 'ms789'
      });
    });

    it('should skip empty values', () => {
      const packed = 'gclid=test123|||fbclid=|||msclkid=ms789';
      const result = parseClickIds(packed);
      
      expect(result).toEqual({
        gclid: 'test123',
        msclkid: 'ms789'
      });
    });
  });

  describe('getClickIds()', () => {
    it('should return empty object when cookie does not exist', () => {
      vi.mocked(get).mockReturnValue(null);
      const result = getClickIds();
      expect(result).toEqual({});
    });

    it('should return parsed click IDs from cookie', () => {
      const packed = 'gclid=test123|||fbclid=fb456';
      vi.mocked(get).mockReturnValue(packed);
      const result = getClickIds();
      
      expect(result).toEqual({
        gclid: 'test123',
        fbclid: 'fb456'
      });
    });
  });

  describe('collectClickIds()', () => {
    const lifetime = 25920; // 6 months in minutes
    const cookieDomain = undefined;

    it('should collect gclid from URL', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?gclid=test123' },
        writable: true
      });
      
      vi.mocked(get).mockReturnValue(null);
      const result = collectClickIds(lifetime, cookieDomain);
      
      expect(result.gclid).toBe('test123');
      expect(set).toHaveBeenCalled();
    });

    it('should collect multiple click IDs from URL', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?gclid=test123&fbclid=fb456&msclkid=ms789' },
        writable: true
      });
      
      vi.mocked(get).mockReturnValue(null);
      const result = collectClickIds(lifetime, cookieDomain);
      
      expect(result.gclid).toBe('test123');
      expect(result.fbclid).toBe('fb456');
      expect(result.msclkid).toBe('ms789');
    });

    it('should merge with existing click IDs from cookie', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?gclid=new123' },
        writable: true
      });
      
      // Existing cookie with old gclid and fbclid
      const existingPacked = 'gclid=old123|||fbclid=fb456';
      vi.mocked(get).mockReturnValue(existingPacked);
      
      const result = collectClickIds(lifetime, cookieDomain);
      
      // New gclid should overwrite old one
      expect(result.gclid).toBe('new123');
      // Existing fbclid should be preserved
      expect(result.fbclid).toBe('fb456');
    });

    it('should not save cookie when no click IDs found', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true
      });
      
      vi.mocked(get).mockReturnValue(null);
      const result = collectClickIds(lifetime, cookieDomain);
      
      expect(result).toEqual({});
      expect(set).not.toHaveBeenCalled();
    });

    it('should preserve existing click IDs when no new ones in URL', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true
      });
      
      const existingPacked = 'gclid=test123|||fbclid=fb456';
      vi.mocked(get).mockReturnValue(existingPacked);
      
      const result = collectClickIds(lifetime, cookieDomain);
      
      expect(result.gclid).toBe('test123');
      expect(result.fbclid).toBe('fb456');
    });

    it('should collect all known click ID types', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?gclid=g123&wbraid=wb456&gbraid=gb789&dclid=dc012&fbclid=fb789&msclkid=ms012&ttclid=tt345&li_fatid=li678'
        },
        writable: true
      });
      
      vi.mocked(get).mockReturnValue(null);
      const result = collectClickIds(lifetime, cookieDomain);
      
      // Google Ads identifiers
      expect(result.gclid).toBe('g123');
      expect(result.wbraid).toBe('wb456');
      expect(result.gbraid).toBe('gb789');
      expect(result.dclid).toBe('dc012');
      
      // Other platforms
      expect(result.fbclid).toBe('fb789');
      expect(result.msclkid).toBe('ms012');
      expect(result.ttclid).toBe('tt345');
      expect(result.li_fatid).toBe('li678');
    });

    it('should trim whitespace from click IDs', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?gclid=  test123  ' },
        writable: true
      });
      
      vi.mocked(get).mockReturnValue(null);
      const result = collectClickIds(lifetime, cookieDomain);
      
      expect(result.gclid).toBe('test123');
    });

    it('should ignore empty click IDs', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?gclid=&fbclid=fb456' },
        writable: true
      });
      
      vi.mocked(get).mockReturnValue(null);
      const result = collectClickIds(lifetime, cookieDomain);
      
      expect(result.gclid).toBeUndefined();
      expect(result.fbclid).toBe('fb456');
    });
  });
});

