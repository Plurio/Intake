# Cookies reference

Intake stores data in first-party cookies when consent is granted. All use the same format: key-value pairs separated by `|||` (e.g. `typ=utm|||src=google|||mdm=cpc`). This page lists cookie names, formats, and when they are set or updated.

## When consent is denied

If [consent mode](03-configuration.md#consent_mode) is enabled and the user has not granted consent (or has withdrawn it), **no cookies are set or updated**. Attribution can still be passed between pages via **parameter forwarding** (URL params and `window.name`) when `url_passthrough: true` is configured. In that case there are no persistent cookies for Intake data.

---

## Cookie list

| Cookie name | Purpose | Lifetime / notes |
|-------------|---------|------------------|
| `intk_current` | Current (latest) traffic source | Config `lifetime` (months → minutes) |
| `intk_current_add` | Extra data for current source (date, entrance, referrer) | Same as above |
| `intk_first` | First-ever traffic source | Same; written once, never overwritten |
| `intk_first_add` | Extra data for first source | Same |
| `intk_session` | Session (pages seen, current page URL) | Config `session_length` (minutes) |
| `intk_udata` | User data (visit count, IP, user-agent) | Config `lifetime` |
| `intk_promo` | Promocode (if `promocode` config is set) | Config `lifetime`; set once per visitor |
| `intk_touchpoints` | Touchpoint chain for attribution | Config `lifetime` |
| `intk_click_ids` | Click IDs (gclid, fbclid, msclkid, etc.) | Config `lifetime` |
| `intk_user_id` | User ID (if set or auto-collected) | Config or 6 months default |
| `intk_pii` | PII hashes (email/phone SHA-256) when PII collection enabled | Config `lifetime` |
| `intk_analytics_ids` | Analytics IDs (GA, Amplitude, Mixpanel, custom) | Config `lifetime` |

---

## Format

### Main and extra (current/first)

- **Delimiter:** `|||`
- **Pairs:** `key=value`.

**intk_current / intk_first**
`typ=utm|||src=google|||mdm=cpc|||cmp=campaign|||cnt=(none)|||trm=(none)`

**intk_current_add / intk_first_add**
`fd=2024-01-15 12:30:00|||ep=https://site.com/landing|||rf=https://www.google.com/`

### Session

**intk_session**
`pgs=3|||cpg=https://site.com/current-page`

### User data

**intk_udata**
`vst=2|||uip=192.168.1.1|||uag=Mozilla/5.0...`

### Promo

**intk_promo**
`code=002354`

### Touchpoints

**intk_touchpoints**
Touchpoints are concatenated with `:::`. Each touchpoint is:
`typ=organic|||src=google|||mdm=organic|||cmp=(none)|||cnt=(none)|||trm=keyword|||ts=1705312200000`
(ts = Unix timestamp in milliseconds.)

### Click IDs

**intk_click_ids**
Same `|||` format; keys are param names (gclid, fbclid, msclkid, etc.):
`gclid=abc123|||fbclid=def456`

### User ID

**intk_user_id**
Plain string value (no key=value structure).

### PII and analytics IDs

**intk_pii**
`|||`-separated key=value (e.g. email_hash, phone_hash).

**intk_analytics_ids**
`|||`-separated key=value (e.g. ga_client_id, amplitude_id, mixpanel_id).

---

## Example values by traffic type

**UTM (e.g. Google Ads):**
`typ=utm|||src=google|||mdm=cpc|||cmp=summer_sale|||cnt=banner_1|||trm=shoes`

**Organic (e.g. Google):**
`typ=organic|||src=google|||mdm=organic|||cmp=(none)|||cnt=(none)|||trm=(none)`

**Referral (e.g. facebook.com):**
`typ=referral|||src=facebook.com|||mdm=referral|||cmp=(none)|||cnt=/|||trm=(none)`

**Typein (direct):**
`typ=typein|||src=(direct)|||mdm=(none)|||cmp=(none)|||cnt=(none)|||trm=(none)`

---

## When each cookie is set or updated

| Cookie | First visit | Later visits / SPA |
|--------|-------------|--------------------|
| `intk_first`, `intk_first_add` | Set once | Never overwritten |
| `intk_current`, `intk_current_add` | Set; may be updated by UTM/organic/referral (see attribution rules) | Updated on init and on `trackPageview` when source changes |
| `intk_session` | Set (pgs=1) | Updated on each init/trackPageview (pgs incremented, cpg updated) |
| `intk_udata` | Set (vst=1) | vst incremented when no active session; uip/uag updated |
| `intk_promo` | Set once if config present | Not overwritten |
| `intk_touchpoints` | New touchpoint appended when current source is updated | Appended on each significant source change (utm/organic/referral) |
| `intk_click_ids` | From URL / existing cookie | Merged from URL on each load |
| `intk_user_id` | From config or `setUserId` | Updated by `setUserId` or auto source |
| `intk_pii` | When PII collection captures email/phone | Updated when form values change (hashed) |
| `intk_analytics_ids` | Collected asynchronously from GA/Amplitude/etc. | Updated when collected |

When consent is denied, none of these cookies are written; existing ones may be cleared by `withdrawConsent()`.

---

## Next steps

- [Limitations](06-limitations.md) — known limits and recommendations.
