export interface TrafficSource {
  /** Traffic type: 'utm' | 'organic' | 'referral' | 'in_app' | 'typein'. */
  typ: string;
  src: string;
  mdm: string;
  cmp: string;
  cnt: string;
  trm: string;
}

export interface ExtraData {
  fd: string;
  ep: string;
  rf: string;
}

export interface SessionData {
  pgs: number;  // Number - more logical than string
  cpg: string;
}

export interface UserData {
  vst: number;  // Number - more logical than string
  uip: string;
  uag: string;
}

export interface PromoData {
  code?: string;
}

export interface Touchpoint {
  typ: string;
  src: string;
  mdm: string;
  cmp: string;
  cnt: string;
  trm: string;
  ts: number;  // timestamp in milliseconds
}

export interface TouchpointChain {
  touchpoints: Touchpoint[];
}

export type AttributionModel = 'first' | 'last' | 'linear' | 'u-shaped' | 'time-decay';

export interface AttributionCredit {
  touchpoint: Touchpoint;
  credit: number;  // 0 to 1 (credit percentage)
}

export interface AttributionResult {
  model: AttributionModel;
  credits: AttributionCredit[];
  totalCredit: number;  // should equal 1.0 (100%)
}

export interface ClickIds {
  // Google Ads identifiers
  gclid?: string;      // Google Ads (primary click ID for web traffic)
  wbraid?: string;     // Google Ads (web-to-app conversions)
  gbraid?: string;     // Google Ads (app-to-web conversions, iOS)
  dclid?: string;      // Google Display & Video 360 (DV360)
  
  // Facebook/Meta Ads
  fbclid?: string;     // Facebook Ads
  
  // Microsoft Advertising
  msclkid?: string;    // Microsoft Advertising (Bing Ads)
  
  // TikTok Ads
  ttclid?: string;     // TikTok Ads
  
  // LinkedIn Ads
  li_fatid?: string;   // LinkedIn Ads
  
  // Twitter/X Ads
  twclid?: string;     // Twitter Ads
  
  // Snapchat Ads
  snapclid?: string;   // Snapchat Ads
  
  // Pinterest Ads
  pclid?: string;      // Pinterest Ads
  
  [key: string]: string | undefined;  // For other platforms
}

export interface AnalyticsIds {
  // Google Analytics
  ga_client_id?: string;    // Google Analytics Client ID (from _ga cookie)
  ga_session_id?: string;    // Google Analytics Session ID (from _ga_* cookie)
  
  // Amplitude
  amplitude_id?: string;     // Amplitude ID (from amp_* cookies)
  
  // Mixpanel
  mixpanel_id?: string;      // Mixpanel distinct_id (from distinct_id cookie)
  
  // Custom analytics IDs
  [key: string]: string | undefined;  // For custom configurations
}

export interface PiiHashes {
  email_hash?: string;    // SHA-256 hash of normalized email
  phone_hash?: string;     // SHA-256 hash of normalized phone number
}

export interface ConsentStatus {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
}

export type OperatingMode = 'persistent_storage' | 'parameter_forwarding';

export interface IntkMetadata {
  consent_status?: ConsentStatus;
  operating_mode?: OperatingMode;
}

export interface IntkData {
  current: TrafficSource;
  current_add: ExtraData;
  first: TrafficSource;
  first_add: ExtraData;
  session: SessionData;
  udata: UserData;
  promo: PromoData;  // Always present, empty object if no promocode cookie
  touchpoints?: TouchpointChain;  // Optional for backward compatibility
  click_ids?: ClickIds;  // Optional for backward compatibility
  analytics_ids?: AnalyticsIds;  // Optional for backward compatibility
  pii_hashes?: PiiHashes;  // Optional for backward compatibility
  user_id?: string;  // Optional User ID
  metadata?: IntkMetadata;  // Privacy-First Architecture metadata
}

// === Configuration Types ===
export interface PromocodeConfig {
  min: number;
  max: number;
}

export interface DomainConfig {
  host: string;
  isolate: boolean;
}

export interface TypeinAttributes {
  source: string;
  medium: string;
}

export interface OrganicSource {
  host: string;
  param: string;
  display?: string;
}

export interface ReferralSource {
  host: string;
  display?: string;
  medium?: string;
}

/**
 * Pattern describing an in-app browser (webview) to detect from navigator.userAgent.
 *
 * Used by the in-app browser detection layer in detectTrafficSource(), which fires
 * only when traffic would otherwise be classified as 'typein' (no UTM, no click ID,
 * no organic, no referral). When a pattern matches, the result is:
 *   { typ: 'in_app', src: <source>, mdm: <medium ?? 'in_app'> }
 *
 * @example
 * { pattern: 'Instagram|IGApp', source: 'instagram' }
 * { pattern: 'FBAN|FBAV|FB_IAB', source: 'facebook', medium: 'in_app' }
 */
