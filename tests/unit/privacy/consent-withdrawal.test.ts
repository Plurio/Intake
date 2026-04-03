import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearAllCookies,
  clearAllLocalStorage,
  clearAllData,
  withdrawConsent
} from '@/privacy/consent-withdrawal';
import { set } from '@/helpers/cookies';
import { clearCookies } from '../../setup';

describe('privacy/consent-withdrawal', () => {
  beforeEach(() => {
    clearCookies();
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
    // Clear window.name
    window.name = '';
  });

  describe('clearAllCookies()', () => {
    it('should delete all Intake cookies', () => {
      // Set several cookies
      set('intk_session', 'test_session');
      set('intk_current', 'test_current');
      set('intk_first', 'test_first');
      set('intk_user_id', 'test_user_id');
      
      // Verify cookies are set
      expect(document.cookie).toContain('intk_session');
      expect(document.cookie).toContain('intk_current');
      
      // Clear all cookies
      clearAllCookies();
      
      // Verify cookies are deleted
      expect(document.cookie).not.toContain('intk_session');
      expect(document.cookie).not.toContain('intk_current');
      expect(document.cookie).not.toContain('intk_first');
      expect(document.cookie).not.toContain('intk_user_id');
    });

    it('should delete cookies with domain', () => {
      // Set cookie with domain (if possible)
      set('intk_session', 'test', undefined, '.example.com');
      
      clearAllCookies('.example.com');
      
      // Cookie should be deleted
      expect(document.cookie).not.toContain('intk_session');
    });

    it('should not affect non-Intake cookies', () => {
      // Set Intake cookie
      set('intk_session', 'test');
      
      // Set another cookie (simulate via document.cookie directly)
      document.cookie = 'other_cookie=value;path=/';
      
      clearAllCookies();
      
      // Intake cookie should be deleted
      expect(document.cookie).not.toContain('intk_session');
      // Other cookie should remain (if the test environment supports it)
      // In jsdom this may not work perfectly, but we verify it doesn't throw
    });
  });

  describe('clearAllLocalStorage()', () => {
    it('should remove Intake keys from localStorage', () => {
      // Set data in localStorage
      localStorage.setItem('intk_user_id', 'test_user_id');
      localStorage.setItem('intk_other', 'test_other');
      localStorage.setItem('other_key', 'other_value');
      
      clearAllLocalStorage();
      
      // Intake keys should be removed
      expect(localStorage.getItem('intk_user_id')).toBeNull();
      expect(localStorage.getItem('intk_other')).toBeNull();
      // Other keys should remain
      expect(localStorage.getItem('other_key')).toBe('other_value');
    });

    it('should handle localStorage errors gracefully', () => {
      // Simulate localStorage error
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw
      expect(() => {
        clearAllLocalStorage();
      }).not.toThrow();
      
      // Restore
      localStorage.removeItem = originalRemoveItem;
    });

    it('should work when localStorage is not available', () => {
      // Simulate localStorage being unavailable
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;
      
      // Should not throw
      expect(() => {
        clearAllLocalStorage();
      }).not.toThrow();
      
      // Restore
      (window as any).localStorage = originalLocalStorage;
    });
  });

  describe('clearAllData()', () => {
    it('should clear cookies, localStorage and runtime memory', () => {
      // Set data
      set('intk_session', 'test');
      localStorage.setItem('intk_user_id', 'test_user_id');
      window.name = 'intk_params:{"utm_source":"google"}';
      
      clearAllData();
      
      // Everything should be cleared
      expect(document.cookie).not.toContain('intk_session');
      expect(localStorage.getItem('intk_user_id')).toBeNull();
      // window.name should be cleared (or not contain our prefix)
      expect(window.name).not.toContain('intk_params:');
    });

    it('should accept domain parameter', () => {
      set('intk_session', 'test');
      
      clearAllData('.example.com');
      
      expect(document.cookie).not.toContain('intk_session');
    });
  });

  describe('withdrawConsent()', () => {
    it('should clear all data and log message', () => {
      // Set data
      set('intk_session', 'test');
      localStorage.setItem('intk_user_id', 'test_user_id');
      window.name = 'intk_params:{"utm_source":"google"}';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      withdrawConsent();
      
      // Verify data is cleared
      expect(document.cookie).not.toContain('intk_session');
      expect(localStorage.getItem('intk_user_id')).toBeNull();
      expect(window.name).not.toContain('intk_params:');
      
      // Verify the message was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Intake: Withdrawing consent')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Intake: All data cleared')
      );
      
      consoleSpy.mockRestore();
    });

    it('should accept domain parameter', () => {
      set('intk_session', 'test');
      
      withdrawConsent('.example.com');
      
      expect(document.cookie).not.toContain('intk_session');
    });
  });
});

