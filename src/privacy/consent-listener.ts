import type { ConsentStatus, ConsentListenerConfig } from '../types';
import { parseConsentFromDataLayerItem } from './consent-parsers';

/**
 * Global type declaration for dataLayer
 */
declare global {
  interface Window {
    dataLayer?: any[];
  }
}

/**
 * Tracks the last known consent status to detect changes
 */
let lastConsentStatus: ConsentStatus | null = null;

/**
 * Compares two consent statuses for equality
 */
function isConsentEqual(a: ConsentStatus | null, b: ConsentStatus | null): boolean {
  if (a === null || b === null) return a === b;
  return a.analytics_storage === b.analytics_storage && a.ad_storage === b.ad_storage;
}

/**
 * Creates a DataLayer interceptor that listens for consent events from any CMP.
 * 
 * This approach intercepts dataLayer.push() to capture consent events from:
 * - Google Tag Manager Consent Mode (gtag commands)
 * - OneTrust
 * - Cookiebot
 * - Axeptio
 * - Didomi
 * - Any other CMP that pushes to dataLayer
 * 
 * @param onConsentChange - Callback fired when consent status changes
 * @param config - Configuration for consent listener
 * @returns Cleanup function to restore original dataLayer.push
 * 
 * @example
 * ```typescript
 * const cleanup = createDataLayerInterceptor(
 *   (consent) => {
 *     console.log('Consent changed:', consent);
 *   },
 *   { enabled: true, default_consent: 'denied' }
 * );
 * 
 * // Later, to stop listening:
 * cleanup();
 * ```
 */
export function createDataLayerInterceptor(
  onConsentChange: (consent: ConsentStatus) => void,
  config: ConsentListenerConfig
): () => void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return () => {}; // No-op cleanup for SSR
  }

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  
  // Store original push method
  const originalPush = window.dataLayer.push.bind(window.dataLayer);
  
  /**
   * Process a single dataLayer item and fire callback if consent is found
   */
  const processItem = (item: any): void => {
    const consent = parseConsentFromDataLayerItem(item, config);
    if (consent && !isConsentEqual(consent, lastConsentStatus)) {
      lastConsentStatus = consent;
      onConsentChange(consent);
    }
  };
  
  // Override push to intercept all events
  window.dataLayer.push = function(...args: any[]): number {
    // Call original push first
    const result = originalPush(...args);
    
    // Check each pushed item for consent events
    args.forEach(item => {
      processItem(item);
    });
    
    return result;
  };
  
  // Also check existing dataLayer items (CMP may have loaded before Intake)
  // Process in order to get the latest consent state
  window.dataLayer.forEach(item => {
    const consent = parseConsentFromDataLayerItem(item, config);
    if (consent) {
      lastConsentStatus = consent;
    }
  });
  
  // If we found consent in existing items, fire the callback once with latest value
  if (lastConsentStatus) {
    onConsentChange(lastConsentStatus);
  }
  
  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push = originalPush;
    }
    lastConsentStatus = null;
  };
}

/**
 * Reads the current consent status from existing dataLayer items.
 * Useful for getting initial consent state without setting up a listener.
 * 
 * @param config - Configuration for consent parsing
 * @returns Current consent status or null if not found
 */
export function readConsentFromDataLayer(
  config: ConsentListenerConfig
): ConsentStatus | null {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return null;
  }
  
  let latestConsent: ConsentStatus | null = null;
  
  // Process all items to find the latest consent
  window.dataLayer.forEach((item) => {
    const consent = parseConsentFromDataLayerItem(item, config);
    if (consent) {
      latestConsent = consent;
    }
  });
  
  return latestConsent;
}

/**
 * Pushes a consent update to dataLayer (for testing or manual updates).
 * This will be picked up by the interceptor if active.
 * 
 * @param consent - Consent status to push
 */
export function pushConsentToDataLayer(consent: ConsentStatus): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'consent_update',
    analytics_storage: consent.analytics_storage,
    ad_storage: consent.ad_storage
  });
}