export interface InAppBrowserSource {
  /** Regular expression source matched against navigator.userAgent (case-insensitive). A plain substring like 'Instagram' is a valid regex. */
  pattern: string;
  /** Source label, e.g. 'instagram', 'facebook'. */
  source: string;
  /** Medium label. Defaults to 'in_app'. */
  medium?: string;
}

export interface GoogleAnalyticsConfig {
  cookie_name?: string;           // default: '_ga'
  client_id_pattern?: string;      // default: 'GA1.\\d+\\.(.+)' for extracting Client ID
  session_cookie_pattern?: string; // default: '_ga_*' for finding Session ID cookies
}

export interface AmplitudeConfig {
  cookie_name?: string;            // default: 'amp_*' pattern
}

export interface CustomAnalyticsConfig {
  name: string;                     // Name for storing in analytics_ids
  cookie_name: string;              // Cookie name or pattern (e.g., 'custom_*')
  pattern?: string;                 // Regex pattern for extracting ID from cookie value
}

export interface AnalyticsIdsConfig {
  google_analytics?: GoogleAnalyticsConfig | boolean;  // true = use defaults
  amplitude?: AmplitudeConfig | boolean;
  mixpanel?: boolean;              // true = use defaults (distinct_id cookie)
  custom?: CustomAnalyticsConfig[];
}

export interface PiiCollectionConfig {
  enabled: boolean;
  email_selectors?: string[];     // CSS selectors for email fields, default: ['input[type="email"]']
  phone_selectors?: string[];     // CSS selectors for phone fields, default: ['input[type="tel"]']
}

export interface UserIdConfig {
  source: 'dataLayer' | 'cookie' | 'localStorage' | 'function';
  key?: string;                    // Key for dataLayer/cookie/localStorage
  function?: () => string | null;  // Function to retrieve User ID (for source: 'function')
  lifetime?: number;               // Lifetime in minutes (default: 6 months = 259200)
  cookieDomain?: string;           // Cookie domain (optional)
}

/**
 * Mapping for custom consent field names in dataLayer events.
 * Use this when your CMP uses non-standard field names.
 */
export interface ConsentFieldMapping {
  analytics_storage?: string;  // Field name for analytics consent (e.g., 'statistics', 'analytics', 'C0002')
  ad_storage?: string;         // Field name for advertising consent (e.g., 'marketing', 'advertising', 'C0004')
}

/**
 * Configuration for the DataLayer consent listener.
 * This is the new recommended way to detect consent changes.
 */
export interface ConsentListenerConfig {
  enabled: boolean;
  default_consent: 'granted' | 'denied';
  
  /**
   * Custom event names to listen for in dataLayer.
   * Built-in parsers already support common CMPs like OneTrust, Cookiebot, etc.
   * Use this to add support for custom or unknown CMPs.
   * @example ['my_cmp_consent_updated', 'custom_consent_event']
   */
  event_names?: string[];
  
  /**
   * Custom parser function for unknown CMPs.
   * Called for each dataLayer item. Return ConsentStatus if consent found, null otherwise.
   * @example
   * ```typescript
   * custom_parser: (item) => {
   *   if (item.event === 'myCustomEvent') {
   *     return { analytics_storage: item.stats ? 'granted' : 'denied', ad_storage: 'denied' };
   *   }
   *   return null;
   * }
   * ```
   */
  custom_parser?: (item: any) => ConsentStatus | null;
  
  /**
   * Mapping for custom consent field names.
   * Use with event_names to parse custom CMP events.
   * @example { analytics_storage: 'analyticsConsent', ad_storage: 'marketingConsent' }
   */
  field_mapping?: ConsentFieldMapping;
  
  /**
   * @deprecated Use dataLayer listener instead (default behavior).
   * Whether to fall back to gtag polling if no dataLayer events are detected.
   * @default false
   */
  fallback_to_gtag?: boolean;
  
  /**
   * @deprecated Use dataLayer listener instead (default behavior).
   * Maximum time to wait for gtag to load in milliseconds.
   * Only used if fallback_to_gtag is true.
   * @default 3000
   */
  wait_for_gtag_timeout?: number;
}

/**
 * Consent Mode configuration.
 * Supports both the new dataLayer-based detection and legacy gtag polling.
 */
/**
 * Configuration for external link decoration.
 * When enabled, decorates outbound links to allowed domains with UTM parameters and click IDs.
 */
export interface LinkDecorationConfig {
  /**
   * Enable/disable link decoration. Default: false
   */
  enabled: boolean;
  
  /**
   * List of domains to decorate links for.
   * Supports exact match ('partner.com') and wildcard subdomains ('*.partner.com').
   * @example ['partner.com', '*.example.org', 'app.mysite.com']
   */
  allowedDomains: string[];
  
  /**
   * Whether to pass UTM parameters (utm_source, utm_medium, utm_campaign, utm_content, utm_term).
   * @default true
   */
  decorateUtm?: boolean;
  
  /**
   * Whether to pass click IDs (gclid, fbclid, msclkid, ttclid, etc.).
   * @default true
   */
  decorateClickIds?: boolean;
  
