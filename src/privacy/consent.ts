import type { ConsentStatus, ConsentModeConfig } from '../types';

/**
 * @fileoverview Legacy gtag-based consent detection (DEPRECATED)
 * 
 * This module provides legacy consent detection using Google's gtag('consent', 'get', ...) API.
 * 
 * ⚠️ DEPRECATION NOTICE:
 * This approach has a race condition problem where gtag may exist but the CMP
 * hasn't initialized the consent values yet. The new recommended approach is
 * to use the DataLayer Event Listener from `consent-listener.ts`.
 * 
 * The DataLayer listener intercepts dataLayer.push() and captures consent events
 * from ANY CMP (OneTrust, Cookiebot, Axeptio, etc.) without polling or race conditions.
 * 
 * This module is kept for backward compatibility and as a fallback mechanism.
 * 
 * @see consent-listener.ts for the new event-driven approach
 * @see consent-parsers.ts for built-in CMP event patterns
 */

/**
 * Google Consent Mode v2 gtag function type
 */
declare global {
  interface Window {
    gtag?: (
      command: 'consent',
      action: 'get',
      params: {
        [key: string]: (status: 'granted' | 'denied') => void;
      }
    ) => void;
  }
}

/**
 * Default consent status when Consent Mode is not available
 */
const DEFAULT_CONSENT_STATUS: ConsentStatus = {
  analytics_storage: 'denied',
  ad_storage: 'denied'
};

/**
 * Default timeout for waiting for gtag to load (in milliseconds)
 */
const DEFAULT_GTAG_WAIT_TIMEOUT = 3000;

/**
 * Polling interval for checking gtag availability (in milliseconds)
 */
const GTAG_POLLING_INTERVAL = 100;

/**
 * @deprecated Use DataLayer listener instead (consent-listener.ts)
 * 
 * Waits for window.gtag to become available.
 * This function polls for gtag availability, which may not capture
 * the actual consent values if the CMP hasn't initialized yet.
 * 
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves to true if gtag is available, false if timeout
 */
export function waitForGtag(timeout: number = DEFAULT_GTAG_WAIT_TIMEOUT): Promise<boolean> {
  return new Promise((resolve) => {
    // If gtag is already available, resolve immediately
    if (typeof window !== 'undefined' && window.gtag) {
      resolve(true);
      return;
    }

    // If we're not in a browser environment, resolve false
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const startTime = Date.now();
    
    const checkGtag = () => {
      // Check if gtag is now available
      if (window.gtag) {
        resolve(true);
        return;
      }

      // Check if we've exceeded the timeout
      if (Date.now() - startTime >= timeout) {
        resolve(false);
        return;
      }

      // Continue polling
      setTimeout(checkGtag, GTAG_POLLING_INTERVAL);
    };

    // Start polling
    checkGtag();
  });
}

/**
 * @deprecated Use DataLayer listener instead (consent-listener.ts)
 * 
 * Gets consent status from Google Consent Mode v2 using gtag('consent', 'get', ...).
 * 
 * ⚠️ WARNING: This function has a race condition issue.
 * Even if gtag is available, the CMP may not have initialized the consent values yet.
 * The function may return default values instead of actual user consent.
 * 
 * For reliable consent detection, use the DataLayer listener approach:
 * @see createDataLayerInterceptor from consent-listener.ts
 * 
 * @param defaultConsent - Default consent status if Consent Mode is not available
 * @param waitForGtagTimeout - Maximum time to wait for gtag to load (default: 3000ms)
 * @returns Promise that resolves to ConsentStatus
 */
