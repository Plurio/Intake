import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  packAnalyticsIds,
  parseAnalyticsIds,
  getAnalyticsIds,
  collectAnalyticsIds
} from '@/identity/analytics-ids';
import type { AnalyticsIds, AnalyticsIdsConfig } from '@/types';
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

// Mock document.cookie
const mockCookies: Record<string, string> = {};

Object.defineProperty(document, 'cookie', {
  get: () => {
    return Object.entries(mockCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  },
  set: (cookieString: string) => {
    const [nameValue] = cookieString.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      mockCookies[name.trim()] = value.trim();
    }
  },
  configurable: true
});

describe('analytics-ids', () => {
  beforeEach(() => {
    // Clear cookies before each test
    Object.keys(mockCookies).forEach(key => delete mockCookies[key]);
    vi.mocked(get).mockReturnValue(null);
    vi.mocked(set).mockClear();
  });

  describe('packAnalyticsIds()', () => {
    it('should pack empty analytics IDs', () => {
      const analyticsIds: AnalyticsIds = {};
      const result = packAnalyticsIds(analyticsIds);
      expect(result).toBe('');
    });

    it('should pack single analytics ID', () => {
      const analyticsIds: AnalyticsIds = { ga_client_id: '123456789.1234567890' };
      const result = packAnalyticsIds(analyticsIds);
      expect(result).toBe('ga_client_id=123456789.1234567890');
    });

    it('should pack multiple analytics IDs', () => {
      const analyticsIds: AnalyticsIds = {
        ga_client_id: '123456789.1234567890',
        amplitude_id: 'amp123',
        mixpanel_id: 'mix456'
      };
      const result = packAnalyticsIds(analyticsIds);
      
      expect(result).toContain('ga_client_id=123456789.1234567890');
      expect(result).toContain('amplitude_id=amp123');
      expect(result).toContain('mixpanel_id=mix456');
      expect(result.split('|||')).toHaveLength(3);
    });

    it('should skip empty values', () => {
      const analyticsIds: AnalyticsIds = {
        ga_client_id: '123456789.1234567890',
        amplitude_id: '',
        mixpanel_id: 'mix456'
      };
      const result = packAnalyticsIds(analyticsIds);
      
      expect(result).toContain('ga_client_id=123456789.1234567890');
      expect(result).toContain('mixpanel_id=mix456');
      expect(result).not.toContain('amplitude_id');
      expect(result.split('|||')).toHaveLength(2);
    });
  });

  describe('parseAnalyticsIds()', () => {
    it('should parse empty string', () => {
      const result = parseAnalyticsIds(null);
      expect(result).toEqual({});
    });

    it('should parse single analytics ID', () => {
      const packed = 'ga_client_id=123456789.1234567890';
      const result = parseAnalyticsIds(packed);
      
      expect(result).toEqual({ ga_client_id: '123456789.1234567890' });
    });

    it('should parse multiple analytics IDs', () => {
      const packed = 'ga_client_id=123456789.1234567890|||amplitude_id=amp123|||mixpanel_id=mix456';
      const result = parseAnalyticsIds(packed);
      
      expect(result).toEqual({
        ga_client_id: '123456789.1234567890',
        amplitude_id: 'amp123',
        mixpanel_id: 'mix456'
      });
    });

    it('should skip empty values', () => {
      const packed = 'ga_client_id=123456789.1234567890|||amplitude_id=|||mixpanel_id=mix456';
      const result = parseAnalyticsIds(packed);
      
      expect(result).toEqual({
        ga_client_id: '123456789.1234567890',
        mixpanel_id: 'mix456'
      });
    });
  });

  describe('getAnalyticsIds()', () => {
    it('should return empty object when cookie does not exist', () => {
      vi.mocked(get).mockReturnValue(null);
      const result = getAnalyticsIds();
      expect(result).toEqual({});
    });

    it('should return parsed analytics IDs from cookie', () => {
      const packed = 'ga_client_id=123456789.1234567890|||amplitude_id=amp123';
      vi.mocked(get).mockReturnValue(packed);
      const result = getAnalyticsIds();
      
      expect(result).toEqual({
        ga_client_id: '123456789.1234567890',
        amplitude_id: 'amp123'
      });
    });
  });

  describe('collectAnalyticsIds()', () => {
    const lifetime = 25920; // 6 months in minutes
    const cookieDomain = undefined;

    it('should collect Google Analytics Client ID from _ga cookie', async () => {
      // Mock _ga cookie: GA1.2.CLIENT_ID
      mockCookies['_ga'] = 'GA1.2.123456789.1234567890';
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.ga_client_id).toBe('123456789.1234567890');
      expect(set).toHaveBeenCalled();
    });

    it('should collect Google Analytics Session ID from _ga_* cookie', async () => {
      // Mock _ga_* cookie: GS1.1.SESSION_ID.TIMESTAMP
      mockCookies['_ga_G123456789'] = 'GS1.1.987654321.1234567890';
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.ga_session_id).toBe('987654321');
      expect(set).toHaveBeenCalled();
    });

    it('should collect Amplitude ID from amp_* cookie', async () => {
      mockCookies['amp_123456789'] = 'amp_user_id_123';
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        amplitude: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.amplitude_id).toBe('amp_user_id_123');
      expect(set).toHaveBeenCalled();
    });

    it('should collect Mixpanel ID from distinct_id cookie', async () => {
      mockCookies['distinct_id'] = 'mixpanel_user_456';
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        mixpanel: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.mixpanel_id).toBe('mixpanel_user_456');
      expect(set).toHaveBeenCalled();
    });

    it('should collect all analytics IDs together', async () => {
      mockCookies['_ga'] = 'GA1.2.123456789.1234567890';
      mockCookies['_ga_G123456789'] = 'GS1.1.987654321.1234567890';
      mockCookies['amp_123456789'] = 'amp_user_id_123';
      mockCookies['distinct_id'] = 'mixpanel_user_456';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: true,
        amplitude: true,
        mixpanel: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.ga_client_id).toBe('123456789.1234567890');
      expect(result.ga_session_id).toBe('987654321');
      expect(result.amplitude_id).toBe('amp_user_id_123');
      expect(result.mixpanel_id).toBe('mixpanel_user_456');
    });

    it('should merge with existing analytics IDs from cookie', async () => {
      mockCookies['_ga'] = 'GA1.2.123456789.1234567890';
      
      vi.mocked(get).mockImplementation((name: string) => {
        if (name === 'intk_analytics_ids') {
          return 'mixpanel_id=old_mixpanel_id';
        }
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: true,
        mixpanel: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      // New values should be added
      expect(result.ga_client_id).toBe('123456789.1234567890');
      // Old values should be preserved
      expect(result.mixpanel_id).toBe('old_mixpanel_id');
    });

    it('should not save cookie when no analytics IDs found', async () => {
      vi.mocked(get).mockReturnValue(null);
      
      const config: AnalyticsIdsConfig = {
        google_analytics: false,
        amplitude: false,
        mixpanel: false
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result).toEqual({});
      expect(set).not.toHaveBeenCalled();
    });

    it('should respect disabled config options', async () => {
      mockCookies['_ga'] = 'GA1.2.123456789.1234567890';
      mockCookies['distinct_id'] = 'mixpanel_user_456';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: false,  // Disabled
        mixpanel: true
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.ga_client_id).toBeUndefined();
      expect(result.mixpanel_id).toBe('mixpanel_user_456');
    });

    it('should collect custom analytics IDs', async () => {
      mockCookies['custom_analytics_id'] = 'custom_value_123';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        custom: [
          {
            name: 'custom_id',
            cookie_name: 'custom_analytics_id'
          }
        ]
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.custom_id).toBe('custom_value_123');
    });

    it('should extract custom analytics ID with pattern', async () => {
      mockCookies['custom_cookie'] = 'prefix_12345_suffix';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        custom: [
          {
            name: 'extracted_id',
            cookie_name: 'custom_cookie',
            pattern: 'prefix_(.+?)_suffix'
          }
        ]
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.extracted_id).toBe('12345');
    });

    it('should handle custom cookie with wildcard pattern', async () => {
      mockCookies['custom_analytics_123'] = 'value123';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        custom: [
          {
            name: 'wildcard_id',
            cookie_name: 'custom_*'
          }
        ]
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.wildcard_id).toBe('value123');
    });

    it('should use custom Google Analytics cookie name', async () => {
      mockCookies['custom_ga'] = 'GA1.2.999999999.8888888888';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: {
          cookie_name: 'custom_ga'
        }
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.ga_client_id).toBe('999999999.8888888888');
    });

    it('should use custom Client ID pattern', async () => {
      mockCookies['_ga'] = 'CUSTOM1.2.3.CLIENT_ID_VALUE';
      
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: {
          cookie_name: '_ga',
          client_id_pattern: 'CUSTOM1\\.\\d+\\.\\d+\\.(.+)'
        }
      };
      
      const result = await collectAnalyticsIds(config, lifetime, cookieDomain);
      
      expect(result.ga_client_id).toBe('CLIENT_ID_VALUE');
    });

    it('should handle delay parameter', async () => {
      const startTime = Date.now();
      
      mockCookies['_ga'] = 'GA1.2.123456789.1234567890';
      vi.mocked(get).mockImplementation((name: string) => {
        return mockCookies[name] || null;
      });
      
      const config: AnalyticsIdsConfig = {
        google_analytics: true
      };
      
      await collectAnalyticsIds(config, lifetime, cookieDomain, 50);
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should wait at least 50ms
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some margin
    });
  });
});

