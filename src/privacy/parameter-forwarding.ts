import { getAllParams, getHost } from '../helpers/uri';

/**
 * List of parameters for URL passthrough
 * Includes UTM parameters and click IDs
 */
const TRACKING_PARAMS = [
  // UTM parameters
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  
  // Click IDs
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
];

/**
 * Prefix for Intake data in window.name
 * Used to isolate our data from other scripts
 */
const WINDOW_NAME_PREFIX = 'intk_params:';

/**
 * Interface for parameters stored in runtime memory
 */
export interface ParameterData {
  [key: string]: string;
}

/**
 * Reads tracking parameters from the current URL
 * Extracts UTM parameters and click IDs
 * 
 * @returns Object with tracking parameters
 */
export function readParametersFromURL(): ParameterData {
  const params: ParameterData = {};
  const urlParams = getAllParams();
  
  // Extract only tracking parameters
  for (const paramName of TRACKING_PARAMS) {
    const value = urlParams[paramName];
    if (value && value.trim()) {
      params[paramName] = value.trim();
    }
  }
  
  return params;
}

/**
 * Saves parameters to runtime memory (window.name)
 * Does NOT write to disk — this is runtime memory only
 * 
 * @param params - Parameters to save
 */
export function saveToRuntimeMemory(params: ParameterData): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Get existing data from window.name (if any)
    const existingData = readFromRuntimeMemory();
    
    // Merge existing data with new data (new values overwrite old ones)
    const mergedData: ParameterData = {
      ...existingData,
      ...params
    };
    
    // Save only non-empty parameters
    const filteredData: ParameterData = {};
    for (const [key, value] of Object.entries(mergedData)) {
      if (value && value.trim()) {
        filteredData[key] = value.trim();
      }
    }
    
    // Save to window.name with prefix for isolation
    if (Object.keys(filteredData).length > 0) {
      window.name = WINDOW_NAME_PREFIX + JSON.stringify(filteredData);
    } else {
      // If no data, clear window.name (but preserve other data if any)
      // Check if there is other data in window.name
      if (window.name && !window.name.startsWith(WINDOW_NAME_PREFIX)) {
        // Other data exists — don't touch it
        return;
      }
      // No data — clear our prefix
      window.name = '';
    }
  } catch (error) {
    console.warn('Intake: Error saving to runtime memory:', error);
  }
}

/**
 * Reads parameters from runtime memory (window.name)
 * 
 * @returns Object with tracking parameters
 */
export function readFromRuntimeMemory(): ParameterData {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    // Check if data with our prefix exists
    if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      const jsonStr = window.name.substring(WINDOW_NAME_PREFIX.length);
      const data = JSON.parse(jsonStr);
      
      // Validate and filter data
      const params: ParameterData = {};
      for (const [key, value] of Object.entries(data)) {
        if (TRACKING_PARAMS.includes(key) && typeof value === 'string' && value.trim()) {
          params[key] = value.trim();
        }
      }
      
      return params;
    }
  } catch (error) {
    console.warn('Intake: Error reading from runtime memory:', error);
  }
  
  return {};
}

/**
 * Checks if a link is same-origin (same domain)
 * 
 * @param linkUrl - Link URL
 * @returns true if the link is same-origin
 */
function isSameOrigin(linkUrl: string): boolean {
  try {
    const linkHost = getHost(linkUrl);
    const currentHost = getHost(window.location.href);
    
    // Compare domains (ignoring www)
    return linkHost === currentHost;
  } catch (error) {
    // If URL parsing failed, assume it's a relative URL (same-origin)
    return true;
  }
}

/**
 * Adds tracking parameters to a link URL
 * Used for passing parameters between pages
 * 
 * @param linkUrl - Link URL
 * @param params - Parameters to add
 * @returns URL with added parameters
 */
export function addParametersToURL(linkUrl: string, params: ParameterData): string {
  try {
    const url = new URL(linkUrl, window.location.origin);
    
    // Add parameters if they don't already exist in the URL
    for (const [key, value] of Object.entries(params)) {
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }
    
    return url.toString();
  } catch (error) {
    // If URL parsing failed, return the original
    console.warn('Intake: Error adding parameters to URL:', error);
    return linkUrl;
  }
}

/**
 * Link click handler for adding parameters
 * Uses event delegation to intercept clicks
 * 
 * @param params - Parameters to add to links
 * @returns Cleanup function to stop tracking
 */
export function addParametersToLinks(params: ParameterData): () => void {
  if (typeof document === 'undefined') {
    return () => {}; // No-op if document is unavailable
  }
  
  const clickHandler = (event: MouseEvent) => {
    // Find the closest <a> element
    const link = (event.target as HTMLElement)?.closest('a');
    
    if (!link || !link.href) {
      return;
    }
    
    // Check that this is a same-origin link
    if (!isSameOrigin(link.href)) {
      return;
    }
    
    // Add parameters to URL
    const newUrl = addParametersToURL(link.href, params);
    
    // Update link href
    if (newUrl !== link.href) {
      link.href = newUrl;
    }
  };
  
  // Add event handler
  document.addEventListener('click', clickHandler, true); // Use capture phase
  
  // Return cleanup function to stop tracking
  return () => {
    document.removeEventListener('click', clickHandler, true);
  };
}

/**
 * Initializes the parameter forwarding mechanism
 * Reads parameters from URL, saves to runtime memory, and sets up link tracking
 * 
 * @returns Cleanup function to stop tracking
 */
export function initParameterForwarding(): () => void {
  // 1. Read parameters from current URL
  const urlParams = readParametersFromURL();
  
  // 2. Read existing parameters from runtime memory
  const memoryParams = readFromRuntimeMemory();
  
  // 3. Merge (URL parameters take priority)
  const allParams: ParameterData = {
    ...memoryParams,
    ...urlParams
  };
  
  // 4. Save merged parameters to runtime memory
  if (Object.keys(allParams).length > 0) {
    saveToRuntimeMemory(allParams);
    
    // 5. Set up link tracking
    return addParametersToLinks(allParams);
  }
  
  // If no parameters, return no-op function
  return () => {};
}

/**
 * Clears parameters from runtime memory
 */
export function clearRuntimeMemory(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Clear only our data (with prefix)
    if (window.name && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      // Other data may exist, but since we use a prefix, just clear window.name
      // In practice, window.name may contain data from other scripts,
      // but we cannot safely preserve it, so we just clear our prefix
      window.name = '';
    }
  } catch (error) {
    console.warn('Intake: Error clearing runtime memory:', error);
  }
}

