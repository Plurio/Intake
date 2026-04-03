import { getHost } from '../helpers/uri';
import type { ResolvedLinkDecorationConfig, IntkData, TrafficSource, ClickIds } from '../types';

/**
 * UTM parameter names for decoration
 */
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/**
 * Click ID parameter names for decoration
 */
const CLICK_ID_PARAMS = [
  'gclid',      // Google Ads
  'wbraid',     // Google Ads (web-to-app)
  'gbraid',     // Google Ads (app-to-web)
  'dclid',      // Google Display & Video 360
  'fbclid',     // Facebook Ads
  'msclkid',    // Microsoft Advertising
  'ttclid',     // TikTok Ads
  'li_fatid',   // LinkedIn Ads
  'twclid',     // Twitter Ads
  'snapclid',   // Snapchat Ads
  'pclid'       // Pinterest Ads
] as const;

/**
 * Mapping from TrafficSource fields to UTM parameter names
 */
const SOURCE_TO_UTM: Record<string, string> = {
  src: 'utm_source',
  mdm: 'utm_medium',
  cmp: 'utm_campaign',
  cnt: 'utm_content',
  trm: 'utm_term'
};

/**
 * Interface for decoration parameters
 */
export interface DecorationParams {
  [key: string]: string;
}

/**
 * Checks if a domain matches an allowed domain pattern.
 * Supports exact match and wildcard subdomains (*.example.com).
 * 
 * @param targetHost - The host to check (without www prefix)
 * @param pattern - The allowed domain pattern
 * @returns true if the host matches the pattern
 */
function matchesDomainPattern(targetHost: string, pattern: string): boolean {
  // Normalize: remove www prefix from both
  const normalizedHost = targetHost.toLowerCase().replace(/^www\./, '');
  const normalizedPattern = pattern.toLowerCase().replace(/^www\./, '');
  
  // Wildcard pattern (*.example.com)
  if (normalizedPattern.startsWith('*.')) {
    const baseDomain = normalizedPattern.substring(2); // Remove '*.'
    // Match either the base domain itself or any subdomain
    return normalizedHost === baseDomain || normalizedHost.endsWith('.' + baseDomain);
  }
  
  // Exact match
  return normalizedHost === normalizedPattern;
}

/**
 * Checks if a URL's domain is in the allowed domains list.
 * 
 * @param linkUrl - The URL to check
 * @param allowedDomains - List of allowed domain patterns
 * @returns true if the URL's domain is allowed
 */
export function isAllowedDomain(linkUrl: string, allowedDomains: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return false;
  }
  
  try {
    const targetHost = getHost(linkUrl);
    if (!targetHost) {
      return false;
    }
    
    // Check current domain - don't decorate same-origin links
    const currentHost = getHost(window.location.href);
    if (targetHost === currentHost) {
      return false;
    }
    
    // Check if target matches any allowed domain pattern
    return allowedDomains.some(pattern => matchesDomainPattern(targetHost, pattern));
  } catch (error) {
    return false;
  }
}

/**
 * Extracts UTM parameters from TrafficSource data.
 * 
 * @param source - TrafficSource object with traffic data
 * @returns Object with UTM parameters (only non-empty values)
 */
function extractUtmParams(source: TrafficSource): DecorationParams {
  const params: DecorationParams = {};
  
  for (const [sourceKey, utmKey] of Object.entries(SOURCE_TO_UTM)) {
    const value = source[sourceKey as keyof TrafficSource];
    // Skip empty values and default values like '(none)', '(not set)'
    if (value && typeof value === 'string' && value.trim() && !value.startsWith('(')) {
      params[utmKey] = value.trim();
    }
  }
  
  return params;
}

/**
 * Extracts click ID parameters from ClickIds data.
 * 
 * @param clickIds - ClickIds object with click ID data
 * @returns Object with click ID parameters (only non-empty values)
 */
function extractClickIdParams(clickIds: ClickIds | undefined): DecorationParams {
  const params: DecorationParams = {};
  
  if (!clickIds) {
    return params;
  }
  
  for (const paramName of CLICK_ID_PARAMS) {
    const value = clickIds[paramName];
    if (value && typeof value === 'string' && value.trim()) {
      params[paramName] = value.trim();
    }
  }
  
  return params;
}

/**
 * Collects all decoration parameters based on configuration and current data.
 * 
 * @param config - Resolved link decoration configuration
 * @param intkData - Current Intake data
 * @returns Object with all parameters to add to links
 */
