import type { PiiCollectionConfig, PiiHashes } from '../types';
import { hashEmail, hashPhone, isValidEmail, isValidPhone } from './pii';
import { get, set, parse } from '../helpers/cookies';

// localStorage fallback key prefix
const STORAGE_KEY_PREFIX = 'intk_pii_';

const DELIMITER = '|||';
const COOKIE_NAME = 'intk_pii';

/**
 * Type indicating what PII data changed
 */
export type PiiChangeType = 'email' | 'phone' | 'both';

/**
 * Result of hashing and saving PII data
 */
interface HashAndSaveResult {
  hashes: PiiHashes;
  changeType: PiiChangeType | null;
}

// Default selectors for email and phone fields
const DEFAULT_EMAIL_SELECTORS = ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]'];
const DEFAULT_PHONE_SELECTORS = ['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]'];

/**
 * Packs PiiHashes into a string for cookie storage
 */
export function packPiiHashes(piiHashes: PiiHashes): string {
  const parts: string[] = [];
  
  if (piiHashes.email_hash) {
    parts.push(`email=${piiHashes.email_hash}`);
  }
  if (piiHashes.phone_hash) {
    parts.push(`phone=${piiHashes.phone_hash}`);
  }
  
  return parts.join(DELIMITER);
}

/**
 * Parses a cookie string into PiiHashes
 */
export function parsePiiHashes(cookieValue: string | null): PiiHashes {
  if (!cookieValue) {
    return {};
  }
  
  const data = parse(cookieValue);
  const piiHashes: PiiHashes = {};
  
  if (data.email) {
    piiHashes.email_hash = data.email;
  }
  if (data.phone) {
    piiHashes.phone_hash = data.phone;
  }
  
  return piiHashes;
}

/**
 * Gets current PII hashes from cookie or localStorage (fallback)
 */
