import type { BrowserInfo, InAppBrowserSource } from '../types';

/**
 * Returns the browser family from a User-Agent string.
 * Order matters: Edge/Samsung/Opera all contain "Chrome", so they are checked first.
 */
function detectBrowserType(ua: string): string {
  if (/Edg[A]?\//i.test(ua)) return 'edge';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/OPR\/|Opera/i.test(ua)) return 'opera';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Chrome/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua)) return 'safari';
  return 'other';
}

function matchInApp(inAppBrowsers: InAppBrowserSource[], ua: string): string | null {
  for (const b of inAppBrowsers) {
    if (!b?.pattern || !b?.source) continue;
    try {
      if (new RegExp(b.pattern, 'i').test(ua)) return b.source;
    } catch {
      // Invalid regex — skip
    }
  }
  return null;
}

/**
 * Builds BrowserInfo from navigator.userAgent and navigator.language.
 * Reuses the same in-app browser patterns already configured for traffic source detection.
 */
export function buildBrowserInfo(inAppBrowsers: InAppBrowserSource[]): BrowserInfo {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const language = (typeof navigator !== 'undefined' && navigator.language) || '';
  const inAppSource = matchInApp(inAppBrowsers, ua);
  return {
    user_agent: ua,
    browser_type: inAppSource ? 'in_app' : detectBrowserType(ua),
    is_in_app: !!inAppSource,
    ...(inAppSource ? { in_app_source: inAppSource } : {}),
    language
  };
}
