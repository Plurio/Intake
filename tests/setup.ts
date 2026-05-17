// Vitest setup file
// This file runs before all tests

// Mock window.location and document for tests
import { vi } from 'vitest';

// Setup jsdom environment
// Vitest automatically sets up jsdom, but we can add custom setup here

// Helper to mock window.location
export function mockLocation(url: string) {
  delete (window as any).location;
  (window as any).location = new URL(url);
}

// Helper to mock document.referrer
export function mockReferrer(referrer: string) {
  Object.defineProperty(document, 'referrer', {
    writable: true,
    value: referrer
  });
}

// Capture the default jsdom user agent so beforeEach can restore it
const DEFAULT_USER_AGENT = navigator.userAgent;

// Helper to mock navigator.userAgent
export function mockUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: ua
  });
}

// Helper to clear all cookies
export function clearCookies() {
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  });
}

// Clean up before each test
beforeEach(() => {
  clearCookies();
  mockLocation('http://localhost/');
  mockReferrer('');
  mockUserAgent(DEFAULT_USER_AGENT);
});

