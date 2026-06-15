import type { IntkData, TrafficSource, Touchpoint } from '../types';

/**
 * DataLayer integration types
 */
export interface IntkUserProfile {
  traffic_attribution: {
    first_visit: FirstVisitData;
    current_visit: CurrentVisitData;
    touchpoint_chain: TouchpointChainData[];
  };
  identity: {
    user_id?: string;
    pii_hashes?: {
      email_sha256?: string;
      phone_sha256?: string;
    };
    click_ids?: {
      google?: string;
      facebook?: string;
      microsoft?: string;
      tiktok?: string;
      linkedin?: string;
      twitter?: string;
      snapchat?: string;
      pinterest?: string;
      [key: string]: string | undefined;
    };
    analytics_ids?: {
      google_analytics_client?: string;
      google_analytics_session?: string;
      amplitude_client?: string;
      mixpanel_id?: string;
      [key: string]: string | undefined;
    };
  };
  browser?: {
    user_agent: string;
    browser_type: string;
    is_in_app: boolean;
    in_app_source?: string;
    language: string;
  };
  metadata: {
    version: string;
    consent_status?: {
      analytics_storage?: 'granted' | 'denied';
      ad_storage?: 'granted' | 'denied';
    };
    operating_mode?: 'persistent_storage' | 'parameter_forwarding';
  };
}

interface FirstVisitData {
  type: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  timestamp: string; // ISO 8601 format
  landing_page: string;
}

interface CurrentVisitData {
  type: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  session_page_views: number;
  current_page: string;
}

interface TouchpointChainData {
  type: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  timestamp: string; // ISO 8601 format
}

/**
 * Converts TrafficSource to ISO 8601 timestamp format
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Converts date string from format "YYYY-MM-DD HH:MM:SS" to ISO 8601
 */
function convertDateToISO(dateStr: string): string {
  if (!dateStr || dateStr === '(none)') {
    return new Date().toISOString();
  }

  // Try to parse the format "YYYY-MM-DD HH:MM:SS"
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10)
    );
    return date.toISOString();
  }

  // If already ISO format or other format, try to parse as-is
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // Fallback to current time
  return new Date().toISOString();
}

/**
 * Converts TrafficSource to first visit data format
 */
function convertToFirstVisitData(
  source: TrafficSource,
  add: { fd: string; ep: string; rf: string }
): FirstVisitData {
  return {
    type: source.typ || '(none)',
    source: source.src || '(none)',
    medium: source.mdm || '(none)',
    campaign: source.cmp || '(none)',
    content: source.cnt || '(none)',
    term: source.trm || '(none)',
    timestamp: convertDateToISO(add.fd),
    landing_page: add.ep || window.location.href
  };
}

/**
 * Converts TrafficSource to current visit data format
 */
function convertToCurrentVisitData(
  source: TrafficSource,
  add: { fd: string; ep: string; rf: string },
  sessionPageViews: number
): CurrentVisitData {
  return {
    type: source.typ || '(none)',
    source: source.src || '(none)',
    medium: source.mdm || '(none)',
    campaign: source.cmp || '(none)',
    content: source.cnt || '(none)',
    term: source.trm || '(none)',
    session_page_views: sessionPageViews,
    current_page: add.ep || window.location.href
  };
}

/**
 * Converts Touchpoint to touchpoint chain data format
 */
function convertToTouchpointChainData(touchpoint: Touchpoint): TouchpointChainData {
  return {
    type: touchpoint.typ || '(none)',
    source: touchpoint.src || '(none)',
    medium: touchpoint.mdm || '(none)',
    campaign: touchpoint.cmp || '(none)',
    content: touchpoint.cnt || '(none)',
    term: touchpoint.trm || '(none)',
    timestamp: formatTimestamp(touchpoint.ts)
  };
}

/**
 * Converts click_ids object to dataLayer format
 */
function convertClickIds(clickIds?: { [key: string]: string | undefined }): {
  google?: string;
  facebook?: string;
  microsoft?: string;
  tiktok?: string;
  linkedin?: string;
  twitter?: string;
  snapchat?: string;
  pinterest?: string;
  [key: string]: string | undefined;
} {
  if (!clickIds) {
    return {};
  }

  const result: { [key: string]: string | undefined } = {};

  // Map known click IDs
  if (clickIds.gclid) result.google = clickIds.gclid;
  if (clickIds.fbclid) result.facebook = clickIds.fbclid;
  if (clickIds.msclkid) result.microsoft = clickIds.msclkid;
  if (clickIds.ttclid) result.tiktok = clickIds.ttclid;
  if (clickIds.li_fatid) result.linkedin = clickIds.li_fatid;
  if (clickIds.twclid) result.twitter = clickIds.twclid;
  if (clickIds.snapclid) result.snapchat = clickIds.snapclid;
  if (clickIds.pclid) result.pinterest = clickIds.pclid;

  // Add any other custom click IDs
  Object.keys(clickIds).forEach(key => {
    if (!['gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fatid', 'twclid', 'snapclid', 'pclid'].includes(key)) {
      result[key] = clickIds[key];
    }
  });

  return result;
}

/**
 * Converts analytics_ids object to dataLayer format
 */
