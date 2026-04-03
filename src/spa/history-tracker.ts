/**
 * History API Tracker for SPA applications
 * 
 * Monitors History API changes (pushState, replaceState, popstate)
 * and dispatches events for virtual pageview handling
 */

type HistoryChangeCallback = (url: string, state?: any) => void;

let historyChangeCallback: HistoryChangeCallback | null = null;
let isTracking = false;

/**
 * Patches the History API to track changes
 */
function patchHistoryAPI(): void {
  if (typeof window === 'undefined' || typeof history === 'undefined') {
    return;
  }

  // Save original methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Patch pushState
  history.pushState = function(state: any, title: string, url?: string | URL | null) {
    const result = originalPushState.apply(history, [state, title, url]);
    
    if (isTracking && historyChangeCallback) {
      const newUrl = url ? String(url) : window.location.href;
      historyChangeCallback(newUrl, state);
    }
    
    return result;
  };

  // Patch replaceState
  history.replaceState = function(state: any, title: string, url?: string | URL | null) {
    const result = originalReplaceState.apply(history, [state, title, url]);
    
    if (isTracking && historyChangeCallback) {
      const newUrl = url ? String(url) : window.location.href;
      historyChangeCallback(newUrl, state);
    }
    
    return result;
  };

  // Track popstate event (back/forward navigation)
  window.addEventListener('popstate', (event) => {
    if (isTracking && historyChangeCallback) {
      historyChangeCallback(window.location.href, event.state);
    }
  });
}

/**
 * Starts tracking the History API
 * @param callback - Function called on history changes
 */
export function trackHistoryAPI(callback: HistoryChangeCallback): () => void {
  if (isTracking) {
    // Already tracking, just update the callback
    historyChangeCallback = callback;
    return () => {
      isTracking = false;
      historyChangeCallback = null;
    };
  }

  historyChangeCallback = callback;
  isTracking = true;
  
  // Patch History API
  patchHistoryAPI();
  
  // Return cleanup function to stop tracking
  return () => {
    isTracking = false;
    historyChangeCallback = null;
  };
}

/**
 * Stops tracking the History API
 */
export function stopTrackingHistoryAPI(): void {
  isTracking = false;
  historyChangeCallback = null;
}

/**
 * Checks if tracking is active
 */
export function isHistoryTrackingActive(): boolean {
  return isTracking;
}

