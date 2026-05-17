import type { TrafficSource, OrganicSource, ReferralSource, TypeinAttributes, PromocodeConfig, InAppBrowserSource } from './types';
import { getAllParams, getHost, parseUrl } from './helpers/uri';

/**
 * Mapping of click IDs to platform information
 */
interface ClickIdPlatform {
  source: string;
  medium: string;
  campaign: string;
}

/**
 * Default list of in-app browser (webview) patterns matched against
 * navigator.userAgent. Order matters: specific app signatures come first,
 * the generic Android webview pattern stays last so dedicated apps win.
 *
 * Short app names (Line, Twitter) use more specific markers (e.g. "Line/",
 * "Twitter for") to avoid false positives in unrelated User-Agents.
 */
export const DEFAULT_IN_APP_BROWSERS: InAppBrowserSource[] = [
  { pattern: 'FBAN|FBAV|FB_IAB',                source: 'facebook'        },
  { pattern: 'Instagram|IGApp',                  source: 'instagram'       },
  { pattern: 'TikTok|musical_ly|Aweme',          source: 'tiktok'          },
  { pattern: 'LinkedInApp|\\bLIA\\b',            source: 'linkedin'        },
  { pattern: 'TwitterAndroid|Twitter for',       source: 'twitter'         },
  { pattern: 'Snapchat',                         source: 'snapchat'        },
  { pattern: 'Pinterest',                        source: 'pinterest'       },
  { pattern: 'TelegramBot|TgWebApp|Telegram/',   source: 'telegram'        },
  { pattern: 'Viber',                            source: 'viber'           },
  { pattern: 'WhatsApp',                         source: 'whatsapp'        },
  { pattern: 'KAKAOTALK',                        source: 'kakaotalk'       },
  { pattern: 'Weibo',                            source: 'weibo'           },
  { pattern: 'MicroMessenger',                   source: 'wechat'          },
  { pattern: 'Line/',                            source: 'line'            },
  { pattern: '\\bwv\\b.*Android|Android.*\\bwv\\b', source: 'android_webview' }
];

const CLICK_ID_PLATFORMS: Record<string, ClickIdPlatform> = {
  // Google Ads identifiers
  gclid: { source: 'google', medium: 'cpc', campaign: 'google_cpc' },
  wbraid: { source: 'google', medium: 'cpc', campaign: 'google_cpc' },
  gbraid: { source: 'google', medium: 'cpc', campaign: 'google_cpc' },
  dclid: { source: 'google', medium: 'cpc', campaign: 'google_dv360' },
  
  // Facebook/Meta Ads
  fbclid: { source: 'facebook', medium: 'cpc', campaign: 'facebook_cpc' },
  
  // Microsoft Advertising
  msclkid: { source: 'microsoft', medium: 'cpc', campaign: 'microsoft_cpc' },
  
  // TikTok Ads
  ttclid: { source: 'tiktok', medium: 'cpc', campaign: 'tiktok_cpc' },
  
  // LinkedIn Ads
  li_fatid: { source: 'linkedin', medium: 'cpc', campaign: 'linkedin_cpc' },
  
  // Twitter/X Ads
  twclid: { source: 'twitter', medium: 'cpc', campaign: 'twitter_cpc' },
  
  // Snapchat Ads
  snapclid: { source: 'snapchat', medium: 'cpc', campaign: 'snapchat_cpc' },
  
  // Pinterest Ads
  pclid: { source: 'pinterest', medium: 'cpc', campaign: 'pinterest_cpc' }
};

/**
 * Finds the first click ID present in the URL parameters
 */
function findFirstClickId(params: Record<string, string>): { id: string; platform: ClickIdPlatform } | null {
  for (const [clickId, platform] of Object.entries(CLICK_ID_PLATFORMS)) {
    if (params[clickId]) {
      return { id: clickId, platform };
    }
  }
  return null;
}

/**
 * Checks whether any click ID is present in the parameters
 */
function hasAnyClickId(params: Record<string, string>): boolean {
  return Object.keys(CLICK_ID_PLATFORMS).some(clickId => !!params[clickId]);
}

/**
 * Matches navigator.userAgent against the provided in-app browser patterns.
 * Returns the first hit, or null if no pattern matches (or list is empty).
 * Invalid regex entries are skipped silently.
 */