export function getDecorationParams(
  config: ResolvedLinkDecorationConfig,
  intkData: IntkData
): DecorationParams {
  const params: DecorationParams = {};
  
  // Add UTM parameters from current traffic source
  if (config.decorateUtm && intkData.current) {
    const utmParams = extractUtmParams(intkData.current);
    Object.assign(params, utmParams);
  }
  
  // Add click IDs
  if (config.decorateClickIds && intkData.click_ids) {
    const clickIdParams = extractClickIdParams(intkData.click_ids);
    Object.assign(params, clickIdParams);
  }
  
  // Add custom parameters (these override auto-detected ones)
  if (config.customParams) {
    for (const [key, value] of Object.entries(config.customParams)) {
      if (value && typeof value === 'string' && value.trim()) {
        params[key] = value.trim();
      }
    }
  }
  
  return params;
}

/**
 * Decorates a URL with the given parameters.
 * Does not duplicate parameters that already exist in the URL.
 * 
 * @param linkUrl - Original URL to decorate
 * @param params - Parameters to add
 * @returns Decorated URL string
 */
export function decorateLink(linkUrl: string, params: DecorationParams): string {
  if (!params || Object.keys(params).length === 0) {
    return linkUrl;
  }
  
  try {
    const url = new URL(linkUrl);
    
    // Add parameters only if they don't already exist
    for (const [key, value] of Object.entries(params)) {
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }
    
    return url.toString();
  } catch (error) {
    // For invalid URLs, try a simple approach
    try {
      const separator = linkUrl.includes('?') ? '&' : '?';
      const existingParams = new Set<string>();
      
      // Extract existing params from URL
      const queryMatch = linkUrl.match(/\?([^#]*)/);
      if (queryMatch) {
        const searchParams = new URLSearchParams(queryMatch[1]);
        searchParams.forEach((_, key) => existingParams.add(key));
      }
      
      // Build new params string (only for non-existing params)
      const newParams: string[] = [];
      for (const [key, value] of Object.entries(params)) {
        if (value && !existingParams.has(key)) {
          newParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
      }
      
      if (newParams.length === 0) {
        return linkUrl;
      }
      
      // Handle hash fragments
      const hashIndex = linkUrl.indexOf('#');
      if (hashIndex !== -1) {
        const beforeHash = linkUrl.substring(0, hashIndex);
        const hash = linkUrl.substring(hashIndex);
        const sep = beforeHash.includes('?') ? '&' : '?';
        return beforeHash + sep + newParams.join('&') + hash;
      }
      
      return linkUrl + separator + newParams.join('&');
    } catch (fallbackError) {
      console.warn('Intake: Error decorating link:', fallbackError);
      return linkUrl;
    }
  }
}

/**
 * Initializes link decoration by setting up a click handler on the document.
 * Uses event delegation for performance.
 * 
 * @param config - Resolved link decoration configuration
 * @param getDataFn - Function to get current Intake data (for dynamic updates)
 * @returns Cleanup function to remove the handler
 */
export function initLinkDecoration(
  config: ResolvedLinkDecorationConfig,
  getDataFn: () => IntkData
): () => void {
  if (typeof document === 'undefined') {
    return () => {}; // No-op if document is not available (SSR)
  }
  
  // Don't initialize if not enabled or no allowed domains
  if (!config.enabled || !config.allowedDomains || config.allowedDomains.length === 0) {
    return () => {};
  }
  
  const clickHandler = (event: MouseEvent) => {
    // Find the closest <a> element
    const link = (event.target as HTMLElement)?.closest('a');
    
    if (!link || !link.href) {
      return;
    }
    
    // Check if this link's domain is in the allowed list
    if (!isAllowedDomain(link.href, config.allowedDomains)) {
      return;
    }
    
    // Get current data and decoration parameters
    const intkData = getDataFn();
    const params = getDecorationParams(config, intkData);
    
    if (Object.keys(params).length === 0) {
      return;
    }
    
    // Decorate the link
    const decoratedUrl = decorateLink(link.href, params);
    
    // Update href if changed
    if (decoratedUrl !== link.href) {
      link.href = decoratedUrl;
    }
  };
  
  // Add handler using capture phase to ensure we process before navigation
  document.addEventListener('click', clickHandler, true);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', clickHandler, true);
  };
}