function convertAnalyticsIds(analyticsIds?: { [key: string]: string | undefined }): {
  google_analytics_client?: string;
  google_analytics_session?: string;
  amplitude_client?: string;
  mixpanel_id?: string;
  [key: string]: string | undefined;
} {
  if (!analyticsIds) {
    return {};
  }

  const result: { [key: string]: string | undefined } = {};

  // Map known analytics IDs
  if (analyticsIds.ga_client_id) result.google_analytics_client = analyticsIds.ga_client_id;
  if (analyticsIds.ga_session_id) result.google_analytics_session = analyticsIds.ga_session_id;
  if (analyticsIds.amplitude_id) result.amplitude_client = analyticsIds.amplitude_id;
  if (analyticsIds.mixpanel_id) result.mixpanel_id = analyticsIds.mixpanel_id;

  // Add any other custom analytics IDs
  Object.keys(analyticsIds).forEach(key => {
    if (!['ga_client_id', 'ga_session_id', 'amplitude_id', 'mixpanel_id'].includes(key)) {
      result[key] = analyticsIds[key];
    }
  });

  return result;
}

/**
 * Builds intk_user_profile object from IntkData
 */
export function buildUserProfile(data: IntkData, version: string = '2.2.0'): IntkUserProfile {
  // Build traffic attribution
  const firstVisit = convertToFirstVisitData(data.first, data.first_add);
  const currentVisit = convertToCurrentVisitData(
    data.current,
    data.current_add,
    data.session.pgs
  );

  // Build touchpoint chain
  const touchpointChain: TouchpointChainData[] = [];
  if (data.touchpoints?.touchpoints) {
    touchpointChain.push(...data.touchpoints.touchpoints.map(convertToTouchpointChainData));
  }

  // Build identity
  const identity: IntkUserProfile['identity'] = {
    user_id: data.user_id || undefined,
    pii_hashes: data.pii_hashes
      ? {
          email_sha256: data.pii_hashes.email_hash,
          phone_sha256: data.pii_hashes.phone_hash
        }
      : undefined,
    click_ids: data.click_ids ? convertClickIds(data.click_ids) : undefined,
    analytics_ids: data.analytics_ids ? convertAnalyticsIds(data.analytics_ids) : undefined
  };

  // Remove undefined fields from identity
  if (!identity.user_id && !identity.pii_hashes && !identity.click_ids && !identity.analytics_ids) {
    identity.user_id = undefined;
  } else {
    // Clean up undefined fields
    if (identity.pii_hashes && !identity.pii_hashes.email_sha256 && !identity.pii_hashes.phone_sha256) {
      identity.pii_hashes = undefined;
    }
    if (identity.click_ids && Object.keys(identity.click_ids).length === 0) {
      identity.click_ids = undefined;
    }
    if (identity.analytics_ids && Object.keys(identity.analytics_ids).length === 0) {
      identity.analytics_ids = undefined;
    }
  }

  // Extract metadata from IntkData if available
  const metadata = data.metadata || {};

  // Build browser section from browser_info
  const browser = data.browser_info
    ? {
        user_agent: data.browser_info.user_agent,
        browser_type: data.browser_info.browser_type,
        is_in_app: data.browser_info.is_in_app,
        ...(data.browser_info.in_app_source ? { in_app_source: data.browser_info.in_app_source } : {}),
        language: data.browser_info.language
      }
    : undefined;

  return {
    traffic_attribution: {
      first_visit: firstVisit,
      current_visit: currentVisit,
      touchpoint_chain: touchpointChain
    },
    identity,
    ...(browser ? { browser } : {}),
    metadata: {
      version,
      consent_status: metadata.consent_status,
      operating_mode: metadata.operating_mode || 'persistent_storage' // Default to persistent_storage for backward compatibility
    }
  };
}

/**
 * Pushes data to dataLayer (Google Tag Manager)
 */
export function pushToDataLayer(profile: IntkUserProfile): void {
  // Ensure dataLayer exists
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize dataLayer if it doesn't exist
  if (!window.dataLayer) {
    (window as any).dataLayer = [];
  }

  // Push event and profile to dataLayer
  (window as any).dataLayer.push({
    event: 'intk_ready',
    intk_user_profile: profile
  });
}

/**
 * Pushes email capture event to dataLayer (Google Tag Manager)
 * Fires when email is captured from form inputs
 */
export function pushEmailToDataLayer(profile: IntkUserProfile): void {
  // Ensure dataLayer exists
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize dataLayer if it doesn't exist
  if (!window.dataLayer) {
    (window as any).dataLayer = [];
  }

  // Push email event and profile to dataLayer
  (window as any).dataLayer.push({
    event: 'intk_email',
    intk_user_profile: profile
  });
}

/**
 * Pushes phone capture event to dataLayer (Google Tag Manager)
 * Fires when phone is captured from form inputs
 */
export function pushPhoneToDataLayer(profile: IntkUserProfile): void {
  // Ensure dataLayer exists
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize dataLayer if it doesn't exist
  if (!window.dataLayer) {
    (window as any).dataLayer = [];
  }

  // Push phone event and profile to dataLayer
  (window as any).dataLayer.push({
    event: 'intk_phone',
    intk_user_profile: profile
  });
}

/**
 * Main function to build and push user profile to dataLayer
 */
export function sendToDataLayer(data: IntkData, version: string = '2.2.0'): void {
  const profile = buildUserProfile(data, version);
  pushToDataLayer(profile);
}

/**
 * Sends email capture event to dataLayer
 */
export function sendEmailToDataLayer(data: IntkData, version: string = '2.2.0'): void {
  const profile = buildUserProfile(data, version);
  pushEmailToDataLayer(profile);
}

/**
 * Sends phone capture event to dataLayer
 */
export function sendPhoneToDataLayer(data: IntkData, version: string = '2.2.0'): void {
  const profile = buildUserProfile(data, version);
  pushPhoneToDataLayer(profile);
}
