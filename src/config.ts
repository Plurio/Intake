import type { IntkConfig, ResolvedConfig, DomainConfig, TypeinAttributes, OrganicSource, ReferralSource, PromocodeConfig, ResolvedLinkDecorationConfig } from './types';
import { getHost } from './helpers/uri';

function isNumeric(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}

function checkFloat(v: unknown): number | false {
  if (v && isNumeric(parseFloat(String(v)))) {
    return parseFloat(String(v));
  }
  return false;
}

function checkInt(v: unknown): number | false {
  if (v === 0 || v === '0') {
    return 0;
  }
  if (v && isNumeric(parseInt(String(v)))) {
    return parseInt(String(v));
  }
  return false;
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function resolveConfig(userConfig?: IntkConfig): ResolvedConfig {
  const user = userConfig || {};
  
  // Lifetime in months, convert to minutes
  const lifetimeMonths = checkFloat(user.lifetime) || 6;
  const lifetime = Math.floor(lifetimeMonths * 30 * 24 * 60);
  
  // Session length in minutes
  const session_length = user.session_length !== undefined 
    ? (checkInt(user.session_length) !== false ? checkInt(user.session_length) as number : 30)
    : 30;
  
  // Timezone offset in hours
  const timezone_offset = user.timezone_offset !== undefined 
    ? (checkInt(user.timezone_offset) !== false ? checkInt(user.timezone_offset) as number : null)
    : null;
  
  // Campaign, term, content params
  const campaign_param = user.campaign_param || false;
  const term_param = user.term_param || false;
  const content_param = user.content_param || false;
  
  // User IP
  const user_ip = user.user_ip || '(none)';
  
  // Promocode
  let promocode: PromocodeConfig | false = false;
  if (user.promocode) {
    if (typeof user.promocode === 'object') {
      promocode = {
        min: parseInt(String(user.promocode.min)) || 100000,
        max: parseInt(String(user.promocode.max)) || 999999
      };
    } else {
      promocode = { min: 100000, max: 999999 };
    }
  }
  
  // Typein attributes
  let typein_attributes: TypeinAttributes;
  if (user.typein_attributes && user.typein_attributes.source && user.typein_attributes.medium) {
    typein_attributes = {
      source: user.typein_attributes.source,
      medium: user.typein_attributes.medium
    };
  } else {
    typein_attributes = { source: '(direct)', medium: '(none)' };
  }
  
  // Domain
  let domain: DomainConfig;
  if (user.domain) {
    if (isString(user.domain)) {
      domain = { host: user.domain, isolate: false };
    } else if (user.domain.host) {
      domain = {
        host: user.domain.host,
        isolate: user.domain.isolate || false
      };
    } else {
      domain = { host: getHost(window.location.href), isolate: false };
    }
  } else {
    domain = { host: getHost(window.location.href), isolate: false };
  }
  
  // Referrals — custom + defaults
  const referrals: ReferralSource[] = [];
  if (user.referrals && user.referrals.length > 0) {
    for (const referral of user.referrals) {
      if (referral.host) {
        referrals.push(referral);
      }
    }
  }
  // Default referrals
  referrals.push({ host: 't.co', display: 'twitter.com' });
  referrals.push({ host: 'plus.url.google.com', display: 'plus.google.com' });
  
  // Organics — custom + defaults
  const organics: OrganicSource[] = [];
  if (user.organics && user.organics.length > 0) {
    for (const organic of user.organics) {
      if (organic.host && organic.param) {
        organics.push(organic);
      }
    }
  }
  // Default organics (Google is handled separately in core.ts)
  organics.push({ host: 'bing.com', param: 'q', display: 'bing' });
  organics.push({ host: 'yahoo.com', param: 'p', display: 'yahoo' });
  organics.push({ host: 'duckduckgo.com', param: 'q', display: 'duckduckgo' });
  organics.push({ host: 'ecosia.org', param: 'q', display: 'ecosia' });
  organics.push({ host: 'search.brave.com', param: 'q', display: 'brave' });
  organics.push({ host: 'baidu.com', param: 'wd', display: 'baidu' });
  
  // Link decoration - disabled by default
  const link_decoration: ResolvedLinkDecorationConfig = {
    enabled: user.link_decoration?.enabled ?? false,
    allowedDomains: user.link_decoration?.allowedDomains ?? [],
    decorateUtm: user.link_decoration?.decorateUtm ?? true,
    decorateClickIds: user.link_decoration?.decorateClickIds ?? true,
    customParams: user.link_decoration?.customParams ?? {}
  };
  
  return {
    lifetime,
    session_length,
    timezone_offset,
    campaign_param,
    term_param,
    content_param,
    user_ip,
    promocode,
    typein_attributes,
    domain,
    organics,
    referrals,
    link_decoration
  };
}

