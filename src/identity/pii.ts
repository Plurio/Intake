/**
 * PII (Personally Identifiable Information) Collection & Hashing Module
 *
 * This module provides functions for normalizing and hashing PII data (email, phone)
 * using SHA-256 algorithm with fallback support.
 *
 * IMPORTANT: PII is NEVER stored in plain text. All data is hashed before storage.
 *
 * Hashing strategy:
 * 1. Try Web Crypto API (fast, native, preferred)
 * 2. Fallback to pure JavaScript SHA-256 implementation (for GTM compatibility)
 */

/**
 * Normalizes an email address
 * - Converts to lowercase
 * - Removes all whitespace (including within the string)
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().replace(/\s/g, '');
}

/**
 * Normalizes a phone number
 * - Keeps only digits
 * - Removes all non-digit characters
 */
export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

/**
 * Pure JavaScript SHA-256 implementation (fallback)
 * Based on standard SHA-256 algorithm, compatible with Web Crypto API output
 *
 * This is critical for GTM environments where Web Crypto API may be unavailable
 */
function sha256Fallback(message: string): string {
  // Right rotate function
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  // UTF-8 encoding
  function utf8Encode(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if ((code & 0xfc00) === 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
        // Surrogate pair
        code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
        bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return bytes;
  }

  // SHA-256 constants
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Encode message to bytes
  const messageBytes = utf8Encode(message);
  const originalBitLength = messageBytes.length * 8;

  // Padding
  messageBytes.push(0x80);
  while ((messageBytes.length % 64) !== 56) {
    messageBytes.push(0x00);
  }

  // Append length (64-bit big-endian)
  for (let i = 3; i >= 0; i--) {
    messageBytes.push(0);
  }
  for (let i = 3; i >= 0; i--) {
    messageBytes.push((originalBitLength >>> (i * 8)) & 0xff);
  }

  // Process message in 512-bit chunks
  for (let i = 0; i < messageBytes.length; i += 64) {
    const w = new Array(64);

    // Copy chunk into first 16 words
    for (let j = 0; j < 16; j++) {
      w[j] = (messageBytes[i + j * 4] << 24) |
             (messageBytes[i + j * 4 + 1] << 16) |
             (messageBytes[i + j * 4 + 2] << 8) |
             messageBytes[i + j * 4 + 3];
      w[j] = w[j] | 0; // Convert to signed 32-bit
    }

    // Extend the first 16 words into the remaining 48 words
    for (let j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    // Initialize working variables
    let a = h[0], b = h[1], c = h[2], d = h[3];
    let e = h[4], f = h[5], g = h[6], hh = h[7];

    // Main loop
    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    // Add the compressed chunk to the current hash value
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }

  // Produce the final hash value (big-endian)
  const result: string[] = [];
  for (let i = 0; i < h.length; i++) {
    result.push(((h[i] >>> 0).toString(16)).padStart(8, '0'));
  }
  return result.join('');
}

/**
 * Hashes a string using SHA-256
 *
 * Strategy:
 * 1. Try Web Crypto API (fast, native, preferred)
 * 2. Fallback to pure JavaScript implementation (for GTM compatibility)
 */
async function hashString(text: string): Promise<string> {
  if (!text || typeof text !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  // Try Web Crypto API first (preferred method)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      // Hash using SHA-256
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

      // Convert ArrayBuffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      // If Web Crypto API fails, fallback to pure JS implementation
      console.warn('Web Crypto API failed, using fallback SHA-256:', error);
    }
  }

  // Fallback: Pure JavaScript SHA-256 implementation
  // This is critical for GTM environments where Web Crypto API may be unavailable
  return sha256Fallback(text);
}

/**
 * Hashes an email address
 * - Normalizes the email before hashing
 * - Returns SHA-256 hash in hex format
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error('Email cannot be empty');
  }
  return hashString(normalized);
}

/**
 * Hashes a phone number
 * - Normalizes the phone number before hashing
 * - Returns SHA-256 hash in hex format
 */
export async function hashPhone(phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Phone cannot be empty');
  }
  return hashString(normalized);
}

/**
 * Validates an email address (basic check)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const normalized = normalizeEmail(email);
  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

/**
 * Validates a phone number (basic check)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  const normalized = normalizePhone(phone);
  // Check that at least 7 digits remain after normalization (minimum phone number length)
  return normalized.length >= 7 && normalized.length <= 15;
}
