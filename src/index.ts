import type { IntkData, TrafficSource, IntkConfig, AttributionModel, AttributionResult, ConsentStatus, OperatingMode, ConsentListenerConfig } from './types';
import { detectTrafficSource } from './core';
import { packMain, packExtra, packSession, packUser, packPromo } from './data';
import { get, set, parse } from './helpers/cookies';
import { resolveConfig } from './config';
import { getHost } from './helpers/uri';
import { addTouchpoint, getTouchpointChain } from './attribution/touchpoint-chain';
import { getAttribution } from './attribution/models';
import { collectClickIds } from './identity/click-ids';
import { collectAnalyticsIds } from './identity/analytics-ids';
import { collectPiiFromForms, watchForms, getPiiHashes, PiiChangeType } from './identity/form-watcher';
import { initUserId, setUserId } from './identity/user-id';
import { sendToDataLayer, sendEmailToDataLayer, sendPhoneToDataLayer } from './integration/data-layer';
import { trackHistoryAPI } from './spa/history-tracker';
import { checkConsent, resolveConsentConfig } from './privacy/consent';
import { initParameterForwarding, readFromRuntimeMemory, readParametersFromURL } from './privacy/parameter-forwarding';
import { withdrawConsent as withdrawConsentInternal } from './privacy/consent-withdrawal';
import { createDataLayerInterceptor, readConsentFromDataLayer } from './privacy/consent-listener';
import { initLinkDecoration } from './privacy/link-decoration';
import { buildBrowserInfo } from './browser/detect';

function parseTrafficSource(container: string): TrafficSource {
  const data = parse(container);
  return {
    typ: data.typ || '',
    src: data.src || '',
    mdm: data.mdm || '',
    cmp: data.cmp || '',
    cnt: data.cnt || '',
    trm: data.trm || ''
  };
}

function parseExtraData(container: string) {
  const data = parse(container);
  return {
    fd: data.fd || '',
    ep: data.ep || '',
    rf: data.rf || ''
  };
}

function parseSessionData(container: string) {
  const data = parse(container);
  return {
    pgs: parseInt(data.pgs || '1', 10),
    cpg: data.cpg || window.location.href
  };
}

function parseUserData(container: string) {
  const data = parse(container);
  return {
    vst: parseInt(data.vst || '1', 10),
    uip: data.uip || '(none)',
    uag: data.uag || navigator.userAgent
  };
}

function parsePromoData(container: string | null): { code?: string } {
  if (!container) {
    return {};  // Empty object if no cookie, matching legacy behavior
  }
  const data = parse(container);
  return {
    code: data.code || undefined
  };
}

/**
 * Conditionally sets a cookie only if consent is granted
 * If consent is denied, this function does nothing (no cookies/localStorage/sessionStorage)
 *
 * @param consentGranted - Whether consent is granted
 * @param name - Cookie name
 * @param value - Cookie value
 * @param minutes - Cookie lifetime in minutes
 * @param domain - Cookie domain
 */
function setIfConsentGranted(
  consentGranted: boolean,
  name: string,
  value: string,
  minutes?: number,
  domain?: string
): void {
  if (consentGranted) {
    set(name, value, minutes, domain);
  }
  // When consent = denied, do not write cookies
}