export async function getConsentStatus(
  defaultConsent: 'granted' | 'denied' = 'denied',
  waitForGtagTimeout: number = DEFAULT_GTAG_WAIT_TIMEOUT
): Promise<ConsentStatus> {
  // Wait for gtag to become available
  const gtagAvailable = await waitForGtag(waitForGtagTimeout);
  
  // If gtag is not available after waiting, use default
  if (!gtagAvailable || typeof window === 'undefined' || !window.gtag) {
    const status: ConsentStatus = {
      analytics_storage: defaultConsent,
      ad_storage: defaultConsent
    };
    return status;
  }

  // Try to get consent status from Consent Mode v2
  return new Promise((resolve) => {
    try {
      let analyticsStatus: 'granted' | 'denied' = defaultConsent;
      let adStatus: 'granted' | 'denied' = defaultConsent;
      let resolved = false;

      // Timeout to prevent hanging if Consent Mode doesn't respond
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            analytics_storage: analyticsStatus,
            ad_storage: adStatus
          });
        }
      }, 1000); // 1 second timeout for consent response

      window.gtag('consent', 'get', {
        'analytics_storage': (status: 'granted' | 'denied') => {
          analyticsStatus = status;
          if (resolved) return;
          // Check if we have both statuses (both callbacks were called)
          // We need to check if adStatus was already set (not default) or if both are now set
          if (adStatus !== defaultConsent && analyticsStatus !== defaultConsent) {
            clearTimeout(timeout);
            resolved = true;
            resolve({
              analytics_storage: analyticsStatus,
              ad_storage: adStatus
            });
          }
        },
        'ad_storage': (status: 'granted' | 'denied') => {
          adStatus = status;
          if (resolved) return;
          // Check if we have both statuses (both callbacks were called)
          if (analyticsStatus !== defaultConsent && adStatus !== defaultConsent) {
            clearTimeout(timeout);
            resolved = true;
            resolve({
              analytics_storage: analyticsStatus,
              ad_storage: adStatus
            });
          }
        }
      });

      // If both callbacks were called synchronously (unlikely but possible)
      // or if default consent is used, resolve immediately
      setTimeout(() => {
        if (!resolved) {
          clearTimeout(timeout);
          resolved = true;
          resolve({
            analytics_storage: analyticsStatus,
            ad_storage: adStatus
          });
        }
      }, 0);
    } catch (error) {
      // Error accessing Consent Mode, use default
      console.warn('Intake: Error reading Consent Mode, using default:', error);
      resolve({
        analytics_storage: defaultConsent,
        ad_storage: defaultConsent
      });
    }
  });
}

/**
 * Checks if consent is granted for analytics storage.
 * This is the primary check for Intake data collection.
 * 
 * @param consentStatus - Consent status to check
 * @returns true if analytics_storage is granted
 */
export function checkConsent(consentStatus: ConsentStatus): boolean {
  return consentStatus.analytics_storage === 'granted';
}

/**
 * @deprecated Use DataLayer listener instead (consent-listener.ts)
 * 
 * Gets consent status synchronously (for immediate use).
 * Falls back to default if Consent Mode is not available.
 * 
 * ⚠️ WARNING: Synchronous consent reading is unreliable.
 * The CMP may not have initialized consent values when this is called.
 * 
 * @param defaultConsent - Default consent status if Consent Mode is not available
 * @returns ConsentStatus (may be default if Consent Mode not available)
 */
export function getConsentStatusSync(
  defaultConsent: 'granted' | 'denied' = 'denied'
): ConsentStatus {
  // Check if gtag is available
  if (typeof window === 'undefined' || !window.gtag) {
    return {
      analytics_storage: defaultConsent,
      ad_storage: defaultConsent
    };
  }

  // Try synchronous approach (may not work if Consent Mode hasn't initialized)
  // This is a best-effort synchronous check
  try {
    let analyticsStatus: 'granted' | 'denied' = defaultConsent;
    let adStatus: 'granted' | 'denied' = defaultConsent;
    let analyticsReceived = false;
    let adReceived = false;

    // Attempt to get consent status
    // Note: This may not work synchronously if Consent Mode hasn't initialized
    window.gtag('consent', 'get', {
      'analytics_storage': (status: 'granted' | 'denied') => {
        analyticsStatus = status;
        analyticsReceived = true;
      },
      'ad_storage': (status: 'granted' | 'denied') => {
        adStatus = status;
        adReceived = true;
      }
    });

    // If we got both statuses synchronously (unlikely), return them
    // Otherwise return default (will be updated asynchronously)
    return {
      analytics_storage: analyticsStatus,
      ad_storage: adStatus
    };
  } catch (error) {
    // Error accessing Consent Mode, use default
    return {
      analytics_storage: defaultConsent,
      ad_storage: defaultConsent
    };
  }
}

/**
 * Resolves consent mode configuration with defaults.
 * 
 * When consent_mode is disabled (or not configured), Intake operates in
 * "permissive" mode where all storage is allowed by default (traditional behavior).
 * 
 * When consent_mode is enabled, Intake operates in "privacy-first" mode
 * where consent defaults to denied until explicitly granted by the CMP.
 * 
 * @param config - User consent mode configuration
 * @returns Resolved configuration
 */
export function resolveConsentConfig(
  config?: ConsentModeConfig
): {
  enabled: boolean;
  defaultConsent: 'granted' | 'denied';
} {
  if (!config || !config.enabled) {
    // Consent mode disabled = traditional behavior, allow everything
    return {
      enabled: false,
      defaultConsent: 'granted'
    };
  }

  // Consent mode enabled = privacy-first, default to denied
  return {
    enabled: true,
    defaultConsent: config.default_consent || 'denied'
  };
}
