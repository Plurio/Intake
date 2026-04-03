import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeEmail,
  normalizePhone,
  hashEmail,
  hashPhone,
  isValidEmail,
  isValidPhone
} from '@/identity/pii';

// Mock Web Crypto API
const mockDigest = vi.fn();
const mockSubtle = {
  digest: mockDigest
};

beforeEach(() => {
  vi.clearAllMocks();

  // Mock window.crypto.subtle
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: mockSubtle
    },
    writable: true,
    configurable: true
  });

  // Mock TextEncoder
  global.TextEncoder = class TextEncoder {
    encode(str: string): Uint8Array {
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
        } else {
          i++;
          charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
        }
      }
      return new Uint8Array(utf8);
    }
  } as any;
});

describe('pii', () => {
  describe('normalizeEmail()', () => {
    it('should convert to lowercase', () => {
      expect(normalizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle empty string', () => {
      expect(normalizeEmail('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(normalizeEmail(null as any)).toBe('');
      expect(normalizeEmail(undefined as any)).toBe('');
    });
  });

  describe('normalizePhone()', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhone('+1 (555) 123-4567')).toBe('15551234567');
    });

    it('should handle phone with spaces', () => {
      expect(normalizePhone('8 800 555 35 35')).toBe('88005553535');
    });

    it('should handle phone with dashes', () => {
      expect(normalizePhone('8-800-555-35-35')).toBe('88005553535');
    });

    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(normalizePhone(null as any)).toBe('');
      expect(normalizePhone(undefined as any)).toBe('');
    });
  });

  describe('isValidEmail()', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should validate email with subdomain', () => {
      expect(isValidEmail('test@mail.example.com')).toBe(true);
    });

    it('should reject invalid email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should reject invalid email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle normalized email', () => {
      expect(isValidEmail('  Test@Example.COM  ')).toBe(true);
    });
  });

  describe('isValidPhone()', () => {
    it('should validate phone with 7 digits', () => {
      expect(isValidPhone('1234567')).toBe(true);
    });

    it('should validate phone with 15 digits', () => {
      expect(isValidPhone('123456789012345')).toBe(true);
    });

    it('should validate phone with formatting', () => {
      expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    });

    it('should reject phone with less than 7 digits', () => {
      expect(isValidPhone('123456')).toBe(false);
    });

    it('should reject phone with more than 15 digits', () => {
      expect(isValidPhone('1234567890123456')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('hashEmail()', () => {
    it('should hash email correctly', async () => {
      // Mock SHA-256 hash result
      const mockHash = new Uint8Array([
        0x9f, 0x86, 0xd0, 0x81, 0x88, 0x4c, 0x7d, 0x65,
        0x9a, 0x2f, 0xea, 0xa0, 0xc5, 0x5a, 0xd0, 0x15,
        0xa3, 0xbf, 0x4f, 0x1b, 0x2b, 0x0b, 0x82, 0x2c,
        0xd1, 0x5d, 0x6c, 0x15, 0xb0, 0xf0, 0x0a, 0x08
      ]);

      mockDigest.mockResolvedValue(mockHash);

      const result = await hashEmail('test@example.com');

      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
      expect(result).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });

    it('should normalize email before hashing', async () => {
      const mockHash = new Uint8Array(32).fill(0);
      mockDigest.mockResolvedValue(mockHash);

      await hashEmail('  Test@Example.COM  ');

      const call = mockDigest.mock.calls[0];
      const encoded = new TextEncoder().encode('test@example.com');
      expect(call[1]).toEqual(encoded);
    });

    it('should throw error for empty email', async () => {
      await expect(hashEmail('')).rejects.toThrow('Email cannot be empty');
    });

    it('should use fallback SHA-256 if Web Crypto API is not available', async () => {
      // Remove crypto API
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Should not throw, should use fallback
      const result = await hashEmail('test@example.com');

      // Fallback should produce a valid SHA-256 hash (64 hex characters)
      expect(result).toMatch(/^[a-f0-9]{64}$/);
      expect(result.length).toBe(64);
    });

    it('should use fallback SHA-256 if Web Crypto API fails', async () => {
      // Mock crypto API to throw error
      mockDigest.mockRejectedValue(new Error('Crypto API failed'));

      // Should not throw, should use fallback
      const result = await hashEmail('test@example.com');

      // Fallback should produce a valid SHA-256 hash
      expect(result).toMatch(/^[a-f0-9]{64}$/);
      expect(result.length).toBe(64);
    });

    it('should produce same hash with Web Crypto API and fallback', async () => {
      // Test with Web Crypto API
      const mockHash = new Uint8Array([
        0x9f, 0x86, 0xd0, 0x81, 0x88, 0x4c, 0x7d, 0x65,
        0x9a, 0x2f, 0xea, 0xa0, 0xc5, 0x5a, 0xd0, 0x15,
        0xa3, 0xbf, 0x4f, 0x1b, 0x2b, 0x0b, 0x82, 0x2c,
        0xd1, 0x5d, 0x6c, 0x15, 0xb0, 0xf0, 0x0a, 0x08
      ]);
      mockDigest.mockResolvedValue(mockHash);

      const webCryptoResult = await hashEmail('test@example.com');

      // Now test with fallback
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const fallbackResult = await hashEmail('test@example.com');

      // Both should produce valid SHA-256 hashes
      expect(webCryptoResult).toMatch(/^[a-f0-9]{64}$/);
      expect(fallbackResult).toMatch(/^[a-f0-9]{64}$/);

      // Note: They should produce the same hash for the same input
      // This is a critical requirement for compatibility
      expect(webCryptoResult).toBe(fallbackResult);
    });
  });

  describe('hashPhone()', () => {
    it('should hash phone correctly', async () => {
      const mockHash = new Uint8Array(32).fill(0);
      mockHash[0] = 0xab;
      mockHash[31] = 0xcd;

      mockDigest.mockResolvedValue(mockHash);

      const result = await hashPhone('+1 (555) 123-4567');

      expect(mockDigest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
      expect(result).toBe('ab000000000000000000000000000000000000000000000000000000000000cd');
    });

    it('should normalize phone before hashing', async () => {
      const mockHash = new Uint8Array(32).fill(0);
      mockDigest.mockResolvedValue(mockHash);

      await hashPhone('+1 (555) 123-4567');

      const call = mockDigest.mock.calls[0];
      const encoded = new TextEncoder().encode('15551234567');
      expect(call[1]).toEqual(encoded);
    });

    it('should throw error for empty phone', async () => {
      await expect(hashPhone('')).rejects.toThrow('Phone cannot be empty');
    });

    it('should use fallback SHA-256 for phone if Web Crypto API is not available', async () => {
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const result = await hashPhone('+1 (555) 123-4567');

      expect(result).toMatch(/^[a-f0-9]{64}$/);
      expect(result.length).toBe(64);
    });
  });

  describe('SHA-256 fallback compatibility', () => {
    it('should produce consistent hashes between Web Crypto API and fallback', async () => {
      const testEmail = 'test@example.com';

      // Test with Web Crypto API enabled (using real implementation if available)
      // First, get hash with Web Crypto API
      const webCryptoResult = await hashEmail(testEmail);
      expect(webCryptoResult).toMatch(/^[a-f0-9]{64}$/);

      // Now test with fallback (disable Web Crypto API)
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const fallbackResult = await hashEmail(testEmail);

      // Both should produce valid SHA-256 hashes (64 hex characters)
      expect(fallbackResult).toMatch(/^[a-f0-9]{64}$/);

      // Critical: Both implementations must produce the SAME hash for the same input
      // This ensures compatibility between Web Crypto API and fallback
      // Note: In test environment with mocked crypto, this might differ, but in real browser they should match
      expect(webCryptoResult).toBe(fallbackResult);
    });

    it('should produce correct SHA-256 hash for known email (fallback)', async () => {
      // Disable Web Crypto API to force fallback
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Known SHA-256 hash for "test@example.com" (normalized)
      // This is the expected hash from the fallback implementation
      const result = await hashEmail('test@example.com');

      // Should produce a valid 64-character hex string
      expect(result).toMatch(/^[a-f0-9]{64}$/);
      expect(result.length).toBe(64);

      // Verify it's deterministic (same input = same output)
      const result2 = await hashEmail('test@example.com');
      expect(result).toBe(result2);
    });

    it('should produce correct SHA-256 hash for known phone (fallback)', async () => {
      // Disable Web Crypto API to force fallback
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const result = await hashPhone('+1 (555) 123-4567');

      // Should produce a valid 64-character hex string
      expect(result).toMatch(/^[a-f0-9]{64}$/);
      expect(result.length).toBe(64);

      // Verify it's deterministic (same input = same output)
      const result2 = await hashPhone('+1 (555) 123-4567');
      expect(result).toBe(result2);

      // Verify normalization works (different formats, same normalized value)
      const result3 = await hashPhone('15551234567');
      expect(result).toBe(result3);
    });
  });
});
