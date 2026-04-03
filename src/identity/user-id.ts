import type { UserIdConfig } from '../types';
import { get, set } from '../helpers/cookies';

const COOKIE_NAME = 'intk_user_id';

/**
 * Gets User ID from cookie
 */
export function getUserId(): string | null {
  return get(COOKIE_NAME);
}

/**
 * Sets User ID manually
 * @param userId - User ID to save
 * @param lifetime - Lifetime in minutes (default: 6 months = 259200 minutes)
 * @param cookieDomain - Cookie domain (optional)
 */
export function setUserId(userId: string | null, lifetime: number = 259200, cookieDomain?: string): void {
  if (!userId) {
    // Delete cookie if userId is null or empty
    set(COOKIE_NAME, '', 0, cookieDomain);
    
    // Also remove from localStorage
    try {
      localStorage.removeItem(COOKIE_NAME);
    } catch (e) {
      // Ignore localStorage errors (e.g., in private browsing mode)
      console.warn('Failed to remove User ID from localStorage:', e);
    }
    return;
  }
  
  // Save User ID to cookie
  set(COOKIE_NAME, userId, lifetime, cookieDomain);
  
  // Also save to localStorage as fallback
  try {
    localStorage.setItem(COOKIE_NAME, userId);
  } catch (e) {
    // Ignore localStorage errors (e.g., in private browsing mode)
    console.warn('Failed to save User ID to localStorage:', e);
  }
}

/**
 * Gets User ID from dataLayer
 */
function getUserIdFromDataLayer(key: string): string | null {
  if (typeof window === 'undefined' || !(window as any).dataLayer) {
    return null;
  }
  
  const dataLayer = (window as any).dataLayer;
  
  // Search in the latest dataLayer entries (from end to start)
  for (let i = dataLayer.length - 1; i >= 0; i--) {
    const entry = dataLayer[i];
    if (entry && typeof entry === 'object' && entry[key]) {
      return String(entry[key]);
    }
  }
  
  return null;
}

/**
 * Gets User ID from localStorage
 */
function getUserIdFromLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/**
 * Automatically retrieves User ID from various sources according to config
 * @param config - User ID source configuration
 * @returns User ID or null if not found
 */
export function watchUserId(config?: UserIdConfig): string | null {
  if (!config) {
    return null;
  }
  
  let userId: string | null = null;
  
  switch (config.source) {
    case 'dataLayer':
      if (config.key) {
        userId = getUserIdFromDataLayer(config.key);
      }
      break;
      
    case 'cookie':
      if (config.key) {
        userId = get(config.key);
      }
      break;
      
    case 'localStorage':
      if (config.key) {
        userId = getUserIdFromLocalStorage(config.key);
      }
      break;
      
    case 'function':
      if (config.function) {
        try {
          userId = config.function();
        } catch (e) {
          console.warn('Failed to get User ID from function:', e);
          userId = null;
        }
      }
      break;
  }
  
  // If User ID is found, save it to cookie for persistence
  if (userId) {
    // Use lifetime from config or default (6 months)
    const lifetime = config.lifetime || 259200; // 6 months in minutes
    setUserId(userId, lifetime, config.cookieDomain);
  }
  
  return userId;
}

/**
 * Initializes User ID from config or existing cookie
 * @param config - User ID source configuration
 * @param lifetime - Lifetime in minutes (default: 6 months)
 * @param cookieDomain - Cookie domain (optional)
 * @param consentGranted - Whether consent is granted (default: true for backward compatibility)
 * @returns User ID or null
 */
export function initUserId(
  config?: UserIdConfig,
  lifetime: number = 259200,
  cookieDomain?: string,
  consentGranted: boolean = true
): string | null {
  // First check for existing User ID in cookie
  const existingUserId = getUserId();
  if (existingUserId) {
    return existingUserId;
  }
  
  // If config exists, try to get User ID from the source
  if (config) {
    // Get User ID from source (without saving if consent denied)
    let userId: string | null = null;
    
    switch (config.source) {
      case 'dataLayer':
        if (config.key) {
          userId = getUserIdFromDataLayer(config.key);
        }
        break;
        
      case 'cookie':
        if (config.key) {
          userId = get(config.key);
        }
        break;
        
      case 'localStorage':
        if (config.key) {
          userId = getUserIdFromLocalStorage(config.key);
        }
        break;
        
      case 'function':
        if (config.function) {
          try {
            userId = config.function();
          } catch (e) {
            console.warn('Failed to get User ID from function:', e);
            userId = null;
          }
        }
        break;
    }
    
    // Save User ID only if consent granted
    if (userId && consentGranted) {
      const finalLifetime = config.lifetime || lifetime;
      const finalCookieDomain = config.cookieDomain || cookieDomain;
      setUserId(userId, finalLifetime, finalCookieDomain);
    }
    
    if (userId) {
      return userId;
    }
  }
  
  return null;
}

