import { get } from '../helpers/cookies';
import { clearRuntimeMemory } from './parameter-forwarding';

/**
 * List of all Intake cookies to delete
 */
const INTAKE_COOKIES = [
  'intk_session',
  'intk_current',
  'intk_first',
  'intk_current_add',
  'intk_first_add',
  'intk_udata',
  'intk_promo',
  'intk_touchpoints',
  'intk_click_ids',
  'intk_user_id',
  'intk_pii',
  'intk_analytics_ids'
];

/**
 * List of all Intake localStorage keys to delete
 */
const INTAKE_LOCALSTORAGE_KEYS = [
  'intk_user_id' // User ID fallback
];

/**
 * Deletes a cookie by name
 * Supports deletion with different domain and path values
 * 
 * @param name - Cookie name to delete
 * @param domain - Cookie domain (optional)
 */
function deleteCookie(name: string, domain?: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  // Delete cookie with current path
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // If domain is specified, delete with domain
  if (domain) {
    document.cookie = `${name}=;path=/;domain=${domain};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    // Also try with a dot prefix before the domain
    document.cookie = `${name}=;path=/;domain=.${domain};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  
  // Delete with root domain (if available)
  const hostname = window.location.hostname;
  if (hostname) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      const rootDomain = '.' + parts.slice(-2).join('.');
      document.cookie = `${name}=;path=/;domain=${rootDomain};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
}

/**
 * Deletes all Intake cookies
 * 
 * @param domain - Domain for cookie deletion (optional)
 */
export function clearAllCookies(domain?: string): void {
  for (const cookieName of INTAKE_COOKIES) {
    deleteCookie(cookieName, domain);
  }
}

/**
 * Deletes all Intake data from localStorage
 */
export function clearAllLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    for (const key of INTAKE_LOCALSTORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    
    // Also remove all keys starting with the Intake prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('intk_')) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('Intake: Error clearing localStorage:', error);
  }
}

/**
 * Clears all Intake data
 * Deletes cookies, localStorage, and runtime memory
 * 
 * @param domain - Domain for cookie deletion (optional)
 */
export function clearAllData(domain?: string): void {
  // 1. Delete all cookies
  clearAllCookies(domain);
  
  // 2. Delete all localStorage
  clearAllLocalStorage();
  
  // 3. Clear runtime memory (window.name)
  clearRuntimeMemory();
}

/**
 * Withdraws consent and clears all Intake data
 * Used when the user revokes consent
 * 
 * @param domain - Domain for cookie deletion (optional)
 */
export function withdrawConsent(domain?: string): void {
  // Clear all data
  clearAllData(domain);
}

