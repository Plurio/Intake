import type { 
  AnalyticsIds, 
  AnalyticsIdsConfig,
  GoogleAnalyticsConfig,
  AmplitudeConfig,
  CustomAnalyticsConfig
} from '../types';
import { get, set, parse } from '../helpers/cookies';

const DELIMITER = '|||';
const COOKIE_NAME = 'intk_analytics_ids';

// Default cookie names and patterns
const DEFAULT_GA_COOKIE = '_ga';
const DEFAULT_GA_CLIENT_ID_PATTERN = /^GA1\.\d+\.(.+)$/;
const DEFAULT_GA_SESSION_PATTERN = /^_ga_[A-Z0-9]+$/;
const DEFAULT_AMPLITUDE_PATTERN = /^amp_[A-Z0-9]+$/;
const DEFAULT_MIXPANEL_COOKIE = 'distinct_id';

/**
 * Packs AnalyticsIds into a string for cookie storage
 */
export function packAnalyticsIds(analyticsIds: AnalyticsIds): string {
  const parts: string[] = [];
  
  for (const [key, value] of Object.entries(analyticsIds)) {
    if (value && value.trim()) {
      parts.push(`${key}=${value}`);
    }
  }
  
  return parts.join(DELIMITER);
}

/**
 * Parses a cookie string into AnalyticsIds
 */
export function parseAnalyticsIds(cookieValue: string | null): AnalyticsIds {
  if (!cookieValue) {
    return {};
  }
  
  const data = parse(cookieValue);
  const analyticsIds: AnalyticsIds = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && value.trim()) {
      analyticsIds[key] = value;
    }
  }
  
  return analyticsIds;
}

/**
 * Gets current analytics IDs from cookie
 */
export function getAnalyticsIds(): AnalyticsIds {
  const cookieValue = get(COOKIE_NAME);
  return parseAnalyticsIds(cookieValue);
}

/**
 * Extracts Client ID from Google Analytics _ga cookie
 * Format: GA1.2.CLIENT_ID or GA1.2.3.CLIENT_ID
 */
function extractGAClientId(cookieValue: string, pattern?: string): string | null {
  if (!cookieValue) {
    return null;
  }
  
  const regex = pattern 
    ? new RegExp(pattern)
    : DEFAULT_GA_CLIENT_ID_PATTERN;
  
  const match = cookieValue.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Finds all cookies matching a pattern
 */
function findCookiesByPattern(pattern: RegExp | string): Array<{ name: string; value: string }> {
  const cookies: Array<{ name: string; value: string }> = [];
  const cookieString = document.cookie;
  
  if (!cookieString) {
    return cookies;
  }
  
  const regex = typeof pattern === 'string' 
    ? new RegExp('^' + pattern.replace(/\*/g, '[A-Za-z0-9_]+') + '$')
    : pattern;
  
  const parts = cookieString.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;
    
    const name = trimmed.substring(0, equalIndex);
    const value = trimmed.substring(equalIndex + 1);
    
    if (regex.test(name)) {
      cookies.push({ name, value });
    }
  }
  
  return cookies;
}

/**
 * Collects Google Analytics IDs
 */
function collectGoogleAnalytics(
  config: GoogleAnalyticsConfig | boolean | undefined,
  existingIds: AnalyticsIds
): AnalyticsIds {
  const ids: AnalyticsIds = { ...existingIds };
  
  // If config is false or not specified, skip
  if (config === false) {
    return ids;
  }
  
  // Use default settings if config === true or undefined
  const gaConfig = config === true || !config
    ? { cookie_name: DEFAULT_GA_COOKIE }
    : config;
  
  const cookieName = gaConfig.cookie_name || DEFAULT_GA_COOKIE;
  const clientIdPattern = gaConfig.client_id_pattern;
  
  // Collect Client ID from _ga cookie
  const gaCookie = get(cookieName);
  if (gaCookie) {
    const clientId = extractGAClientId(gaCookie, clientIdPattern);
    if (clientId) {
      ids.ga_client_id = clientId;
    }
  }
  
  // Collect Session ID from _ga_* cookies
  const sessionPattern = gaConfig.session_cookie_pattern || DEFAULT_GA_SESSION_PATTERN.source;
  const sessionCookies = findCookiesByPattern(sessionPattern);
  
  // Take the first found _ga_* cookie (usually the Session ID)
  if (sessionCookies.length > 0) {
    // Session ID is usually in format: GS1.1.SESSION_ID.TIMESTAMP
    const sessionValue = sessionCookies[0].value;
    const sessionMatch = sessionValue.match(/^GS1\.\d+\.(.+?)\./);
    if (sessionMatch && sessionMatch[1]) {
      ids.ga_session_id = sessionMatch[1];
    } else {
      // If format is non-standard, store value as-is
      ids.ga_session_id = sessionValue;
    }
  }
  
  return ids;
}

