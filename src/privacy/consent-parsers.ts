import type { ConsentStatus, ConsentListenerConfig } from '../types';

/**
 * Global type declarations for CMP-specific objects
 */
declare global {
  interface Window {
    Cookiebot?: {
      consent?: {
        statistics?: boolean;
        marketing?: boolean;
        preferences?: boolean;
        necessary?: boolean;
      };
    };
    OneTrust?: {
      GetDomainData?: () => any;
    };
    Didomi?: {
      getUserConsentStatusForPurpose?: (purpose: string) => boolean;
    };
  }
}

/**
 * Parses consent from a dataLayer item.
 * Supports multiple formats: gtag commands, CMP events, and custom events.
 * 
 * @param item - The dataLayer item to parse
 * @param config - Configuration with custom event names and field mappings
 * @returns ConsentStatus or null if no consent found
 */
export function parseConsentFromDataLayerItem(
  item: any,
  config: ConsentListenerConfig
): ConsentStatus | null {
  if (item === null || item === undefined) {
    return null;
  }

  // Handle array format (gtag commands like ['consent', 'update', {...}])
  if (Array.isArray(item)) {
    return parseGtagCommand(item);
  }
  
  // Handle object format (CMP events like {event: 'OneTrustGroupsUpdated', ...})
  if (typeof item === 'object') {
    // Handle array-like objects (GTM stores gtag calls this way)
    // Format: { "0": "consent", "1": "update", "2": {...} }
    // This is how gtag() commands appear in dataLayer when inspected
    if ('0' in item && item['0'] === 'consent' && ('1' in item)) {
      const asArray = [item['0'], item['1'], item['2']];
      return parseGtagCommand(asArray);
    }
    
    // 1. Check for custom parser function
    if (config.custom_parser) {
      const customResult = config.custom_parser(item);
      if (customResult) {
        return customResult;
      }
    }
    
    // 2. Check for custom event names with field mapping
    if (config.event_names?.includes(item.event) && config.field_mapping) {
      return parseCustomEvent(item, config);
    }
    
    // 3. Try built-in CMP patterns
    return parseKnownCMPEvent(item);
  }
  
  return null;
}

/**
 * Parses gtag consent commands.
 * Format: ['consent', 'update'|'default', {analytics_storage: 'granted', ...}]
 * 
 * @param arr - Array representing gtag command
 * @returns ConsentStatus or null
 */
export function parseGtagCommand(arr: any[]): ConsentStatus | null {
  // Check for consent command format
  if (arr[0] === 'consent' && (arr[1] === 'update' || arr[1] === 'default')) {
    const consentData = arr[2];
    if (typeof consentData === 'object' && consentData !== null) {
      // Only return if at least one consent field is present
      if ('analytics_storage' in consentData || 'ad_storage' in consentData) {
        return {
          analytics_storage: consentData.analytics_storage || 'denied',
          ad_storage: consentData.ad_storage || 'denied'
        };
      }
    }
  }
  
  return null;
}

/**
 * Parses custom CMP events using field mapping from config.
 * 
 * @param item - DataLayer item with event property
 * @param config - Configuration with field_mapping
 * @returns ConsentStatus or null
 */
export function parseCustomEvent(
  item: any,
  config: ConsentListenerConfig
): ConsentStatus | null {
  const mapping = config.field_mapping;
  if (!mapping) {
    return null;
  }
  
  // Get consent values using field mapping
  const analyticsField = mapping.analytics_storage;
  const adField = mapping.ad_storage;
  
  let analyticsConsent: 'granted' | 'denied' = 'denied';
  let adConsent: 'granted' | 'denied' = 'denied';
  
  // Parse analytics consent
  if (analyticsField && analyticsField in item) {
    const value = item[analyticsField];
    analyticsConsent = parseBooleanOrString(value);
  }
  
  // Parse ad consent
  if (adField && adField in item) {
    const value = item[adField];
    adConsent = parseBooleanOrString(value);
  }
  
  return {
    analytics_storage: analyticsConsent,
    ad_storage: adConsent
  };
}