function detectInAppBrowser(
  inAppBrowsers: InAppBrowserSource[]
): { source: string; medium: string } | null {
  if (!inAppBrowsers || !inAppBrowsers.length) return null;
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  if (!ua) return null;
  for (const browser of inAppBrowsers) {
    if (!browser || !browser.pattern || !browser.source) continue;
    try {
      if (new RegExp(browser.pattern, 'i').test(ua)) {
        return { source: browser.source, medium: browser.medium || 'in_app' };
      }
    } catch {
      // Invalid regex — skip
    }
  }
  return null;
}

function checkRefererHost(referer: string): boolean {
  const refererHost = getHost(referer);
  const currentHost = getHost(window.location.href);
  
  // Verify that the referer is not from the same domain
  return refererHost !== currentHost && !currentHost.includes(refererHost) && !refererHost.includes(currentHost);
}

function isOrganic(referer: string, customOrganics: OrganicSource[] = []): { isOrganic: boolean; source?: string } {
  if (!referer) {
    return { isOrganic: false };
  }
  
  const parsed = parseUrl(referer);
  const host = parsed.host.toLowerCase();
  const query = parsed.query.toLowerCase();
  
  // Check custom organics from config
  if (customOrganics.length > 0) {
    for (const organic of customOrganics) {
      const organicHostRegex = new RegExp('^(?:.*\\.)?' + organic.host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      if (host.match(organicHostRegex) && query.includes(organic.param.toLowerCase() + '=')) {
        return { isOrganic: true, source: organic.display || organic.host };
      }
    }
  }
  
  // Google: check if host contains google
  const googleHostRegex = /^(?:www\.)?google\..{2,9}$/i;
  if (host.match(googleHostRegex)) {
    return { isOrganic: true, source: 'google' };
  }
  
  // Bing
  if (host.includes('bing.com') && query.includes('q=')) {
    return { isOrganic: true, source: 'bing' };
  }
  
  // Yahoo
  if (host.includes('yahoo.com') && query.includes('p=')) {
    return { isOrganic: true, source: 'yahoo' };
  }
  
  return { isOrganic: false };
}

function isReferral(referer: string, customReferrals: ReferralSource[] = []): { isReferral: boolean; source?: string; medium?: string; content?: string } {
  if (!referer) {
    return { isReferral: false };
  }
  
  const parsed = parseUrl(referer);
  const host = parsed.host.toLowerCase();
  
  // Check custom referrals (e.g., t.co -> twitter.com)
  if (customReferrals.length > 0) {
    for (const referral of customReferrals) {
      const referralHostRegex = new RegExp('^(?:.*\\.)?' + referral.host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      if (host.match(referralHostRegex)) {
        return {
          isReferral: true,
          source: referral.display || referral.host,
          medium: referral.medium || 'referral',
          content: parsed.path || '/'
        };
      }
    }
  }
  
  // If not found in custom list, treat as a regular referral
  return {
    isReferral: true,
    source: getHost(referer),
    medium: 'referral',
    content: parsed.path || '/'
  };
}

function detectPromocode(params: Record<string, string>, promocodeConfig: PromocodeConfig | false): string | null {
  if (!promocodeConfig) {
    return null;
  }
  
  // Check all numeric parameters in the URL
  for (const [key, value] of Object.entries(params)) {
    // Skip known parameters
    if (key.startsWith('utm_') || CLICK_ID_PLATFORMS[key]) {
      continue;
    }
    
    // Check if the value is a number within the promocode range
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= promocodeConfig.min && numValue <= promocodeConfig.max) {
      return value; // Promocode found
    }
  }
  
  return null;
}

function getUtmTermFromReferer(params: Record<string, string>, termParamName: string): string | null {
  // If utm_term or term_param is already specified, don't use referer
  if (params.utm_term || params[termParamName]) {
    return null;
  }
  
  const referer = document.referrer;
  if (!referer) {
    return null;
  }
  
  return null;
}

export function detectTrafficSource(
  hasSession: boolean = false,
  customReferrals: ReferralSource[] = [],
  customOrganics: OrganicSource[] = [],
  typeinAttributes: TypeinAttributes = { source: '(direct)', medium: '(none)' },
  campaignParam: string | false = false,
  termParam: string | false = false,
  contentParam: string | false = false,
  promocodeConfig: PromocodeConfig | false = false,
  inAppBrowsers: InAppBrowserSource[] = []
): TrafficSource {
  const params = getAllParams();
  
  // Determine parameter names for campaign, term, content
  const campaignParamName = campaignParam || 'utm_campaign';
  const termParamName = termParam || 'utm_term';
  const contentParamName = contentParam || 'utm_content';
  
  // Check promocode (if configured)
  // IMPORTANT: The legacy version does NOT check the URL promocode for traffic type detection
  // It only generates a random promocode in a cookie
  // Therefore we do NOT use the URL promocode here
  // const promocode = promocodeConfig ? detectPromocode(params, promocodeConfig) : null;
  const promocode = null; // Legacy version does not use URL promocode for traffic detection
  
  const termFromReferer = getUtmTermFromReferer(params, termParamName);
  
  // Check UTM parameters (highest priority)
  // Legacy version checks: utm_source, utm_medium, utm_campaign, utm_content, utm_term, click IDs, or custom params
  if (params.utm_source || params.utm_medium || params[campaignParamName] || params.utm_campaign || 
      params.utm_content || params.utm_term || params[termParamName] || params[contentParamName] ||
      hasAnyClickId(params)) {
    
    // Determine source: utm_source > first found click ID > (none)
    let source = params.utm_source;
    if (!source) {
      const clickIdInfo = findFirstClickId(params);
      if (clickIdInfo) {
        source = clickIdInfo.platform.source;
      } else {
        source = '(none)';
      }
    }
    
    // Determine medium: utm_medium > first found click ID > (none)
    let medium = params.utm_medium;
    if (!medium) {
      const clickIdInfo = findFirstClickId(params);
      if (clickIdInfo) {
        medium = clickIdInfo.platform.medium;
      } else {
        medium = '(none)';
      }
    }
    
    // Determine campaign: utm_campaign/custom > first found click ID > promocode > (none)
    let campaign = params[campaignParamName] || params.utm_campaign;
    if (!campaign) {
      const clickIdInfo = findFirstClickId(params);
      if (clickIdInfo) {
        campaign = clickIdInfo.platform.campaign;
      } else if (promocode) {
        campaign = promocode;
      } else {
        campaign = '(none)';
      }
    }
    
    return {
      typ: 'utm',
      src: source,
      mdm: medium,
      cmp: campaign,
      cnt: params[contentParamName] || params.utm_content || '(none)',
      trm: params[termParamName] || params.utm_term || termFromReferer || '(none)'
    };
  }
  
  // Legacy version does NOT use URL promocode for traffic type detection
  // Promocode is only randomly generated and stored in a cookie
  // Therefore we do not check promocode here
  
  // Check click IDs — if any click ID is present but no UTM
  const clickIdInfo = findFirstClickId(params);
  if (clickIdInfo) {
    return {
      typ: 'utm',
      src: clickIdInfo.platform.source,
      mdm: clickIdInfo.platform.medium,
      cmp: params[campaignParamName] || params.utm_campaign || clickIdInfo.platform.campaign,
      cnt: params[contentParamName] || params.utm_content || '(none)',
      trm: params[termParamName] || params.utm_term || termFromReferer || '(none)'
    };
  }
  
  // Check organic traffic
  const referer = document.referrer;
  const hasExternalReferer = !!referer && checkRefererHost(referer);
  if (hasExternalReferer) {
    const organic = isOrganic(referer, customOrganics);
    if (organic.isOrganic && organic.source) {
      return {
        typ: 'organic',
        src: organic.source,
        mdm: 'organic',
        cmp: '(none)',
        cnt: '(none)',
        trm: '(none)'
      };
    }
  }

  // In-app browser detection — runs after organic and before referral.
  // Catches webview visits where document.referrer is empty, app-controlled
  // (e.g. instagram.com/l.facebook.com), or external — the UA marker is the
  // more reliable signal.
  const inApp = detectInAppBrowser(inAppBrowsers);
  if (inApp) {
    return {
      typ: 'in_app',
      src: inApp.source,
      mdm: inApp.medium,
      cmp: '(none)',
      cnt: '(none)',
      trm: '(none)'
    };
  }

  // Check referral traffic (only if there is an external referer and no active session)
  if (hasExternalReferer && !hasSession) {
    const referral = isReferral(referer, customReferrals);
    if (referral.isReferral) {
      return {
        typ: 'referral',
        src: referral.source || '(none)',
        mdm: referral.medium || 'referral',
        cmp: '(none)',
        cnt: referral.content || '(none)',
        trm: '(none)'
      };
    }
  }

  // Return typein using attributes from config
  return {
    typ: 'typein',
    src: typeinAttributes.source,
    mdm: typeinAttributes.medium,
    cmp: '(none)',
    cnt: '(none)',
    trm: '(none)'
  };
}