const intk = {
  get: {} as IntkData,
  _piiWatcher: null as (() => void) | null, // Stores the PII tracking cleanup function
  _historyWatcher: null as (() => void) | null, // Stores the History API tracking cleanup function
  _dataLayerEnabled: true, // dataLayer flag (updated in init)
  _config: null as IntkConfig | null, // Stored config for use in trackPageview
  _lastTrackedUrl: null as string | null, // Prevents duplicate trackPageview calls
  _consentStatus: null as ConsentStatus | null, // Current consent status
  _operatingMode: null as OperatingMode | null, // Current operating mode
  _parameterForwardingWatcher: null as (() => void) | null, // Stores the parameter forwarding cleanup function
  _consentPollingInterval: null as number | null, // Legacy consent change polling interval
  _consentListenerCleanup: null as (() => void) | null, // Cleanup function for dataLayer consent listener
  _cookieDomain: null as string | undefined | null, // Stored cookieDomain for use in other methods
  _urlPassthroughEnabled: false as boolean, // URL passthrough setting (like Google Consent Mode)
  _linkDecorationWatcher: null as (() => void) | null, // Cleanup function for link decoration
  init: function(config?: IntkConfig) {
    // Resolve config with default values
    const resolvedConfig = resolveConfig(config);

    // Check Consent Mode configuration
    const consentConfig = resolveConsentConfig(config?.consent_mode);

    // Start with the assumption that consent = defaultConsent (safe default)
    // This is a temporary value that will be updated event-driven via dataLayer listener
    const initialConsentStatus: ConsentStatus = {
      analytics_storage: consentConfig.defaultConsent,
      ad_storage: consentConfig.defaultConsent
    };
    let operatingMode: OperatingMode = checkConsent(initialConsentStatus) ? 'persistent_storage' : 'parameter_forwarding';

    // Store for use in other methods
    intk._consentStatus = initialConsentStatus;
    intk._operatingMode = operatingMode;

    // Store url_passthrough setting (default: false)
    intk._urlPassthroughEnabled = config?.consent_mode?.url_passthrough === true;

    // Initialize parameter forwarding if consent = denied and url_passthrough is enabled
    const initialConsentGranted = checkConsent(initialConsentStatus);
    if (!initialConsentGranted && intk._urlPassthroughEnabled) {
      // Stop previous tracking if active
      if (intk._parameterForwardingWatcher) {
        intk._parameterForwardingWatcher();
        intk._parameterForwardingWatcher = null;
      }

      // Initialize parameter forwarding mechanism (temporary, will be updated)
      intk._parameterForwardingWatcher = initParameterForwarding();
    }

    // Consent change handler (used by dataLayer listener)
    const handleConsentChange = (status: ConsentStatus, isInitialLoad: boolean = false) => {
      const newConsentGranted = checkConsent(status);
      const oldConsentGranted = intk._consentStatus ? checkConsent(intk._consentStatus) : false;

      // Skip if consent hasn't actually changed
      if (intk._consentStatus &&
          intk._consentStatus.analytics_storage === status.analytics_storage &&
          intk._consentStatus.ad_storage === status.ad_storage) {
        return;
      }

      intk._consentStatus = status;
      intk._operatingMode = newConsentGranted ? 'persistent_storage' : 'parameter_forwarding';

      // If consent was revoked (was granted, became denied)
      if (oldConsentGranted && !newConsentGranted) {
        // Clear all data
        withdrawConsentInternal(cookieDomain);
        // Enable parameter forwarding (if url_passthrough is enabled)
        if (!intk._parameterForwardingWatcher && intk._urlPassthroughEnabled) {
          intk._parameterForwardingWatcher = initParameterForwarding();
        }
        // Disable link decoration on consent withdrawal
        if (intk._linkDecorationWatcher) {
          intk._linkDecorationWatcher();
          intk._linkDecorationWatcher = null;
        }
      } else if (!oldConsentGranted && newConsentGranted) {
        // Consent granted (was denied, became granted)
        // Disable parameter forwarding
        if (intk._parameterForwardingWatcher) {
          intk._parameterForwardingWatcher();
          intk._parameterForwardingWatcher = null;
        }

        // Enable link decoration on consent grant (if configured)
        if (!intk._linkDecorationWatcher && intk._config) {
          const linkDecorationConfig = resolveConfig(intk._config).link_decoration;
          if (linkDecorationConfig.enabled && linkDecorationConfig.allowedDomains.length > 0) {
            intk._linkDecorationWatcher = initLinkDecoration(
              linkDecorationConfig,
              () => intk.get
            );
          }
        }

        // If this is the initial load and data is already processed, rewrite cookies with current data
        // This is needed because during first initialization we started with the assumption of denied,
        // but now received actual granted status and need to write cookies
        if (isInitialLoad && intk.get && intk._config) {
          try {
            // Rewrite cookies using current data from intk.get
            // This is safe because the data is already processed and stored in memory
            const config = resolveConfig(intk._config);
            const domainConfig = config.domain;
            const currentHost = getHost(window.location.href);
            const cookieDomain = (!domainConfig.isolate && domainConfig.host && domainConfig.host !== currentHost)
              ? domainConfig.host
              : undefined;
            const lifetime = config.lifetime;
            const sessionLength = config.session_length;
            const timezoneOffset = config.timezone_offset ?? null;

            // Rewrite all cookies with current data
            if (intk.get.first) {
              set('intk_first', packMain(intk.get.first), lifetime, cookieDomain);
              if (intk.get.first_add) {
                set('intk_first_add', packExtra(timezoneOffset), lifetime, cookieDomain);
              }
            }
            if (intk.get.current) {
              set('intk_current', packMain(intk.get.current), lifetime, cookieDomain);
              if (intk.get.current_add) {
                set('intk_current_add', packExtra(timezoneOffset), lifetime, cookieDomain);
              }
            }
            if (intk.get.session) {
              set('intk_session', packSession(intk.get.session.pgs), sessionLength, cookieDomain);
            }
            if (intk.get.udata) {
              set('intk_udata', packUser(intk.get.udata.vst, intk.get.udata.uip), lifetime, cookieDomain);
            }
          } catch (error) {
            console.warn('Intake: Error rewriting cookies after consent granted:', error);
          }
        }
      } else if (!newConsentGranted && !intk._parameterForwardingWatcher && intk._urlPassthroughEnabled) {
        // Consent denied and parameter forwarding not active — enable it (if url_passthrough is enabled)
        intk._parameterForwardingWatcher = initParameterForwarding();
      } else if (newConsentGranted && intk._parameterForwardingWatcher) {
        // Consent granted and parameter forwarding active — disable it
        intk._parameterForwardingWatcher();
        intk._parameterForwardingWatcher = null;
      }

      // Update metadata in intk.get
      if (intk.get.metadata) {
        intk.get.metadata.consent_status = status;
        intk.get.metadata.operating_mode = intk._operatingMode;
      }

      // Update dataLayer if enabled
      // Only push to dataLayer if intk.get is properly initialized (has first source)
      if (intk._dataLayerEnabled && intk.get.first) {
        sendToDataLayer(intk.get);
      }
    };

    // If Consent Mode is enabled, use the new dataLayer listener (event-driven approach)
    if (consentConfig.enabled) {
      // Clean up previous consent listener if exists
      if (intk._consentListenerCleanup) {
        intk._consentListenerCleanup();
        intk._consentListenerCleanup = null;
      }

      // Clean up legacy polling if exists
      if (intk._consentPollingInterval !== null) {
        clearInterval(intk._consentPollingInterval);
        intk._consentPollingInterval = null;
      }

      // Build consent listener config from consent_mode config
      const listenerConfig: ConsentListenerConfig = {
        enabled: true,
        default_consent: consentConfig.defaultConsent,
        event_names: config?.consent_mode?.event_names,
        custom_parser: config?.consent_mode?.custom_parser,
        field_mapping: config?.consent_mode?.field_mapping
      };

      // First, check if consent is already in dataLayer (CMP may have loaded before Intake)
      const existingConsent = readConsentFromDataLayer(listenerConfig);

      if (existingConsent) {
        handleConsentChange(existingConsent, true);
      }

      // Set up dataLayer listener for future consent changes
      // This is event-driven, no polling needed!
      intk._consentListenerCleanup = createDataLayerInterceptor(
        (consent) => {
          handleConsentChange(consent, false);
        },
        listenerConfig
      );
    }

    // Extract parameters from config
    const sessionLength = resolvedConfig.session_length;
    const userIp = resolvedConfig.user_ip;
    const lifetime = resolvedConfig.lifetime;
    const domainConfig = resolvedConfig.domain;
    const currentHost = getHost(window.location.href);
    // Determine cookie domain: if isolate=true or domain matches current host, don't pass domain
    const cookieDomain = (!domainConfig.isolate && domainConfig.host && domainConfig.host !== currentHost)
      ? domainConfig.host
      : undefined;

    // Store cookieDomain for use in other methods
    intk._cookieDomain = cookieDomain;
    const typeinAttributes = resolvedConfig.typein_attributes;
    const organics = resolvedConfig.organics;
    const referrals = resolvedConfig.referrals;
    const campaignParam = resolvedConfig.campaign_param;
    const termParam = resolvedConfig.term_param;
    const contentParam = resolvedConfig.content_param;
    const promocodeConfig = resolvedConfig.promocode;
    const inAppBrowsers = resolvedConfig.in_app_browsers;
    const referralStartsNewSession = resolvedConfig.referral_starts_new_session;
    const timezoneOffset = resolvedConfig.timezone_offset;
    const callback = config?.callback;
    const piiCollectionConfig = config?.pii_collection;
    const userIdConfig = config?.user_id;
    const dataLayerEnabled = config?.data_layer !== false; // Enabled by default
    intk._dataLayerEnabled = dataLayerEnabled; // Store for use in other methods
    intk._config = config || null; // Store config for use in trackPageview

    // Check if there is an active session
    const existingSession = get('intk_session');
    const hasSession = !!existingSession;

    // Check if cookies already exist
    const existingCurrent = get('intk_current');
    const existingFirst = get('intk_first');
    const existingCurrentAdd = get('intk_current_add');
    const existingFirstAdd = get('intk_first_add');
    const existingUdata = get('intk_udata');
    let existingPromocode = get('intk_promo');

    let currentSource: TrafficSource;
    let firstSource: TrafficSource;
    let currentAdd: { fd: string; ep: string; rf: string };
    let firstAdd: { fd: string; ep: string; rf: string };
    let sessionData: { pgs: number; cpg: string };
    let udata: { vst: number; uip: string; uag: string };
    let promoData: { code?: string };

    // Detect new traffic source using the config
    const newSource = detectTrafficSource(
      hasSession,
      referrals,
      organics,
      typeinAttributes,
      campaignParam,
      termParam,
      contentParam,
      promocodeConfig,
      inAppBrowsers,
      referralStartsNewSession
    );

    // When `referralStartsNewSession` is enabled and a referral lands on top of an
    // active session, the session is split — for the rest of this page load we
    // behave as if there were no active session (new source, fresh page counter,
    // visit++, new touchpoint).
    const sessionSplitByReferral =
      hasSession && referralStartsNewSession && newSource.typ === 'referral';
    const sessionContinues = hasSession && !sessionSplitByReferral;

    if (existingFirst) {
      // First source is always preserved
      firstSource = parseTrafficSource(existingFirst);
      firstAdd = existingFirstAdd ? parseExtraData(existingFirstAdd) : { fd: '', ep: window.location.href, rf: document.referrer || '(none)' };
    } else {
      // First visit — create first source
      firstSource = newSource;
      // Use packExtra to get date with timezone_offset applied
      const firstAddData = parseExtraData(packExtra(timezoneOffset));
      firstAdd = { fd: firstAddData.fd, ep: window.location.href, rf: document.referrer || '(none)' };

      // Save first source using lifetime and domain from config
      // Only if consent granted (using current status from intk._consentStatus)
      setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_first', packMain(firstSource), lifetime, cookieDomain);
      setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_first_add', packExtra(timezoneOffset), lifetime, cookieDomain);
    }

    // Current source update logic:
    // - UTM and Organic always update current
    // - Referral updates when the session is not continuing (no prior session, or
    //   the session was just split by this referral via referral_starts_new_session)
    // - Typein never updates (old current is preserved)
    let currentSourceUpdated = false;
    if (existingCurrent) {
      const oldCurrent = parseTrafficSource(existingCurrent);

      if (newSource.typ === 'utm' || newSource.typ === 'organic') {
        // UTM and Organic always update
        currentSource = newSource;
        currentSourceUpdated = true;
      } else if (newSource.typ === 'referral' && !sessionContinues) {
        // Referral updates when the session does not continue
        currentSource = newSource;
        currentSourceUpdated = true;
      } else {
        // Typein or referral with a continuing session — do not update
        currentSource = oldCurrent;
      }
    } else {
      // First visit — set current source
      currentSource = newSource;
      currentSourceUpdated = true;
    }

    // Always update current_add (with timezone_offset applied)
    const currentAddData = parseExtraData(packExtra(timezoneOffset));
    currentAdd = { fd: currentAddData.fd, ep: window.location.href, rf: document.referrer || '(none)' };

    // Save current using lifetime and domain from config
    // Only if consent granted (using current status from intk._consentStatus)
    setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_current', packMain(currentSource), lifetime, cookieDomain);
    setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_current_add', packExtra(timezoneOffset), lifetime, cookieDomain);

    // Update session (pages_seen). If the session continues, increment the page
    // counter; otherwise start fresh at 1 (covers cold visits and referral splits).
    if (sessionContinues && existingSession) {
      const sessionParsed = parseSessionData(existingSession);
      sessionData = { pgs: sessionParsed.pgs + 1, cpg: window.location.href };
    } else {
      sessionData = { pgs: 1, cpg: window.location.href };
    }
    // Only if consent granted (using current status from intk._consentStatus)
    setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_session', packSession(sessionData.pgs), sessionLength, cookieDomain); // session_length minutes

    // Update user data (visits)
    if (existingUdata) {
      const udataParsed = parseUserData(existingUdata);
      // Visits increment whenever the session does not continue
      // (cold visit OR referral split via referral_starts_new_session).
      const newVisits = sessionContinues ? udataParsed.vst : udataParsed.vst + 1;
      // Use user_ip from config if specified and not the default value
      const finalUserIp = (userIp && userIp !== '(none)') ? userIp : (udataParsed.uip && udataParsed.uip !== '(none)' ? udataParsed.uip : userIp);
      udata = {
        vst: newVisits,
        uip: finalUserIp,
        uag: udataParsed.uag || navigator.userAgent
      };
    } else {
      udata = {
        vst: 1,
        uip: userIp,
        uag: navigator.userAgent
      };
    }
    // Only if consent granted (using current status from intk._consentStatus)
    setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_udata', packUser(udata.vst, udata.uip), lifetime, cookieDomain);

    // Save promocode cookie (only if promocode is configured and cookie doesn't exist yet)
    // Only if consent granted (using current status from intk._consentStatus)
    if (promocodeConfig && !existingPromocode) {
      setIfConsentGranted(checkConsent(intk._consentStatus!), 'intk_promo', packPromo(promocodeConfig), lifetime, cookieDomain);
      // Update existingPromocode for parsing
      existingPromocode = get('intk_promo');
    }

    // Parse promocode data (always returns an object, even if empty)
    promoData = parsePromoData(existingPromocode);

    // Add touchpoint to the chain only if currentSource was updated
    // (i.e., it's a new significant source, not the preserved old one)
    let touchpointChain;
    if (currentSourceUpdated) {
      touchpointChain = addTouchpoint(currentSource, lifetime, cookieDomain, checkConsent(intk._consentStatus!));
    } else {
      // Get existing chain without adding a new touchpoint
      touchpointChain = getTouchpointChain();
    }

    // Collect click IDs from URL and save to cookie (only if consent granted)
    const consentGranted = checkConsent(intk._consentStatus!);
    const clickIds = collectClickIds(lifetime, cookieDomain, consentGranted);

    // Initialize User ID (synchronously)
    const userId = initUserId(userIdConfig, lifetime, cookieDomain, consentGranted);

    // Initialize intk.get with synchronous data
    intk.get = {
      current: currentSource,
      current_add: currentAdd,
      first: firstSource,
      first_add: firstAdd,
      session: sessionData,
      udata: udata,
      promo: promoData,
      touchpoints: touchpointChain,
      click_ids: clickIds,
      user_id: userId || undefined,
      metadata: {
        consent_status: intk._consentStatus!,
        operating_mode: intk._operatingMode!
      },
      browser_info: buildBrowserInfo(resolvedConfig.in_app_browsers)
    };

    // If PII collection is disabled, get existing hashes from cookie synchronously
    if (!piiCollectionConfig?.enabled) {
      const existingPiiHashes = getPiiHashes();
      if (Object.keys(existingPiiHashes).length > 0) {
        intk.get.pii_hashes = existingPiiHashes;
      }
    }

    // Call callback immediately with current data (without analytics IDs and PII if not yet collected)
    if (callback) {
      callback(intk.get);
    }

    // Collect all async data and push to dataLayer once after full load
    const analyticsIdsConfig = config?.analytics_ids;
    const promises: Promise<any>[] = [];

    // Promise for analytics IDs
    const analyticsIdsPromise = collectAnalyticsIds(analyticsIdsConfig, lifetime, cookieDomain).then((analyticsIds) => {
      intk.get.analytics_ids = analyticsIds;
      return analyticsIds;
    });
    promises.push(analyticsIdsPromise);

    // Promise for PII (if enabled)
    if (piiCollectionConfig?.enabled) {
      // Stop previous tracking if active
      if (intk._piiWatcher) {
        intk._piiWatcher();
        intk._piiWatcher = null;
      }

      const piiPromise = collectPiiFromForms(piiCollectionConfig, lifetime, cookieDomain).then((piiHashes) => {
        intk.get.pii_hashes = piiHashes;
        return piiHashes;
      });
      promises.push(piiPromise);

      // Start form watching for future changes
      // Pass callback for updating dataLayer on PII change
      intk._piiWatcher = watchForms(
        piiCollectionConfig,
        lifetime,
        cookieDomain,
        (piiHashes, changeType) => {
          // Update intk.get with new PII hashes
          intk.get.pii_hashes = piiHashes;

          // Push update to dataLayer (if enabled)
          // Fire dedicated events: intk_email and/or intk_phone instead of intk_ready
          if (dataLayerEnabled) {
            if (changeType === 'both') {
              // Fire separate events for email and phone
              sendEmailToDataLayer(intk.get);
              sendPhoneToDataLayer(intk.get);
            } else if (changeType === 'email') {
              sendEmailToDataLayer(intk.get);
            } else if (changeType === 'phone') {
              sendPhoneToDataLayer(intk.get);
            }
          }
        }
      );
    }

    // Wait for all async data to load and push to dataLayer once
    Promise.all(promises).then(() => {
      // Call callback again with full data
      if (callback) {
        callback(intk.get);
      }

      // Push data to dataLayer once after full load (if enabled)
      if (dataLayerEnabled) {
        sendToDataLayer(intk.get);
      }
    }).catch((error) => {
      // On error, still push to dataLayer with available data
      console.warn('Intake: Some async data collection failed:', error);
      if (dataLayerEnabled) {
        sendToDataLayer(intk.get);
      }
      if (callback) {
        callback(intk.get);
      }
    });

    // Initialize History API tracking for SPA (if enabled)
    if (config?.spa_tracking !== false) {
      intk._historyWatcher = trackHistoryAPI((url: string) => {
        // On history change, call trackPageview
        intk.trackPageview(url);
      });
    }

    // Initialize link decoration (if enabled)
    // Link decoration works only if consent is granted or consent mode is not enabled
    const linkDecorationConfig = resolvedConfig.link_decoration;
    if (linkDecorationConfig.enabled && linkDecorationConfig.allowedDomains.length > 0) {
      // Stop previous tracking if active
      if (intk._linkDecorationWatcher) {
        intk._linkDecorationWatcher();
        intk._linkDecorationWatcher = null;
      }

      // Initialize only if consent is granted or consent mode is not enabled
      const shouldInitLinkDecoration = !consentConfig.enabled || checkConsent(intk._consentStatus!);
      if (shouldInitLinkDecoration) {
        intk._linkDecorationWatcher = initLinkDecoration(
          linkDecorationConfig,
          () => intk.get
        );
      }
    }
  },
  trackPageview: function(url?: string): void {
    // Internal handler for virtual pageview processing
    if (!intk._config) {
      console.warn('Intake: trackPageview called before init. Call intk.init() first.');
      return;
    }

    // Use the provided URL or current location
    // In SPA apps, the URL is usually already updated by the time trackPageview is called
    const targetUrl = url || window.location.href;

    // Guard against duplicate calls for the same URL
    // Check if trackPageview was already called for this URL within the last 100ms
    if (intk._lastTrackedUrl === targetUrl) {
      const timeSinceLastTrack = Date.now() - (intk as any)._lastTrackedTime;
      if (timeSinceLastTrack < 100) {
        // Skip duplicate call for the same URL within 100ms
        return;
      }
    }

    // Store info about the last call
    intk._lastTrackedUrl = targetUrl;
    (intk as any)._lastTrackedTime = Date.now();

    try {
      // Get config
      const resolvedConfig = resolveConfig(intk._config);
      const sessionLength = resolvedConfig.session_length;
      const lifetime = resolvedConfig.lifetime;
      const domainConfig = resolvedConfig.domain;
      const currentHost = getHost(window.location.href);
      const cookieDomain = (!domainConfig.isolate && domainConfig.host && domainConfig.host !== currentHost)
        ? domainConfig.host
        : undefined;
      const referrals = resolvedConfig.referrals;
      const organics = resolvedConfig.organics;
      const typeinAttributes = resolvedConfig.typein_attributes;
      const campaignParam = resolvedConfig.campaign_param;
      const termParam = resolvedConfig.term_param;
      const contentParam = resolvedConfig.content_param;
      const promocodeConfig = resolvedConfig.promocode;
      const inAppBrowsers = resolvedConfig.in_app_browsers;
      const referralStartsNewSession = resolvedConfig.referral_starts_new_session;
      const callback = intk._config?.callback;
      const dataLayerEnabled = intk._dataLayerEnabled;

      // Check active session
      const existingSession = get('intk_session');
      const hasSession = !!existingSession;

      // Detect new traffic source (uses current window.location)
      // In SPA apps, window.location is usually already updated by the time this is called
      const newSource = detectTrafficSource(
        hasSession,
        referrals,
        organics,
        typeinAttributes,
        campaignParam,
        termParam,
        contentParam,
        promocodeConfig,
        inAppBrowsers,
        referralStartsNewSession
      );

      // See init() for the rationale — same "session split by referral" rule.
      const sessionSplitByReferral =
        hasSession && referralStartsNewSession && newSource.typ === 'referral';
      const sessionContinues = hasSession && !sessionSplitByReferral;

      // Get existing current source
      const existingCurrent = get('intk_current');
      let currentSource: TrafficSource;
      let currentSourceUpdated = false;

      // Update current source using the same logic as in init
      if (existingCurrent) {
        const oldCurrent = parseTrafficSource(existingCurrent);

        if (newSource.typ === 'utm' || newSource.typ === 'organic') {
          currentSource = newSource;
          currentSourceUpdated = true;
        } else if (newSource.typ === 'referral' && !sessionContinues) {
          currentSource = newSource;
          currentSourceUpdated = true;
        } else {
          currentSource = oldCurrent;
        }
      } else {
        currentSource = newSource;
        currentSourceUpdated = true;
      }

      // Update current_add (use the provided URL for ep)
      const timezoneOffset = resolvedConfig.timezone_offset;
      const currentAddData = parseExtraData(packExtra(timezoneOffset));
      const currentAdd = {
        fd: currentAddData.fd,
        ep: targetUrl,
        rf: document.referrer || '(none)'
      };

      // Get current consent status (without gtag — use stored status or default)
      const currentConsentStatus = intk._consentStatus || { analytics_storage: 'denied' as const, ad_storage: 'denied' as const };
      const consentGranted = checkConsent(currentConsentStatus);

      // Save current (only if consent granted)
      setIfConsentGranted(consentGranted, 'intk_current', packMain(currentSource), lifetime, cookieDomain);
      setIfConsentGranted(consentGranted, 'intk_current_add', packExtra(timezoneOffset), lifetime, cookieDomain);

      // Update session (pages_seen). Reset to 1 when the session does not
      // continue (cold visit OR referral split via referral_starts_new_session).
      let sessionData: { pgs: number; cpg: string };
      if (sessionContinues && existingSession) {
        const sessionParsed = parseSessionData(existingSession);
        sessionData = { pgs: sessionParsed.pgs + 1, cpg: targetUrl };
      } else {
        sessionData = { pgs: 1, cpg: targetUrl };
      }
      setIfConsentGranted(consentGranted, 'intk_session', packSession(sessionData.pgs), sessionLength, cookieDomain);

      // Update touchpoint chain if currentSource was updated
      let touchpointChain;
      if (currentSourceUpdated) {
        touchpointChain = addTouchpoint(currentSource, lifetime, cookieDomain, consentGranted);
      } else {
        touchpointChain = getTouchpointChain();
      }

      // Collect click IDs from current URL (window.location is already updated in SPA)
      const clickIds = collectClickIds(lifetime, cookieDomain, consentGranted);

      // Update intk.get
      intk.get = {
        ...intk.get,
        current: currentSource,
        current_add: currentAdd,
        session: sessionData,
        touchpoints: touchpointChain,
        click_ids: clickIds,
        metadata: {
          ...intk.get.metadata,
          consent_status: currentConsentStatus,
          operating_mode: consentGranted ? 'persistent_storage' : 'parameter_forwarding'
        }
      };

      // Call callback
      if (callback) {
        callback(intk.get);
      }

      // Push update to dataLayer (if enabled)
      if (dataLayerEnabled) {
        sendToDataLayer(intk.get);
      }
    } catch (error) {
      console.warn('Intake: Error in trackPageview:', error);
    }
  },
  getAttribution: function(model: AttributionModel): AttributionResult {
    // Get current touchpoint chain
    const chain = intk.get.touchpoints || { touchpoints: [] };
    return getAttribution(chain, model);
  },
  /**
   * Returns a deep-cloned snapshot of `intk.get` — every traffic, identity,
   * session, touchpoint, click-id, and metadata field the library has collected
   * so far. Safe to mutate; safe to ship straight to a backend with
   * `JSON.stringify(intk.toJSON())` (or just `JSON.stringify(intk)`, which
   * invokes this method automatically per the JS `toJSON` convention).
   *
   * Note on timing: async fields (`analytics_ids`, async `pii_hashes`) only
   * land after the configured `callback` fires a second time. Call this from
   * inside `callback` to capture the fully-populated payload.
   */
  toJSON: function(): IntkData {
    return JSON.parse(JSON.stringify(intk.get));
  },
  setUserId: function(userId: string | null): void {
    // Set User ID manually
    const lifetime = 259200; // 6 months in minutes (default)
    // Use cookieDomain from config if available
    const cookieDomain = intk._cookieDomain ?? undefined;
    setUserId(userId, lifetime, cookieDomain);

    // Update intk.get
    intk.get.user_id = userId || undefined;

    // Update dataLayer if enabled
    if (intk._dataLayerEnabled) {
      sendToDataLayer(intk.get);
    }
  },
  withdrawConsent: function(): void {
    // Public method for consent withdrawal
    // Stop dataLayer consent listener if active
    if (intk._consentListenerCleanup) {
      intk._consentListenerCleanup();
      intk._consentListenerCleanup = null;
    }

    // Stop legacy polling if active
    if (intk._consentPollingInterval !== null) {
      clearInterval(intk._consentPollingInterval);
      intk._consentPollingInterval = null;
    }

    // Stop parameter forwarding if active
    if (intk._parameterForwardingWatcher) {
      intk._parameterForwardingWatcher();
      intk._parameterForwardingWatcher = null;
    }

    // Stop link decoration if active
    if (intk._linkDecorationWatcher) {
      intk._linkDecorationWatcher();
      intk._linkDecorationWatcher = null;
    }

    // Clear all data
    withdrawConsentInternal(intk._cookieDomain || undefined);

    // Update consent status
    intk._consentStatus = {
      analytics_storage: 'denied',
      ad_storage: 'denied'
    };
    intk._operatingMode = 'parameter_forwarding';

    // Update metadata
    if (intk.get.metadata) {
      intk.get.metadata.consent_status = intk._consentStatus;
      intk.get.metadata.operating_mode = intk._operatingMode;
    }

    // Enable parameter forwarding (if url_passthrough is enabled)
    if (intk._urlPassthroughEnabled) {
      intk._parameterForwardingWatcher = initParameterForwarding();
    }

    // Update dataLayer if enabled
    if (intk._dataLayerEnabled) {
      sendToDataLayer(intk.get);
    }
  }
};

export default intk;