/**
 * Parses known CMP events with built-in patterns.
 * Supports: OneTrust, Cookiebot, Axeptio, Sirdata, Consentmo, Didomi, 
 * Termly, TrustArc, and generic patterns.
 * 
 * @param item - DataLayer item
 * @returns ConsentStatus or null
 */
export function parseKnownCMPEvent(item: any): ConsentStatus | null {
  const event = item.event;
  
  // === OneTrust ===
  // Event: OneTrustGroupsUpdated
  // Data: OptanonActiveGroups contains comma-separated group IDs like ",C0001,C0002,"
  // C0001 = Strictly Necessary, C0002 = Performance/Analytics, C0003 = Functional, C0004 = Targeting/Advertising
  if (event === 'OneTrustGroupsUpdated' || 'OptanonActiveGroups' in item) {
    const groups = item.OptanonActiveGroups || '';
    return {
      analytics_storage: groups.includes('C0002') ? 'granted' : 'denied',
      ad_storage: groups.includes('C0004') ? 'granted' : 'denied'
    };
  }
  
  // === Cookiebot ===
  // Events: CookiebotOnAccept, CookiebotOnDecline, CookiebotOnDialogDisplay
  // Data: CookieConsent object or window.Cookiebot.consent
  if (event === 'CookiebotOnAccept' || event === 'CookiebotOnDecline' || event === 'CookiebotOnLoad') {
    // Try to get consent from item first, then from global Cookiebot
    const consent = item.CookieConsent || 
      (typeof window !== 'undefined' && window.Cookiebot?.consent);
    
    if (consent) {
      return {
        analytics_storage: consent.statistics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied'
      };
    }
  }
  
  // === Axeptio ===
  // Event: consent.answer
  // Data: privacy_consent_value: 'full' | 'partial' | 'refusal'
  if (event === 'consent.answer') {
    const value = item.privacy_consent_value;
    return {
      analytics_storage: (value === 'full' || value === 'partial') ? 'granted' : 'denied',
      ad_storage: value === 'full' ? 'granted' : 'denied'
    };
  }
  
  // === Sirdata ===
  // Events: sirdataConsent, sirdataNoConsent
  if (event === 'sirdataConsent') {
    return {
      analytics_storage: 'granted',
      ad_storage: 'granted'
    };
  }
  if (event === 'sirdataNoConsent') {
    return {
      analytics_storage: 'denied',
      ad_storage: 'denied'
    };
  }
  
  // === Consentmo ===
  // Event: consent_status
  // Data: analytics: true/false, marketing: true/false
  if (event === 'consent_status') {
    return {
      analytics_storage: item.analytics ? 'granted' : 'denied',
      ad_storage: item.marketing ? 'granted' : 'denied'
    };
  }
  
  // === Didomi ===
  // Events: didomi:consent, Didomi.consent.changed
  // Data: purposes object with consent status
  if (event === 'didomi:consent' || event === 'Didomi.consent.changed') {
    // Didomi uses purpose-based consent
    const purposes = item.purposes || item.consent?.purposes || {};
    const vendors = item.vendors || item.consent?.vendors || {};
    
    // Common Didomi purpose IDs
    const analyticsGranted = purposes.analytics?.enabled || 
                             purposes.measure_content_performance?.enabled ||
                             purposes.analytics === true;
    const adsGranted = purposes.advertising?.enabled || 
                       purposes.create_ads_profile?.enabled ||
                       purposes.advertising === true;
    
    return {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: adsGranted ? 'granted' : 'denied'
    };
  }
  
  // === Termly ===
  // Event: termly_consent
  // Data: analytics: true/false, advertising: true/false
  if (event === 'termly_consent' || event === 'termly.consent') {
    return {
      analytics_storage: item.analytics ? 'granted' : 'denied',
      ad_storage: (item.advertising || item.marketing) ? 'granted' : 'denied'
    };
  }
  
  // === TrustArc / TrustE ===
  // Event: truste.consent.update
  // Data: consentDecision contains categories
  if (event === 'truste.consent.update' || event === 'TrustArcConsentUpdate') {
    const decision = item.consentDecision || item.consent || {};
    return {
      analytics_storage: (decision.analytics || decision.performance) ? 'granted' : 'denied',
      ad_storage: (decision.advertising || decision.targeting) ? 'granted' : 'denied'
    };
  }
  
  // === Quantcast Choice ===
  // Event: qc_cmp_consent_update
  if (event === 'qc_cmp_consent_update') {
    return {
      analytics_storage: item.analytics_consent ? 'granted' : 'denied',
      ad_storage: item.ad_consent ? 'granted' : 'denied'
    };
  }
  
  // === Iubenda ===
  // Event: iubenda_consent_given, iubenda_consent_rejected
  if (event === 'iubenda_consent_given') {
    const purposes = item.purposes || {};
    return {
      analytics_storage: purposes.measurement ? 'granted' : 'denied',
      ad_storage: purposes.marketing ? 'granted' : 'denied'
    };
  }
  if (event === 'iubenda_consent_rejected') {
    return {
      analytics_storage: 'denied',
      ad_storage: 'denied'
    };
  }
  
  // === Klaro ===
  // Event: klaro-consent
  if (event === 'klaro-consent' || event === 'klaroConsent') {
    const services = item.services || item.consent || {};
    return {
      analytics_storage: services.analytics ? 'granted' : 'denied',
      ad_storage: (services.advertising || services.marketing) ? 'granted' : 'denied'
    };
  }
  
  // === Generic consent_update event ===
  // Many CMPs push a generic consent_update event
  if (event === 'consent_update' || event === 'consent_changed' || event === 'consent.update') {
    // Check for direct analytics_storage/ad_storage fields
    if ('analytics_storage' in item || 'ad_storage' in item) {
      return {
        analytics_storage: parseBooleanOrString(item.analytics_storage),
        ad_storage: parseBooleanOrString(item.ad_storage)
      };
    }
    
    // Check for common field names
    if ('analytics' in item || 'statistics' in item || 
        'marketing' in item || 'advertising' in item) {
      return {
        analytics_storage: parseBooleanOrString(item.analytics || item.statistics),
        ad_storage: parseBooleanOrString(item.marketing || item.advertising)
      };
    }
  }
  
  // === Generic patterns (without specific event name) ===
  // Check if item has consent-like properties directly
  if ('analytics_storage' in item && 'ad_storage' in item && !event) {
    return {
      analytics_storage: parseBooleanOrString(item.analytics_storage),
      ad_storage: parseBooleanOrString(item.ad_storage)
    };
  }
  
  return null;
}

