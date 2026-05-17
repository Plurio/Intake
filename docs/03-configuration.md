# Configuration

Full reference for `intk.init(options)`. All options are optional.

## Core options

### `lifetime`

- **Type:** `number`
- **Default:** `6`
- **Unit:** Months

Cookie expiration period. Values are converted to minutes internally (e.g. 6 months ≈ 259200 minutes).

```javascript
intk.init({ lifetime: 3 });
```

---

### `session_length`

- **Type:** `number`
- **Default:** `30`
- **Unit:** Minutes

Session duration. Affects only **referral** source overriding: a referral overwrites the previous source only when there is **no** active session. Within the same session, referral never overrides. UTM and organic always override; typein never overrides.

```javascript
intk.init({ session_length: 60 });
```

---

### `timezone_offset`

- **Type:** `number` (hours) or omitted
- **Default:** `null` (use visitor's local time)

Normalize stored timestamps to a fixed timezone (e.g. `3` for UTC+3).

```javascript
intk.init({ timezone_offset: 3 });
```

---

### `domain`

- **Type:** `string` or `{ host: string, isolate?: boolean }`
- **Default:** current host, cookies shared with subdomains

Cookie domain.

- **String:** `domain: 'site.com'` → cookies for `site.com` and all subdomains (e.g. `blog.site.com`).
- **Object:** `domain: { host: 'site.com', isolate: false }` — same as string. Use `isolate: true` only on the **main** domain when you want traffic from **any** subdomain to that main domain to be counted as **referral**.

**Scenario 1 — shared traffic (main + blog):** Use the same `domain: 'site.com'` on both `site.com` and `blog.site.com` so navigation between them does not change source.

**Scenario 2 — split traffic (main vs blog):** On `site.com` use `domain: { host: 'site.com', isolate: true }`. On `blog.site.com` use `domain: 'blog.site.com'`. Then a visit from `blog.site.com` to `site.com` is referral for `site.com`.

**Important:** Do not change `isolate` after going to production; it can lead to duplicate or inconsistent cookies.

```javascript
intk.init({ domain: 'site.com' });
// or
intk.init({ domain: { host: 'site.com', isolate: true } });
```

---

### `typein_attributes`

- **Type:** `{ source: string, medium: string }`
- **Default:** `{ source: '(direct)', medium: '(none)' }`

Values used for **typein** (direct) traffic when no UTM/referrer is present.

```javascript
intk.init({ typein_attributes: { source: 'direct', medium: 'none' } });
```

---

### `campaign_param`

- **Type:** `string` or `false`
- **Default:** `false`

Custom GET parameter whose value is used as `utm_campaign` when there is no `utm_campaign` in the URL. Used mainly for Google Ads: if the URL has only `gclid`, traffic is treated as UTM from Google with `utm_campaign: 'google_cpc'` unless you pass a custom param, e.g. `campaign_param: 'camp'` and `?gclid=...&camp=my_campaign` → `utm_campaign: 'my_campaign'`.

If explicit UTM params are present, they override `gclid`/`campaign_param`.

```javascript
intk.init({ campaign_param: 'campaign_id' });
```

---

### `term_param`

- **Type:** `string` or `false`
- **Default:** `false`

Custom GET parameter for `utm_term` (same idea as `campaign_param`).

```javascript
intk.init({ term_param: 'keyword' });
```

---

### `content_param`

- **Type:** `string` or `false`
- **Default:** `false`

Custom GET parameter for `utm_content`.

```javascript
intk.init({ content_param: 'ad_content' });
```

---

### `user_ip`

- **Type:** `string`
- **Default:** `'(none)'`

Visitor IP. Intake cannot read it in the browser; set it from your backend if needed.

```javascript
intk.init({ user_ip: '192.168.1.1' });
```

---

### `promocode`

- **Type:** `false` or `{ min?: number, max?: number }` or truthy for defaults
- **Default:** `false` (no promocode)

Generate a random promocode per visitor (no uniqueness guarantee). Default range when enabled without object: 100000–999999.

```javascript
intk.init({ promocode: true });
intk.init({ promocode: { min: 1000000, max: 9999999 } });
```

---

### `callback`

- **Type:** `(data: IntkData) => void`
- **Default:** none

Called after init: first time with synchronous data, then again after async data (analytics IDs, PII hashes if enabled) is ready. Receives the same object as `intk.get`.

```javascript
intk.init({
  callback: function(data) {
    console.log('Source:', data.current.src);
  }
});
```

---

## Referrals and organics

### `referrals`

- **Type:** `Array<{ host: string, display?: string, medium?: string }>`
- **Default:** built-in list includes Twitter (`t.co` → `twitter.com`) and Google+ (`plus.url.google.com` → `plus.google.com`). Your list is **added** to these.

Custom referral sources. `host` is the referrer host; `display` is the alias in results; `medium` overrides default `utm_medium` (e.g. `'social'` instead of `'referral'`).

```javascript
intk.init({
  referrals: [
    { host: 'facebook.com', medium: 'social', display: 'facebook' }
  ]
});
```

---

### `organics`

- **Type:** `Array<{ host: string, param: string, display?: string }>`
- **Default:** built-in list (Google, Bing, Yahoo, DuckDuckGo, Ecosia, Brave Search, Baidu). Your list is **added** to these.

Custom organic search engines. `host` = search engine host, `param` = query parameter name (e.g. `'q'` for `?q=keyword`), `display` = alias in results.

```javascript
intk.init({
  organics: [
    { host: 'duckduckgo.com', param: 'q', display: 'duckduckgo' }
  ]
});
```

---

### `in_app_browsers`

- **Type:** `Array<{ pattern: string, source: string, medium?: string }>` or `false`
- **Default:** built-in list (Instagram, Facebook, TikTok, LinkedIn, Twitter/X, Snapchat, Pinterest, Telegram, Viber, WhatsApp, KakaoTalk, Weibo, WeChat, Line, generic Android webview). Your list is **prepended** to the defaults.

Detects in-app browser (webview) traffic via `navigator.userAgent`. Priority order:

```
UTM > click ID > organic > IN-APP > referral > typein
```

UTM, click IDs, and organic always win. In-app **does** win over referral — this matters because mobile webviews often set `document.referrer` to the app's host (e.g. Instagram iOS sends `referrer=https://instagram.com/`), and without this layer the visit would be classified as `referral/instagram.com` instead of `in_app/instagram`.

When a pattern matches, the result is:

```
{ typ: 'in_app', src: <source>, mdm: <medium ?? 'in_app'>, cmp: '(none)', cnt: '(none)', trm: '(none)' }
```

`pattern` is a regular-expression source string (matched case-insensitively against the User-Agent). A plain substring like `'Instagram'` is a valid regex.

**Add a custom pattern (kept first, before defaults):**

```javascript
intk.init({
  in_app_browsers: [
    { pattern: 'MyCustomApp', source: 'mycustom', medium: 'webview' }
  ]
});
```

**Disable the layer (legacy behaviour — webview visits fall back to referral or typein):**

```javascript
intk.init({ in_app_browsers: false });
```

---

## Identity and analytics

### `analytics_ids`

- **Type:** `AnalyticsIdsConfig` (see below) or omitted
- **Default:** not collected

Collect analytics IDs from cookies into `intk.get.analytics_ids` (and cookie `intk_analytics_ids`). Supports:

- **Google Analytics:** `google_analytics: true` or `{ cookie_name?, client_id_pattern?, session_cookie_pattern? }`
- **Amplitude:** `amplitude: true` or `{ cookie_name? }`
- **Mixpanel:** `mixpanel: true` (uses `distinct_id` cookie)
- **Custom:** `custom: [{ name, cookie_name, pattern? }]`

Collection is async; IDs appear after the first callback and in the second callback / dataLayer push.

```javascript
intk.init({
  analytics_ids: {
    google_analytics: true,
    custom: [{ name: 'segment', cookie_name: 'ajs_user_id', pattern: '^(.+)$' }]
  }
});
```

---

### `pii_collection`

- **Type:** `{ enabled: boolean, email_selectors?: string[], phone_selectors?: string[] }` or omitted
- **Default:** disabled

When `enabled: true`, watch forms and hash email/phone (SHA-256) before storing. Raw PII is never stored. Default selectors: `['input[type="email"]']` and `['input[type="tel"]']`.

```javascript
intk.init({
  pii_collection: {
    enabled: true,
    email_selectors: ['input[type="email"]', '#email'],
    phone_selectors: ['input[type="tel"]', '#phone']
  }
});
```

---

### `user_id`

- **Type:** `UserIdConfig` or omitted
- **Default:** not set

Auto-collect User ID from: `dataLayer`, `cookie`, `localStorage`, or `function`. Options: `source`, `key` (for dataLayer/cookie/localStorage), `function` (when `source: 'function'`), `lifetime` (minutes), `cookieDomain`.

```javascript
intk.init({
  user_id: { source: 'cookie', key: 'user_id', lifetime: 259200 }
});
intk.init({
  user_id: { source: 'function', function: () => window.myApp?.getUserId() || null }
});
```

---

## Features

### `spa_tracking`

- **Type:** `boolean`
- **Default:** `true`

When `true`, listen to History API (`pushState`/`replaceState`) and call `trackPageview` on navigation. You can also call `intk.trackPageview(url)` manually.

```javascript
intk.init({ spa_tracking: false });
```

---

### `data_layer`

- **Type:** `boolean`
- **Default:** `true`

When `true`, push to `window.dataLayer`: events `intk_ready`, `intk_email`, `intk_phone` with `intk_user_profile`. Set to `false` to disable.

```javascript
intk.init({ data_layer: false });
```

---

### `consent_mode`

- **Type:** `ConsentModeConfig` or omitted
- **Default:** disabled (cookies used if no consent_mode)

Consent-aware behavior. Uses a **dataLayer listener** to detect consent (works with common CMPs: OneTrust, Cookiebot, Axeptio, GTM Consent Mode, etc.).

- **`enabled`:** (required) Turn on consent mode.
- **`default_consent`:** `'granted'` | `'denied'`. Used until a consent event is seen. Default: `'denied'`.
- **`url_passthrough`:** When `true` and consent is denied, pass UTM and click IDs via URL params and `window.name` between pages (similar to Google Consent Mode url_passthrough). Default: `false`.
- **`event_names`:** Custom dataLayer event names to listen for.
- **`field_mapping`:** Map CMP field names to `analytics_storage` / `ad_storage`.
- **`custom_parser`:** `(item) => ConsentStatus | null` for custom CMP events.

When consent is **denied**: no cookies/localStorage/sessionStorage; optional parameter forwarding if `url_passthrough: true`. When **granted**: normal cookies and behavior. Link decoration is only active when consent is granted.

```javascript
intk.init({
  consent_mode: {
    enabled: true,
    default_consent: 'denied',
    url_passthrough: false
  }
});
```

---

### `link_decoration`

- **Type:** `LinkDecorationConfig` or omitted
- **Default:** `enabled: false`

When enabled, decorate outbound links to **allowed domains** with UTM and/or click IDs. Respects consent (disabled when consent is denied).

- **`enabled`:** (required) Turn on link decoration.
- **`allowedDomains`:** Array of domains, e.g. `['partner.com', '*.example.org']`. Wildcard = all subdomains.
- **`decorateUtm`:** Default `true`. Add utm_source, utm_medium, utm_campaign, utm_content, utm_term.
- **`decorateClickIds`:** Default `true`. Add gclid, fbclid, msclkid, ttclid, etc.
- **`customParams`:** Extra query params, e.g. `{ affiliate_id: 'abc' }`.

```javascript
intk.init({
  link_decoration: {
    enabled: true,
    allowedDomains: ['partner.com', '*.affiliate.org'],
    decorateUtm: true,
    decorateClickIds: true,
    customParams: { affiliate_id: 'xyz' }
  }
});
```

---

## Next steps

- [API and usage](04-api-and-usage.md) — reading `intk.get` and using methods.
- [Cookies](05-cookies.md) — cookie names and formats.