/**
 * Collects Amplitude ID
 */
function collectAmplitude(
  config: AmplitudeConfig | boolean | undefined,
  existingIds: AnalyticsIds
): AnalyticsIds {
  const ids: AnalyticsIds = { ...existingIds };
  
  if (config === false) {
    return ids;
  }
  
  // Find all amp_* cookies
  const amplitudeCookies = findCookiesByPattern(DEFAULT_AMPLITUDE_PATTERN);
  
  if (amplitudeCookies.length > 0) {
    // Take the first found amp_* cookie
    // Usually just the ID value
    ids.amplitude_id = amplitudeCookies[0].value;
  }
  
  return ids;
}

/**
 * Collects Mixpanel ID
 */
function collectMixpanel(
  enabled: boolean | undefined,
  existingIds: AnalyticsIds
): AnalyticsIds {
  const ids: AnalyticsIds = { ...existingIds };
  
  if (enabled === false) {
    return ids;
  }
  
  const mixpanelCookie = get(DEFAULT_MIXPANEL_COOKIE);
  if (mixpanelCookie) {
    ids.mixpanel_id = mixpanelCookie;
  }
  
  return ids;
}

/**
 * Collects custom analytics IDs
 */
function collectCustom(
  customConfigs: CustomAnalyticsConfig[] | undefined,
  existingIds: AnalyticsIds
): AnalyticsIds {
  const ids: AnalyticsIds = { ...existingIds };
  
  if (!customConfigs || customConfigs.length === 0) {
    return ids;
  }
  
  for (const customConfig of customConfigs) {
    const { name, cookie_name, pattern } = customConfig;
    
    if (!name || !cookie_name) {
      continue;
    }
    
    // If cookie_name contains *, search by pattern
    if (cookie_name.includes('*')) {
      const cookies = findCookiesByPattern(cookie_name);
      if (cookies.length > 0) {
        let value = cookies[0].value;
        
        // Apply pattern for ID extraction if specified
        if (pattern) {
          const regex = new RegExp(pattern);
          const match = value.match(regex);
          if (match && match[1]) {
            value = match[1];
          }
        }
        
        ids[name] = value;
      }
    } else {
      // Regular cookie name
      const cookieValue = get(cookie_name);
      if (cookieValue) {
        let value = cookieValue;
        
        // Apply pattern for ID extraction if specified
        if (pattern) {
          const regex = new RegExp(pattern);
          const match = value.match(regex);
          if (match && match[1]) {
            value = match[1];
          }
        }
        
        ids[name] = value;
      }
    }
  }
  
  return ids;
}

/**
 * Collects all analytics IDs from cookies
 * Uses an async approach via setTimeout to read cookies
 * that may be set later by other scripts
 */
export function collectAnalyticsIds(
  config: AnalyticsIdsConfig | undefined,
  lifetime: number,
  cookieDomain?: string,
  delay: number = 100
): Promise<AnalyticsIds> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get existing analytics IDs from cookie
      const existingIds = getAnalyticsIds();
      
      let ids: AnalyticsIds = { ...existingIds };
      
      // Collect Google Analytics IDs
      if (config?.google_analytics !== false) {
        ids = collectGoogleAnalytics(config?.google_analytics, ids);
      }
      
      // Collect Amplitude ID
      if (config?.amplitude !== false) {
        ids = collectAmplitude(config?.amplitude, ids);
      }
      
      // Collect Mixpanel ID
      if (config?.mixpanel !== false) {
        ids = collectMixpanel(config?.mixpanel, ids);
      }
      
      // Collect custom IDs
      if (config?.custom && config.custom.length > 0) {
        ids = collectCustom(config.custom, ids);
      }
      
      // Save to cookie only if there is something to save
      if (Object.keys(ids).length > 0) {
        const packedValue = packAnalyticsIds(ids);
        set(COOKIE_NAME, packedValue, lifetime, cookieDomain);
      }
      
      resolve(ids);
    }, delay);
  });
}