/**
 * Helper function to parse boolean or string consent values.
 * Handles various formats: true/false, 'granted'/'denied', 'true'/'false', 1/0
 * 
 * @param value - The value to parse
 * @returns 'granted' or 'denied'
 */
function parseBooleanOrString(value: any): 'granted' | 'denied' {
  if (value === true || value === 'granted' || value === 'true' || value === 1 || value === '1') {
    return 'granted';
  }
  return 'denied';
}

/**
 * List of all known consent event names for documentation and filtering.
 */
export const KNOWN_CONSENT_EVENTS = [
  // GTM Consent Mode
  'consent',
  
  // OneTrust
  'OneTrustGroupsUpdated',
  'OptanonWrapper',
  
  // Cookiebot
  'CookiebotOnAccept',
  'CookiebotOnDecline',
  'CookiebotOnLoad',
  'CookiebotOnDialogDisplay',
  
  // Axeptio
  'consent.answer',
  
  // Sirdata
  'sirdataConsent',
  'sirdataNoConsent',
  
  // Consentmo
  'consent_status',
  
  // Didomi
  'didomi:consent',
  'Didomi.consent.changed',
  
  // Termly
  'termly_consent',
  'termly.consent',
  
  // TrustArc
  'truste.consent.update',
  'TrustArcConsentUpdate',
  
  // Quantcast
  'qc_cmp_consent_update',
  
  // Iubenda
  'iubenda_consent_given',
  'iubenda_consent_rejected',
  
  // Klaro
  'klaro-consent',
  'klaroConsent',
  
  // Generic
  'consent_update',
  'consent_changed',
  'consent.update'
];

