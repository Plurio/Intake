import type { Touchpoint, TouchpointChain, TrafficSource } from '../types';
import { get, set, parse } from '../helpers/cookies';

const DELIMITER = '|||';
const TOUCHPOINT_DELIMITER = ':::';
const MAX_TOUCHPOINTS = 50;
const COOKIE_NAME = 'intk_touchpoints';

/**
 * Checks if a traffic source is significant for adding to the touchpoint chain
 * Significant sources: utm, organic, referral
 */
function isSignificantSource(source: TrafficSource): boolean {
  return source.typ === 'utm' || source.typ === 'organic' || source.typ === 'referral';
}

/**
 * Checks if a touchpoint is a duplicate of the previous one
 * Compares type, source, and medium
 */
function isDuplicate(touchpoint: Touchpoint, previousTouchpoint: Touchpoint | null): boolean {
  if (!previousTouchpoint) {
    return false;
  }
  return (
    touchpoint.typ === previousTouchpoint.typ &&
    touchpoint.src === previousTouchpoint.src &&
    touchpoint.mdm === previousTouchpoint.mdm
  );
}

/**
 * Converts TrafficSource to Touchpoint with a timestamp added
 */
function trafficSourceToTouchpoint(source: TrafficSource): Touchpoint {
  return {
    typ: source.typ,
    src: source.src,
    mdm: source.mdm,
    cmp: source.cmp,
    cnt: source.cnt,
    trm: source.trm,
    ts: Date.now()
  };
}

/**
 * Packs a Touchpoint into a string for cookie storage
 */
function packTouchpoint(touchpoint: Touchpoint): string {
  return `typ=${touchpoint.typ}${DELIMITER}src=${touchpoint.src}${DELIMITER}mdm=${touchpoint.mdm}${DELIMITER}cmp=${touchpoint.cmp}${DELIMITER}cnt=${touchpoint.cnt}${DELIMITER}trm=${touchpoint.trm}${DELIMITER}ts=${touchpoint.ts}`;
}

/**
 * Parses a string into a Touchpoint
 */
function parseTouchpoint(touchpointStr: string): Touchpoint | null {
  try {
    const data = parse(touchpointStr);
    const ts = parseInt(data.ts || '0', 10);
    if (!ts || ts <= 0) {
      return null; // Invalid timestamp
    }
    return {
      typ: data.typ || '',
      src: data.src || '',
      mdm: data.mdm || '',
      cmp: data.cmp || '',
      cnt: data.cnt || '',
      trm: data.trm || '',
      ts: ts
    };
  } catch (e) {
    return null;
  }
}

/**
 * Packs a TouchpointChain into a string for cookie storage
 */
export function packTouchpointChain(chain: TouchpointChain): string {
  return chain.touchpoints.map(packTouchpoint).join(TOUCHPOINT_DELIMITER);
}

/**
 * Parses a cookie string into a TouchpointChain
 */
export function parseTouchpointChain(cookieValue: string | null): TouchpointChain {
  if (!cookieValue) {
    return { touchpoints: [] };
  }

  const touchpointStrings = cookieValue.split(TOUCHPOINT_DELIMITER);
  const touchpoints: Touchpoint[] = [];

  for (const tpStr of touchpointStrings) {
    if (!tpStr.trim()) {
      continue;
    }
    const touchpoint = parseTouchpoint(tpStr);
    if (touchpoint) {
      touchpoints.push(touchpoint);
    }
  }

  return { touchpoints };
}

/**
 * Gets the current touchpoint chain from cookie
 */
export function getTouchpointChain(): TouchpointChain {
  const cookieValue = get(COOKIE_NAME);
  return parseTouchpointChain(cookieValue);
}

/**
 * Adds a new touchpoint to the chain
 * Only adds significant sources (utm, organic, referral)
 * Does not add consecutive duplicates
 * Limits the maximum chain length
 * 
 * @param source - Traffic source to add
 * @param lifetime - Cookie lifetime in minutes
 * @param cookieDomain - Cookie domain (optional)
 * @param consentGranted - Whether consent is granted (default: true for backward compatibility)
 */
export function addTouchpoint(
  source: TrafficSource,
  lifetime: number,
  cookieDomain?: string,
  consentGranted: boolean = true
): TouchpointChain {
  // Check if the source is significant
  if (!isSignificantSource(source)) {
    // Return existing chain without changes
    return getTouchpointChain();
  }

  // Get current chain
  const chain = getTouchpointChain();
  const touchpoints = [...chain.touchpoints];

  // Convert source to touchpoint
  const newTouchpoint = trafficSourceToTouchpoint(source);

  // Check for duplicate (compare with the last touchpoint)
  const lastTouchpoint = touchpoints.length > 0 ? touchpoints[touchpoints.length - 1] : null;
  if (isDuplicate(newTouchpoint, lastTouchpoint)) {
    // Duplicate — do not add, return existing chain
    return chain;
  }

  // Add new touchpoint
  touchpoints.push(newTouchpoint);

  // Limit maximum length (keep the latest MAX_TOUCHPOINTS)
  const trimmedTouchpoints = touchpoints.length > MAX_TOUCHPOINTS
    ? touchpoints.slice(-MAX_TOUCHPOINTS)
    : touchpoints;

  // Create new chain
  const newChain: TouchpointChain = { touchpoints: trimmedTouchpoints };

  // Save to cookie only if consent is granted
  if (consentGranted) {
    const packedValue = packTouchpointChain(newChain);
    set(COOKIE_NAME, packedValue, lifetime, cookieDomain);
  }

  return newChain;
}