  /**
   * Additional custom parameters to add to decorated links.
   * @example { affiliate_id: 'abc123', partner: 'xyz' }
   */
  customParams?: Record<string, string>;
}

export interface ConsentModeConfig {
  enabled: boolean;
  
  /**
   * Default consent status if consent cannot be detected.
   * @default 'denied'
   */
  default_consent?: 'granted' | 'denied';
  
  /**
   * Custom event names to listen for in dataLayer.
   * Built-in parsers support common CMPs (OneTrust, Cookiebot, Axeptio, etc.).
   * @example ['my_cmp_consent_updated']
   */
  event_names?: string[];
  
  /**
   * Custom parser function for unknown CMPs.
   * @example (item) => item.event === 'myEvent' ? { analytics_storage: 'granted', ad_storage: 'denied' } : null
   */
  custom_parser?: (item: any) => ConsentStatus | null;
  
  /**
   * Mapping for custom consent field names in dataLayer events.
   * @example { analytics_storage: 'stats', ad_storage: 'marketing' }
   */
  field_mapping?: ConsentFieldMapping;
  
  /**
   * Enable/disable URL passthrough when consent is denied.
   * Similar to Google Consent Mode's url_passthrough setting.
   *
   * When true, UTM params and click IDs (gclid, fbclid, etc.) are passed
   * via window.name and automatically appended to same-origin links.
   * When false (default), no tracking data is transferred between pages when consent is denied.
   *
   * @default false
   * @see https://developers.google.com/tag-platform/security/guides/consent?hl=en#passthroughs
   */
  url_passthrough?: boolean;
  
  /**
   * @deprecated The new dataLayer listener is the default and recommended approach.
   * This option is kept for backward compatibility.
   * Maximum time to wait for gtag to load in milliseconds.
   * @default 3000
   */
  wait_for_gtag_timeout?: number;
}

export interface IntkConfig {
  lifetime?: number;              // months, default: 6
  session_length?: number;        // minutes, default: 30
  timezone_offset?: number;       // hours
  campaign_param?: string | false;
  term_param?: string | false;
  content_param?: string | false;
  user_ip?: string;
  promocode?: PromocodeConfig | false;
  typein_attributes?: TypeinAttributes;
  domain?: string | DomainConfig;
  organics?: OrganicSource[];
  referrals?: ReferralSource[];
  /**
   * When true, a referral arriving during an active session ends the current
   * session and starts a new one (page counter resets to 1, visits increment,
   * `intk_current` is updated, and a new touchpoint is appended). When false
   * (default), referrals inside an active session are ignored — same as today.
   * UTM, organic, in-app and typein detection are unaffected.
   * @default false
   */
  referral_starts_new_session?: boolean;
  /**
   * In-app browser detection list. Detects webview traffic (Instagram, Facebook,
   * TikTok, Telegram, etc.) via navigator.userAgent when no UTM/click ID/organic/
   * referral signal is present. Without it, such visits fall into 'typein'.
   *
   * - `undefined` — use built-in defaults (Instagram, Facebook, TikTok, LinkedIn,
   *   Twitter, Snapchat, Pinterest, Telegram, Viber, WhatsApp, KakaoTalk, Weibo,
   *   WeChat, Line, generic Android webview).
   * - `Array` — custom entries prepended to the built-in defaults.
   * - `false` — disable the layer entirely.
   */
  in_app_browsers?: InAppBrowserSource[] | false;
  analytics_ids?: AnalyticsIdsConfig;
  pii_collection?: PiiCollectionConfig;
  user_id?: UserIdConfig;            // Configuration for automatic User ID retrieval
  spa_tracking?: boolean;            // Enable/disable SPA History API tracking, default: true
  data_layer?: boolean;              // Enable/disable dataLayer integration, default: true
  consent_mode?: ConsentModeConfig;  // Consent Mode v2 configuration
  link_decoration?: LinkDecorationConfig;  // External link decoration configuration
  callback?: (data: IntkData) => void;
}

// === Internal Config (all defaults resolved) ===
export interface ResolvedLinkDecorationConfig {
  enabled: boolean;
  allowedDomains: string[];
  decorateUtm: boolean;
  decorateClickIds: boolean;
  customParams: Record<string, string>;
}

export interface ResolvedConfig {
  lifetime: number;               // in minutes (converted)
  session_length: number;
  timezone_offset: number | null;
  campaign_param: string | false;
  term_param: string | false;
  content_param: string | false;
  user_ip: string;
  promocode: PromocodeConfig | false;
  typein_attributes: TypeinAttributes;
  domain: DomainConfig;
  organics: OrganicSource[];
  referrals: ReferralSource[];
  /** Always an array; empty when in_app_browsers === false. */
  in_app_browsers: InAppBrowserSource[];
  referral_starts_new_session: boolean;
  link_decoration: ResolvedLinkDecorationConfig;
}

