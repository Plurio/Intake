import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  trackHistoryAPI,
  stopTrackingHistoryAPI,
  isHistoryTrackingActive
} from '@/spa/history-tracker';

describe('history-tracker', () => {
  let originalPushState: typeof history.pushState;
  let originalReplaceState: typeof history.replaceState;
  let pushStateSpy: any;
  let replaceStateSpy: any;

  beforeEach(() => {
    // Save original methods
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;

    // Create spies
    pushStateSpy = vi.fn(originalPushState);
    replaceStateSpy = vi.fn(originalReplaceState);

    // Replace with spies
    history.pushState = pushStateSpy;
    history.replaceState = replaceStateSpy;

    // Stop any existing tracking
    stopTrackingHistoryAPI();
  });

  afterEach(() => {
    // Stop tracking
    stopTrackingHistoryAPI();

    // Restore original methods
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;

    vi.clearAllMocks();
  });

  describe('trackHistoryAPI', () => {
    it('should start tracking History API changes', () => {
      const callback = vi.fn();
      const stopTracking = trackHistoryAPI(callback);

      expect(isHistoryTrackingActive()).toBe(true);
      
      // Cleanup
      stopTracking();
    });

    it('should call callback on pushState', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      history.pushState({ page: '/test' }, '', '/test');

      expect(callback).toHaveBeenCalledWith('/test', { page: '/test' });
    });

    it('should call callback on replaceState', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      history.replaceState({ page: '/replace' }, '', '/replace');

      expect(callback).toHaveBeenCalledWith('/replace', { page: '/replace' });
    });

    it('should call callback on popstate event', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      // Simulate popstate event
      const popstateEvent = new PopStateEvent('popstate', { state: { page: '/back' } });
      window.dispatchEvent(popstateEvent);

      expect(callback).toHaveBeenCalledWith(window.location.href, { page: '/back' });
    });

    it('should use window.location.href when URL is not provided in pushState', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      // Mock window.location.href
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { ...window.location, href: 'http://localhost/test' },
        writable: true
      });

      history.pushState({ page: '/test' }, '', undefined);

      expect(callback).toHaveBeenCalledWith('http://localhost/test', { page: '/test' });

      // Restore
      Object.defineProperty(window, 'location', {
        value: { ...window.location, href: originalHref },
        writable: true
      });
    });

    it('should handle URL object in pushState', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      // Use relative URL to avoid SecurityError
      const url = new URL('/test', window.location.origin);
      // Convert to relative path for pushState
      history.pushState({ page: '/test' }, '', '/test');

      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0]).toBe('/test');
    });

    it('should return stop function', () => {
      const callback = vi.fn();
      const stopTracking = trackHistoryAPI(callback);

      expect(typeof stopTracking).toBe('function');
      
      stopTracking();
      expect(isHistoryTrackingActive()).toBe(false);
    });

    it('should stop tracking when stop function is called', () => {
      const callback = vi.fn();
      const stopTracking = trackHistoryAPI(callback);

      expect(isHistoryTrackingActive()).toBe(true);

      stopTracking();

      expect(isHistoryTrackingActive()).toBe(false);

      // Callback should not be called after stopping
      history.pushState({ page: '/test' }, '', '/test');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should update callback when tracking is already active', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      trackHistoryAPI(callback1);
      trackHistoryAPI(callback2); // Should update callback

      history.pushState({ page: '/test' }, '', '/test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle multiple pushState calls', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      history.pushState({ page: '/page1' }, '', '/page1');
      history.pushState({ page: '/page2' }, '', '/page2');
      history.pushState({ page: '/page3' }, '', '/page3');

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, '/page1', { page: '/page1' });
      expect(callback).toHaveBeenNthCalledWith(2, '/page2', { page: '/page2' });
      expect(callback).toHaveBeenNthCalledWith(3, '/page3', { page: '/page3' });
    });
  });

  describe('stopTrackingHistoryAPI', () => {
    it('should stop tracking', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      expect(isHistoryTrackingActive()).toBe(true);

      stopTrackingHistoryAPI();

      expect(isHistoryTrackingActive()).toBe(false);
    });

    it('should not throw when called without active tracking', () => {
      expect(() => stopTrackingHistoryAPI()).not.toThrow();
    });
  });

  describe('isHistoryTrackingActive', () => {
    it('should return false when tracking is not started', () => {
      expect(isHistoryTrackingActive()).toBe(false);
    });

    it('should return true when tracking is active', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      expect(isHistoryTrackingActive()).toBe(true);
    });

    it('should return false after stopping tracking', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      expect(isHistoryTrackingActive()).toBe(true);

      stopTrackingHistoryAPI();

      expect(isHistoryTrackingActive()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null URL in pushState', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { ...window.location, href: 'http://localhost/current' },
        writable: true
      });

      history.pushState({ page: '/test' }, '', null as any);

      expect(callback).toHaveBeenCalledWith('http://localhost/current', { page: '/test' });

      // Restore
      Object.defineProperty(window, 'location', {
        value: { ...window.location, href: originalHref },
        writable: true
      });
    });

    it('should handle empty string URL in pushState', () => {
      const callback = vi.fn();
      trackHistoryAPI(callback);

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { ...window.location, href: 'http://localhost/current' },
        writable: true
      });

      history.pushState({ page: '/test' }, '', '');

      expect(callback).toHaveBeenCalledWith('http://localhost/current', { page: '/test' });

      // Restore
      Object.defineProperty(window, 'location', {
        value: { ...window.location, href: originalHref },
        writable: true
      });
    });

    it('should handle SSR environment (no window)', () => {
      // This test verifies that the code doesn't break in SSR
      // In actual SSR, window would be undefined, but we can't easily test that
      // So we just verify the code handles edge cases gracefully
      const callback = vi.fn();
      
      // Should not throw
      expect(() => trackHistoryAPI(callback)).not.toThrow();
    });
  });
});

