import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserId,
  setUserId,
  watchUserId,
  initUserId
} from '@/identity/user-id';
import type { UserIdConfig } from '@/types';
import { get, set } from '@/helpers/cookies';

// Mock cookies helpers
vi.mock('@/helpers/cookies', () => {
  const cookies: Record<string, string> = {};
  return {
    get: vi.fn((name: string) => cookies[name] || null),
    set: vi.fn((name: string, value: string, minutes?: number, domain?: string) => {
      if (value === '' && minutes === 0) {
        delete cookies[name];
      } else {
        cookies[name] = value;
      }
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

describe('user-id', () => {
  let mockDataLayer: any[];
  let originalDataLayer: any;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Clear cookies
    vi.mocked(get).mockReturnValue(null);
    vi.mocked(set).mockClear();

    // Setup localStorage mock
    originalLocalStorage = global.localStorage;
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    global.localStorage = localStorageMock as any;

    // Setup dataLayer mock
    mockDataLayer = [];
    originalDataLayer = (window as any).dataLayer;
    (window as any).dataLayer = mockDataLayer;
  });

  afterEach(() => {
    // Restore localStorage
    global.localStorage = originalLocalStorage;

    // Restore dataLayer
    if (originalDataLayer !== undefined) {
      (window as any).dataLayer = originalDataLayer;
    } else {
      delete (window as any).dataLayer;
    }

    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('should return null when no User ID is set', () => {
      vi.mocked(get).mockReturnValue(null);
      expect(getUserId()).toBeNull();
    });

    it('should return User ID from cookie', () => {
      vi.mocked(get).mockReturnValue('user-123');
      expect(getUserId()).toBe('user-123');
    });
  });

  describe('setUserId', () => {
    it('should set User ID in cookie and localStorage', () => {
      setUserId('user-456');
      
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-456', 259200, undefined);
      expect(localStorage.setItem).toHaveBeenCalledWith('intk_user_id', 'user-456');
    });

    it('should set User ID with custom lifetime', () => {
      setUserId('user-789', 1000);
      
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-789', 1000, undefined);
    });

    it('should set User ID with custom domain', () => {
      setUserId('user-domain', 259200, '.example.com');
      
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-domain', 259200, '.example.com');
    });

    it('should clear User ID when null is passed', () => {
      // First set a User ID, then clear it
      setUserId('user-to-clear');
      vi.clearAllMocks();
      
      setUserId(null);
      
      expect(set).toHaveBeenCalledWith('intk_user_id', '', 0, undefined);
      expect(localStorage.removeItem).toHaveBeenCalledWith('intk_user_id');
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw
      expect(() => setUserId('user-error')).not.toThrow();
      expect(set).toHaveBeenCalled();
    });
  });

  describe('watchUserId', () => {
    it('should return null when config is not provided', () => {
      expect(watchUserId(undefined)).toBeNull();
    });

    it('should get User ID from dataLayer', () => {
      mockDataLayer.push({ user_id: 'dataLayer-user-123' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBe('dataLayer-user-123');
      expect(set).toHaveBeenCalledWith('intk_user_id', 'dataLayer-user-123', 259200, undefined);
    });

    it('should get User ID from dataLayer (latest entry)', () => {
      mockDataLayer.push({ user_id: 'old-user' });
      mockDataLayer.push({ other_data: 'test' });
      mockDataLayer.push({ user_id: 'new-user' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBe('new-user');
    });

    it('should get User ID from cookie', () => {
      vi.mocked(get).mockImplementation((name: string) => {
        if (name === 'custom_user_id') return 'cookie-user-123';
        return null;
      });
      
      const config: UserIdConfig = {
        source: 'cookie',
        key: 'custom_user_id'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBe('cookie-user-123');
      expect(set).toHaveBeenCalledWith('intk_user_id', 'cookie-user-123', 259200, undefined);
    });

    it('should get User ID from localStorage', () => {
      (localStorage.getItem as any).mockReturnValue('localStorage-user-123');
      
      const config: UserIdConfig = {
        source: 'localStorage',
        key: 'custom_user_id'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBe('localStorage-user-123');
      expect(localStorage.getItem).toHaveBeenCalledWith('custom_user_id');
      expect(set).toHaveBeenCalledWith('intk_user_id', 'localStorage-user-123', 259200, undefined);
    });

    it('should get User ID from function', () => {
      const config: UserIdConfig = {
        source: 'function',
        function: () => 'function-user-123'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBe('function-user-123');
      expect(set).toHaveBeenCalledWith('intk_user_id', 'function-user-123', 259200, undefined);
    });

    it('should handle function errors gracefully', () => {
      const config: UserIdConfig = {
        source: 'function',
        function: () => {
          throw new Error('Function error');
        }
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const userId = watchUserId(config);
      
      expect(userId).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should use custom lifetime from config', () => {
      mockDataLayer.push({ user_id: 'user-lifetime' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id',
        lifetime: 5000
      };
      
      watchUserId(config);
      
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-lifetime', 5000, undefined);
    });

    it('should use custom cookieDomain from config', () => {
      mockDataLayer.push({ user_id: 'user-domain' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id',
        cookieDomain: '.example.com'
      };
      
      watchUserId(config);
      
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-domain', 259200, '.example.com');
    });

    it('should return null when dataLayer key is not found', () => {
      mockDataLayer.push({ other_data: 'test' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBeNull();
    });

    it('should return null when cookie key is not found', () => {
      vi.mocked(get).mockReturnValue(null);
      
      const config: UserIdConfig = {
        source: 'cookie',
        key: 'non_existent_key'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBeNull();
    });

    it('should return null when localStorage key is not found', () => {
      (localStorage.getItem as any).mockReturnValue(null);
      
      const config: UserIdConfig = {
        source: 'localStorage',
        key: 'non_existent_key'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      const config: UserIdConfig = {
        source: 'localStorage',
        key: 'custom_user_id'
      };
      
      const userId = watchUserId(config);
      
      expect(userId).toBeNull();
    });
  });

  describe('initUserId', () => {
    it('should return existing User ID from cookie', () => {
      vi.mocked(get).mockImplementation((name: string) => {
        if (name === 'intk_user_id') return 'existing-user';
        return null;
      });
      
      const userId = initUserId();
      
      expect(userId).toBe('existing-user');
      // Should not call watchUserId when existing User ID is found
      expect(set).not.toHaveBeenCalled();
    });

    it('should get User ID from config when no existing User ID', () => {
      vi.mocked(get).mockReturnValue(null);
      mockDataLayer.push({ user_id: 'config-user' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id'
      };
      
      const userId = initUserId(config);
      
      expect(userId).toBe('config-user');
    });

    it('should return null when no config and no existing User ID', () => {
      vi.mocked(get).mockReturnValue(null);
      
      const userId = initUserId();
      
      expect(userId).toBeNull();
    });

    it('should use custom lifetime and domain', () => {
      vi.mocked(get).mockReturnValue(null);
      mockDataLayer.push({ user_id: 'user-custom' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id',
        lifetime: 1000,
        cookieDomain: '.example.com'
      };
      
      const userId = initUserId(config, 2000, '.other.com');
      
      expect(userId).toBe('user-custom');
      // Should use config values, not function parameters
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-custom', 1000, '.example.com');
    });

    it('should use function parameters when config values are not provided', () => {
      vi.mocked(get).mockReturnValue(null);
      mockDataLayer.push({ user_id: 'user-params' });
      
      const config: UserIdConfig = {
        source: 'dataLayer',
        key: 'user_id'
        // No lifetime or cookieDomain in config
      };
      
      const userId = initUserId(config, 3000, '.params.com');
      
      expect(userId).toBe('user-params');
      expect(set).toHaveBeenCalledWith('intk_user_id', 'user-params', 3000, '.params.com');
    });
  });
});

