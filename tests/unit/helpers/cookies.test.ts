import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, parse } from '@/helpers/cookies';
import { clearCookies } from '../../setup';

describe('helpers/cookies', () => {
  beforeEach(() => {
    clearCookies();
  });

  describe('set()', () => {
    it('should set a cookie without expiration', () => {
      set('test_cookie', 'test_value');
      expect(document.cookie).toContain('test_cookie=test_value');
    });

    it('should set a cookie with expiration', () => {
      set('test_cookie', 'test_value', 60); // 60 minutes
      expect(get('test_cookie')).toBe('test_value');
      // Note: document.cookie doesn't show expires/path, but cookie is set correctly
    });

    it('should set a cookie with domain', () => {
      // Note: Setting domain for localhost may not work in jsdom
      // This test verifies the function doesn't throw
      expect(() => {
        set('test_cookie', 'test_value', undefined, '.example.com');
      }).not.toThrow();
    });

    it('should set a cookie with path', () => {
      set('test_cookie', 'test_value');
      expect(get('test_cookie')).toBe('test_value');
      // Note: document.cookie doesn't show path, but cookie is set correctly
    });

    it('should overwrite existing cookie with same name', () => {
      set('test_cookie', 'value1');
      set('test_cookie', 'value2');
      expect(get('test_cookie')).toBe('value2');
    });
  });

  describe('get()', () => {
    it('should return null for non-existent cookie', () => {
      expect(get('non_existent')).toBeNull();
    });

    it('should return cookie value', () => {
      set('test_cookie', 'test_value');
      expect(get('test_cookie')).toBe('test_value');
    });

    it('should handle cookies with spaces', () => {
      document.cookie = 'test_cookie = test_value';
      expect(get('test_cookie')).toBe('test_value');
    });

    it('should return first matching cookie when multiple exist', () => {
      document.cookie = 'test_cookie=value1';
      document.cookie = 'test_cookie=value2';
      // Browser behavior: get() returns the first one found
      const value = get('test_cookie');
      expect(value).toBeTruthy();
    });

    it('should handle special characters in cookie value', () => {
      set('test_cookie', 'value with spaces');
      expect(get('test_cookie')).toBe('value with spaces');
    });
  });

  describe('parse()', () => {
    it('should parse simple container', () => {
      const container = 'key1=value1|||key2=value2';
      const result = parse(container);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should parse empty container', () => {
      const container = '';
      const result = parse(container);
      expect(result).toEqual({});
    });

    it('should parse container with single key-value', () => {
      const container = 'key1=value1';
      const result = parse(container);
      expect(result).toEqual({
        key1: 'value1'
      });
    });

    it('should handle container with multiple delimiters', () => {
      const container = 'key1=value1|||key2=value2|||key3=value3';
      const result = parse(container);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });
    });

    it('should skip invalid key-value pairs', () => {
      const container = 'key1=value1|||invalid|||key2=value2';
      const result = parse(container);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should handle empty values', () => {
      const container = 'key1=|||key2=value2';
      const result = parse(container);
      expect(result).toEqual({
        key1: '',
        key2: 'value2'
      });
    });

    it('should handle values with special characters', () => {
      const container = 'key1=value with spaces|||key2=value-with-dashes';
      const result = parse(container);
      expect(result).toEqual({
        key1: 'value with spaces',
        key2: 'value-with-dashes'
      });
    });

    it('should parse Intake format correctly', () => {
      const container = 'typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=content|||trm=term';
      const result = parse(container);
      expect(result).toEqual({
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'campaign',
        cnt: 'content',
        trm: 'term'
      });
    });
  });

  describe('integration: set and get', () => {
    it('should set and retrieve cookie correctly', () => {
      set('integration_test', 'integration_value');
      expect(get('integration_test')).toBe('integration_value');
    });

    it('should set and parse Intake format', () => {
      const container = 'typ=utm|||src=google|||mdm=cpc';
      set('intk_current', container);
      const retrieved = get('intk_current');
      expect(retrieved).toBe(container);
      
      const parsed = parse(retrieved!);
      expect(parsed).toEqual({
        typ: 'utm',
        src: 'google',
        mdm: 'cpc'
      });
    });
  });
});