export function getPiiHashes(): PiiHashes {
  // First try to get from cookie
  const cookieValue = get(COOKIE_NAME);
  if (cookieValue) {
    return parsePiiHashes(cookieValue);
  }
  
  // Fallback to localStorage (as in the legacy implementation)
  try {
    const emailHash = localStorage.getItem(STORAGE_KEY_PREFIX + 'email');
    const phoneHash = localStorage.getItem(STORAGE_KEY_PREFIX + 'phone');
    
    if (emailHash || phoneHash) {
      return {
        email_hash: emailHash || undefined,
        phone_hash: phoneHash || undefined
      };
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return {};
}

/**
 * Finds all form elements by selectors
 * Supports both input and textarea fields
 */
function findFormElements(selectors: string[]): Array<HTMLInputElement | HTMLTextAreaElement> {
  const elements: Array<HTMLInputElement | HTMLTextAreaElement> = [];
  
  for (const selector of selectors) {
    try {
      const found = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
      found.forEach(el => {
        // Support INPUT and TEXTAREA
        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.value) {
          // Skip already processed fields (if dataset marker exists)
          if (!(el as any).dataset?.intkProcessed) {
            elements.push(el);
          }
        }
      });
    } catch (e) {
      // Ignore invalid selectors
      console.warn(`Invalid selector: ${selector}`, e);
    }
  }
  
  return elements;
}

/**
 * Collects emails from forms on the page
 * Uses selectors but also checks all fields on the page (hybrid approach)
 */
function collectEmailsFromForms(selectors: string[]): string[] {
  const emails = new Set<string>();
  
  // Reset processing flags for all fields before a new check
  // This ensures fields are re-checked on each change
  try {
    const allFields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    for (const field of allFields) {
      delete (field as any).dataset?.intkProcessed;
    }
  } catch (e) {
    // Ignore errors
  }
  
  // First collect by selectors (priority)
  const elementsBySelectors = findFormElements(selectors);
  for (const element of elementsBySelectors) {
    const value = element.value?.trim();
    if (value && isValidEmail(value)) {
      emails.add(value);
      // Mark field as processed
      (element as any).dataset.intkProcessed = 'true';
    }
  }
  
  // Fallback: check all remaining fields by content
  try {
    const allFields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    for (const field of allFields) {
      // Skip already processed fields
      if ((field as any).dataset?.intkProcessed) {
        continue;
      }
      
      // Skip fields already matched by selectors
      let matchesSelector = false;
      for (const selector of selectors) {
        try {
          if (field.matches && field.matches(selector)) {
            matchesSelector = true;
            break;
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      }
      
      if (matchesSelector) {
        continue;
      }
      
      // Check content (fallback validation)
      const value = field.value?.trim();
      if (value && looksLikeEmail(value) && isValidEmail(value)) {
        emails.add(value);
        (field as any).dataset.intkProcessed = 'true';
      }
    }
  } catch (e) {
    // Ignore errors during scanning
  }
  
  return Array.from(emails);
}

/**
 * Quick email check by content (for fallback)
 */
function looksLikeEmail(value: string): boolean {
  if (!value || value.length < 5) return false;
  return /\S+@\S+\.\S+/.test(value);
}

/**
 * Collects phone numbers from forms on the page
 * Uses selectors but also checks all fields on the page (hybrid approach)
 */
function collectPhonesFromForms(selectors: string[]): string[] {
  const phones = new Set<string>();
  
  // Reset processing flags for all fields before a new check
  // This ensures fields are re-checked on each change
  try {
    const allFields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    for (const field of allFields) {
      delete (field as any).dataset?.intkProcessed;
    }
  } catch (e) {
    // Ignore errors
  }
  
  // First collect by selectors (priority)
  const elementsBySelectors = findFormElements(selectors);
  for (const element of elementsBySelectors) {
    const value = element.value?.trim();
    if (value && isValidPhone(value)) {
      phones.add(value);
      // Mark field as processed
      (element as any).dataset.intkProcessed = 'true';
    }
  }
  
  // Fallback: check all remaining fields by content
  try {
    const allFields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    for (const field of allFields) {
      // Skip already processed fields
      if ((field as any).dataset?.intkProcessed) {
        continue;
      }
      
      // Skip fields already matched by selectors
      let matchesSelector = false;
      for (const selector of selectors) {
        try {
          if (field.matches && field.matches(selector)) {
            matchesSelector = true;
            break;
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      }
      
      if (matchesSelector) {
        continue;
      }
      
      // Check content (fallback validation)
      const value = field.value?.trim();
      if (value && looksLikePhone(value) && isValidPhone(value)) {
        phones.add(value);
        (field as any).dataset.intkProcessed = 'true';
      }
    }
  } catch (e) {
    // Ignore errors during scanning
  }
  
  return Array.from(phones);
}

/**
 * Quick phone check by content (for fallback)
 */
function looksLikePhone(value: string): boolean {
  if (!value || value.length < 5 || value.length > 20) return false;
  // Check that value contains only digits and phone symbols
  const phoneCharsOnly = value.replace(/[^0-9+()\-\s]/g, '');
  return phoneCharsOnly.length === value.length;
}

/**
 * Hashes and saves PII data
 * 
 * Important: Updates the hash only if the new email/phone differs from the stored one.
 * This allows correcting incorrectly entered data.
 * 
 * @returns Object with hashes and changeType indicating what PII data changed
 */
async function hashAndSavePii(
  emails: string[],
  phones: string[],
  existingHashes: PiiHashes,
  lifetime: number,
  cookieDomain?: string
): Promise<HashAndSaveResult> {
  const hashes: PiiHashes = { ...existingHashes };
  let emailChanged = false;
  let phoneChanged = false;
  
  // Process email
  if (emails.length > 0) {
    try {
      const emailToHash = emails[0];
      const newEmailHash = await hashEmail(emailToHash);
      
      // If email is not yet stored, or new hash differs from old — update
      if (!hashes.email_hash) {
        // First save
        hashes.email_hash = newEmailHash;
        emailChanged = true;
      } else if (hashes.email_hash !== newEmailHash) {
        // Hash changed — update
        hashes.email_hash = newEmailHash;
        emailChanged = true;
      }
      // If hashes are identical — do not update (user reverted to old value)
    } catch (e) {
      console.warn('Failed to hash email:', e);
    }
  }
  
  // Process phone
  if (phones.length > 0) {
    try {
      const newPhoneHash = await hashPhone(phones[0]);
      
      // If phone is not yet stored, or new hash differs from old — update
      if (!hashes.phone_hash) {
        // First save
        hashes.phone_hash = newPhoneHash;
        phoneChanged = true;
      } else if (hashes.phone_hash !== newPhoneHash) {
        // Hash changed — update
        hashes.phone_hash = newPhoneHash;
        phoneChanged = true;
      }
      // If hashes are identical — do not update (user reverted to old value)
    } catch (e) {
      console.warn('Failed to hash phone:', e);
    }
  }
  
  const hasChanges = emailChanged || phoneChanged;
  
  // Save only if there are changes
  if (hasChanges && (hashes.email_hash || hashes.phone_hash)) {
    const packedValue = packPiiHashes(hashes);
    set(COOKIE_NAME, packedValue, lifetime, cookieDomain);
    
    // Save to localStorage as fallback (as in the legacy implementation)
    try {
      if (hashes.email_hash) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'email', hashes.email_hash);
      }
      if (hashes.phone_hash) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'phone', hashes.phone_hash);
      }
    } catch (e) {
      // Ignore localStorage errors (e.g., in private browsing mode)
      console.warn('Failed to save PII to localStorage:', e);
    }
  }
  
  // Determine change type
  let changeType: PiiChangeType | null = null;
  if (emailChanged && phoneChanged) {
    changeType = 'both';
  } else if (emailChanged) {
    changeType = 'email';
  } else if (phoneChanged) {
    changeType = 'phone';
  }
  
  return { hashes, changeType };
}

/**
 * Watches forms on the page and collects PII data
 * 
 * Uses MutationObserver to track DOM changes
 * and events to track changes in input fields
 * @param onUpdate - Optional callback invoked on PII update with the change type
 */
export function watchForms(
  config: PiiCollectionConfig,
  lifetime: number,
  cookieDomain?: string,
  onUpdate?: (piiHashes: PiiHashes, changeType: PiiChangeType) => void
): () => void {
  if (!config.enabled) {
    return () => {}; // No-op cleanup function
  }
  
  const emailSelectors = config.email_selectors || DEFAULT_EMAIL_SELECTORS;
  const phoneSelectors = config.phone_selectors || DEFAULT_PHONE_SELECTORS;
  
  // Function for collecting and saving PII
  let debounceTimer: number | null = null;
  let isProcessing = false; // Processing flag
  let currentDebounceId = 0; // Current debounce ID
  
  const collectAndSave = async () => {
    // Cancel previous debounce
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    
    // Increment debounce ID
    currentDebounceId++;
    const myDebounceId = currentDebounceId;
    
    // Wait for previous processing to finish before starting a new one
    // This is critical for getting up-to-date hashes
    while (isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Set up debounce
    debounceTimer = window.setTimeout(async () => {
      // Check if this debounce was cancelled
      if (myDebounceId !== currentDebounceId) {
        // This debounce was cancelled — skip processing
        return;
      }
      
      // Set processing flag
      isProcessing = true;
      debounceTimer = null;
      
      try {
        const emails = collectEmailsFromForms(emailSelectors);
        const phones = collectPhonesFromForms(phoneSelectors);
        
        if (emails.length > 0 || phones.length > 0) {
          // CRITICAL: Get up-to-date hashes RIGHT BEFORE comparison
          // Do not fetch them early to guarantee freshness
          const existingHashes = getPiiHashes();
          const result = await hashAndSavePii(emails, phones, existingHashes, lifetime, cookieDomain);
          
          // Call callback on PII update (for dataLayer update)
          // Only call if there was an actual change (changeType is not null)
          if (onUpdate && result.changeType && Object.keys(result.hashes).length > 0) {
            onUpdate(result.hashes, result.changeType);
          }
        }
      } finally {
        // Clear processing flag
        isProcessing = false;
      }
    }, 500); // Debounce 500ms
  };
  
  // Checks if an element matches any of the selectors
  const matchesAnySelector = (element: HTMLElement, selectors: string[]): boolean => {
    for (const selector of selectors) {
      try {
        if (element.matches && element.matches(selector)) {
          return true;
        }
      } catch (e) {
        // Ignore invalid selectors
      }
    }
    return false;
  };
  
  // Quick email validation by content (fallback)
  // Uses simplified regex for performance
  const looksLikeEmail = (value: string): boolean => {
    if (!value || value.length < 5) return false;
    // Simplified regex: non-empty @ non-empty . non-empty
    return /\S+@\S+\.\S+/.test(value);
  };
  
  // Quick phone validation by content (fallback)
  // Checks that value contains only phone characters and proper length
  const looksLikePhone = (value: string): boolean => {
    if (!value || value.length < 5 || value.length > 20) return false;
    // Check that value contains only digits and phone symbols
    const phoneCharsOnly = value.replace(/[^0-9+()\-\s]/g, '');
    return phoneCharsOnly.length === value.length;
  };
  
  // Input/textarea change handler
  // Hybrid approach: check selectors first, then content-based validation
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
      return;
    }
    
    const value = target.value?.trim();
    if (!value) {
      return;
    }
    
    // Check selectors first (fast)
    const isEmailField = matchesAnySelector(target, emailSelectors);
    const isPhoneField = matchesAnySelector(target, phoneSelectors);
    
    // If field matches selectors — process immediately
    if (isEmailField || isPhoneField) {
      collectAndSave();
      return;
    }
    
    // Fallback: content-based validation (only if selectors did not match)
    if (looksLikeEmail(value) || looksLikePhone(value)) {
      collectAndSave();
    }
  };
  
  // Blur event handler (final value on focus loss)
  // Hybrid approach: check selectors first, then content-based validation
  const handleBlur = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
      return;
    }
    
    const value = target.value?.trim();
    if (!value) {
      return;
    }
    
    // Check selectors first (fast)
    const isEmailField = matchesAnySelector(target, emailSelectors);
    const isPhoneField = matchesAnySelector(target, phoneSelectors);
    
    // If field matches selectors — process immediately
    if (isEmailField || isPhoneField) {
      collectAndSave();
      return;
    }
    
    // Fallback: content-based validation (only if selectors did not match)
    if (looksLikeEmail(value) || looksLikePhone(value)) {
      collectAndSave();
    }
  };
  
  // Form submit handler
  const handleFormSubmit = () => {
    collectAndSave();
  };
  
  // MutationObserver for tracking dynamically added forms
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Check if a form or input field was added
            if (element.tagName === 'FORM' || 
                element.tagName === 'INPUT' ||
                element.querySelector('form, input')) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      
      if (shouldCheck) break;
    }
    
    if (shouldCheck) {
      collectAndSave();
    }
  });
  
  // Start tracking
  document.addEventListener('input', handleInputChange, true);
  document.addEventListener('change', handleInputChange, true);
  document.addEventListener('blur', handleBlur, true); // Add blur to capture final value
  document.addEventListener('submit', handleFormSubmit, true);
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial collection (if forms already exist on the page)
  collectAndSave();
  
  // Cleanup function to stop tracking
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    document.removeEventListener('input', handleInputChange, true);
    document.removeEventListener('change', handleInputChange, true);
    document.removeEventListener('blur', handleBlur, true);
    document.removeEventListener('submit', handleFormSubmit, true);
    observer.disconnect();
  };
}

/**
 * Clears all stored PII data (cookie and localStorage)
 * Used when consent for data processing is withdrawn
 */
export function cleanupPiiStorage(): void {
  // Clear cookie
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`;
  
  // Clear localStorage
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'email');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'phone');
  } catch (e) {
    // Ignore localStorage errors
    console.warn('Failed to cleanup localStorage:', e);
  }
}

/**
 * Collects PII from forms synchronously (without tracking)
 * Useful for initial collection during initialization
 */
export async function collectPiiFromForms(
  config: PiiCollectionConfig,
  lifetime: number,
  cookieDomain?: string
): Promise<PiiHashes> {
  if (!config.enabled) {
    return {};
  }
  
  const emailSelectors = config.email_selectors || DEFAULT_EMAIL_SELECTORS;
  const phoneSelectors = config.phone_selectors || DEFAULT_PHONE_SELECTORS;
  
  const existingHashes = getPiiHashes();
  const emails = collectEmailsFromForms(emailSelectors);
  const phones = collectPhonesFromForms(phoneSelectors);
  
  const result = await hashAndSavePii(emails, phones, existingHashes, lifetime, cookieDomain);
  return result.hashes;
}
