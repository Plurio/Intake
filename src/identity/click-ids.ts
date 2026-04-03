import type { ClickIds } from '../types';
import { getParam } from '../helpers/uri';
import { get, set, parse } from '../helpers/cookies';

const DELIMITER = '|||';
const COOKIE_NAME = 'intk_click_ids';

/**
 * List of known click-ID parameters from URL
 */
const KNOWN_CLICK_IDS = [
  // Google Ads identifiers
  'gclid',      // Google Ads (primary click ID for web traffic)
  'wbraid',     // Google Ads (web-to-app conversions)
  'gbraid',     // Google Ads (app-to-web conversions, iOS)
  'dclid',      // Google Display & Video 360 (DV360)
  
  // Facebook/Meta Ads
  'fbclid',     // Facebook Ads
  
  // Microsoft Advertising
  'msclkid',    // Microsoft Advertising (Bing Ads)
  
  // TikTok Ads
  'ttclid',     // TikTok Ads
  
  // LinkedIn Ads
  'li_fatid',   // LinkedIn Ads
  
  // Twitter/X Ads
  'twclid',     // Twitter Ads
  
  // Snapchat Ads
  'snapclid',   // Snapchat Ads
  
  // Pinterest Ads
  'pclid'       // Pinterest Ads
];

/**
 * Packs ClickIds into a string for cookie storage
 */
export function packClickIds(clickIds: ClickIds): string {
  const parts: string[] = [];
  
  for (const [key, value] of Object.entries(clickIds)) {
    if (value && value.trim()) {
      parts.push(`${key}=${value}`);
    }
  }
  
  return parts.join(DELIMITER);
}

/**
 * Parses a cookie string into ClickIds
 */
export function parseClickIds(cookieValue: string | null): ClickIds {
  if (!cookieValue) {
    return {};
  }
  
  const data = parse(cookieValue);
  const clickIds: ClickIds = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && value.trim()) {
      clickIds[key] = value;
    }
  }
  
  return clickIds;
}

/**
 * Gets current click IDs from cookie
 */
export function getClickIds(): ClickIds {
  const cookieValue = get(COOKIE_NAME);
  return parseClickIds(cookieValue);
}

/**
 * Collects click IDs from URL parameters
 */
function collectClickIdsFromUrl(): ClickIds {
  const clickIds: ClickIds = {};
  
  for (const paramName of KNOWN_CLICK_IDS) {
    const value = getParam(paramName);
    if (value && value.trim()) {
      clickIds[paramName] = value.trim();
    }
  }
  
  return clickIds;
}

/**
 * Merges existing click IDs with new ones from URL
 * New values overwrite old ones
 */
function mergeClickIds(existing: ClickIds, newIds: ClickIds): ClickIds {
  return {
    ...existing,
    ...newIds
  };
}

/**
 * Collects click IDs from URL and saves to cookie
 * Accumulates all found click IDs (new values overwrite old ones)
 * 
 * @param lifetime - Cookie lifetime in minutes
 * @param cookieDomain - Cookie domain (optional)
 * @param consentGranted - Whether consent is granted (default: true for backward compatibility)
 */
export function collectClickIds(
  lifetime: number,
  cookieDomain?: string,
  consentGranted: boolean = true
): ClickIds {
  // Get existing click IDs from cookie
  const existingIds = getClickIds();
  
  // Collect new click IDs from URL
  const newIds = collectClickIdsFromUrl();
  
  // Merge (new values overwrite old ones)
  const mergedIds = mergeClickIds(existingIds, newIds);
  
  // Save to cookie only if there is something to save AND consent is granted
  if (Object.keys(mergedIds).length > 0 && consentGranted) {
    const packedValue = packClickIds(mergedIds);
    set(COOKIE_NAME, packedValue, lifetime, cookieDomain);
  }
  
  return mergedIds;
}

