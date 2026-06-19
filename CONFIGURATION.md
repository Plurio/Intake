# Intake Configuration

> **Tip:** You don't have to write this config by hand. The [Configurator](tools/configurator/) generates a ready-to-paste snippet or GTM container from a short interview — use it as a **skill** ([`SKILL.md`](tools/configurator/SKILL.md)) in an agentic tool, or paste [`PROMPT.md`](tools/configurator/PROMPT.md) into any chat assistant.

## Installation

```html
<script src="path/to/intake.js"></script>
```

Or via npm:

```bash
npm install @plurio/intake
```

## Configuration

You can configure intake by passing optional object with params. Usually, it looks like this:

```javascript
intk.init({
  domain: 'site.com',
  lifetime: 3,
  callback: doSomething,
});
```

## Params

- `lifetime`
- `session_length`
- `domain`
- `referrals`
- `organics`
- `typein_attributes`
- `timezone_offset`
- `campaign_param`
- `term_param`
- `content_param`
- `user_ip`
- `promocode`
- `analytics_ids`
- `pii_collection`
- `user_id`
- `spa_tracking`
- `data_layer`
- `consent_mode`
- `link_decoration`
- `callback`

---

## `lifetime`

```javascript
lifetime: 6 // months
```

Custom expiration period of intake cookies (in months). Default is 6.

**Example:**

```javascript
intk.init({
  lifetime: 3, // Cookies will expire in 3 months
});
```

---

## `session_length`

```javascript
session_length: 30 // minutes
```

User's session duration (in minutes). Default is 30.

This parameter affects only referral sources overriding. When a visitor comes on your site for the first time, intake receives and stores data about a source. After some time, this visitor might return to your website, but from another source, and we need some rules to decide if we should overwrite previous source or not.

These rules are aligned with Google Analytics:

- **UTM and Organic sources** always override any previous source.
- **Type-in** never overrides a previous source.
- **Referral source** overrides previous source only if there is no user session at the moment. If it's within the same session — a referral source will never override previous source (unless [`referral_starts_new_session`](#referral_starts_new_session) is enabled).

**Explanation to referral logic:** sometimes visitor within a current visit (session) comes to a website from a "source" which is not actually a "source". For example, it can be visit from an email service, where he had a registration activation link.

**Example:**

```javascript
intk.init({
  session_length: 60, // Session duration is 60 minutes
});
```

---

## `referral_starts_new_session`

```javascript
referral_starts_new_session: false // default
```

Controls how referral traffic arriving **during an active session** is treated. Default is `false` — the legacy behaviour described under [`session_length`](#session_length) is preserved: a mid-session referral is ignored, `intk_current` is left untouched, no new touchpoint is appended, and the session counter keeps incrementing.

Set this to `true` to make a mid-session referral **split the session**:

- `intk_session` page counter resets to `1`
- `intk_udata` visits counter is incremented
- `intk_current` is overwritten with the new referral source
- a new touchpoint is appended to `intk_first_add` / `intk_current_add` chain
- `intk_first` (first-touch attribution) is **not** touched

UTM, organic, in-app and typein detection are unaffected by this flag in both states.

**Example:**

```javascript
intk.init({
  referral_starts_new_session: true,
});
```

---

## `domain`

```javascript
domain: {
  host: 'site.com',
  isolate: false,
}
```

Or simply:

```javascript
domain: 'site.com'
```

Cookies domain configuration.

**First of all**, let's talk about how script handles an absence of this custom option: if no value is set, cookies will be placed for current domain and all its subdomains.

**Why it acts like this?** Let's say a site doesn't have subdomains to share traffic with, and now it doesn't matter: do we share cookies with subdomains or we do not. But what's gonna happen if someday subdomains will occur? If cookies wasn't shared — subdomains won't get them, it means they won't share a traffic, and visitors, which came from main domain to subdomains (and vice versa), will be considered as referral traffic.

So, by default cookies are shared. However, if you don't want to share them — use `isolate: true` param, to isolate domain.

Let's take a look at further examples.

### Scenario #1

There's a site: `foo.com`. Also, there's a blog on this site: `blog.foo.com`. And you don't want to split traffic between them. It means that when a visitor comes from `blog.foo.com` to `foo.com`, it won't be considered as a new visit for `foo.com` (with `blog.foo.com` as referral source), it will be a common inner click without source change (to intake this scenario will be equal to inner page change: e.g. from `foo.com/about` to `foo.com/contacts`). To achieve this, you have to add this line on both sites: `foo.com` & `blog.foo.com`.

```javascript
domain: 'foo.com'
```

### Scenario #2

That was simple. Now, let's take a look at opposite scenario — you want to split traffic between your subdomains and consider it as referral. There is a main site — `foo.com`, and there is a blog on this site — `blog.foo.com`, which also has users subdomains — `user1.blog.foo.com` is one of them. You don't want to split traffic between `blog.foo.com` and `user1.blog.foo.com`, but you do want to split it between all blogs and the main site. Here's how we can sort it out:

```javascript
// put this on the main domain foo.com
domain: {
  host: 'foo.com',
  isolate: true
}

// and this on the blogs subdomains (blog.foo.com & user1.blog.foo.com)
domain: 'blog.foo.com'
```

Pay attention to the `isolate: true` param in the config for the main domain. Use it only when all incoming traffic from all subdomains should be considered as a referral in relation to provided host.

In our example, if a visitor comes for the first time on the main site `foo.com` by clicking on a link in user's blog `user1.blog.foo.com`, his source (for the `foo.com`) will be `user1.blog.foo.com` (traffic type: referral).

**⚠️ NB!** Do not change `isolate` value after you pushed configuration to production! If you'll do — your visitors will get doubled cookies and bad things may happen.

**Check yourself that isolate is set right:**

Host of a page, which code contains param `domain` with `isolate: true` must be equal to a host provided in `domain`:

```javascript
// CORRECT: on pages of foo.com
domain: {
  host: 'foo.com',
  isolate: true
}

// DOESN'T MAKE SENSE: on pages blog.foo.com
domain: {
  host: 'foo.com',
  isolate: true
}
```

All incoming traffic from all subdomains will be referral in relation to provided host:

```javascript
domain: {
  host: 'foo.com',
  isolate: true
}
// visit from any subdomain (*.foo.com) → foo.com will be referral
```

---

## `referrals`

```javascript
referrals: [
  {
    host: 't.co',            // This is host from Twitter's http referer
    medium: 'social',        // This is custom `utm_medium`, you can drop it and it'll be `referral`
    display: 'twitter.com'   // And this is how you'll see it in the result data
  },
  {
    host: 'plus.url.google.com',
    display: 'plus.google.com'
  }
]
```

Add custom referral sources.

In general, if you're ok with a fact that medium (`utm_medium`) of traffic from `facebook.com` is `referral`, you don't need this param. But if you want to make this kind of traffic `social` (`utm_medium=social`), you can set it up using `referrals`. First param is `host` of the source from http referer, second — `medium` — preferred value of `utm_medium`.

Moreover, some of traffic sources have different referer host in relation to their main domain (e.g. traffic from Twitter has referer with the host — `t.co`). In such case you can assign alias to a source using optional `display` param. Also, with this param you can group a traffic from the set of the sites into one virtual source.

Twitter (`host: 't.co'`, `display: 'twitter.com'`) and Google+ (`host: 'plus.url.google.com'`, `display: 'plus.google.com'`) are already added to default referral sources. You still can override it by your custom setting (for example, to consider it as a social).

**Example:**

```javascript
intk.init({
  referrals: [
    {
      host: 'facebook.com',
      medium: 'social',
      display: 'facebook'
    },
    {
      host: 'linkedin.com',
      medium: 'social',
      display: 'linkedin'
    }
  ]
});
```

---

## `organics`

There are a number of predefined organic sources are added in the core:

| Source         | Alias      |
|---------------|------------|
| google.all         | google     |
| bing.com           | bing       |
| yahoo.com          | yahoo      |
| duckduckgo.com     | duckduckgo |
| ecosia.org         | ecosia     |
| search.brave.com   | brave      |
| baidu.com          | baidu      |

But you can use this param if you want to add more organic sources or override aliases of predefined ones.

```javascript
organics: [
  {
    host: 'bing.com',
    param: 'q',
    display: 'bing_in_da_house'
  }
]
```

For example, you want a traffic from SERP of `bing.com` to be organic and an alias for this source to be `bing_in_da_house`. So you need to provide `host: 'bing.com'`, and a query param of keyword — `'q'`. Both are required. Also, to set custom alias for this source, provide optional third param `display: 'bing_in_da_house'`.

To get a keyword param go to `bing.com` and search for something, i.e. "apple". After you'll get to SERP, explore its URL:

```text
http://www.bing.com/search?q=apple&go=&qs=n&form=QBLH&pq=apple&sc=8-5&sp=-1&sk=&cvid=718ad07527244e319ecebf44aa261f64
```

Keyword param — `'q'` — is a symbol/word between "?" (or "&" if a param is not the first after question sign) and "=apple" in SERP's URL.

**Example:**

```javascript
intk.init({
  organics: [
    {
      host: 'duckduckgo.com',
      param: 'q',
      display: 'duckduckgo'
    },
    {
      host: 'ecosia.org',
      param: 'q',
      display: 'ecosia'
    }
  ]
});
```

---

## `in_app_browsers`

Detect traffic coming from in-app browsers (webviews) such as Instagram, Facebook, TikTok, Telegram. Without this layer, such visits land in `typein/(direct)` because they usually have no UTM, no click ID, and an empty or app-controlled `document.referrer`.

Priority: `UTM > click ID > organic > IN-APP > referral > typein`. UTM, click IDs, and organic always take precedence. In-app **does** override referral — this matters because mobile webviews often set `document.referrer` to the app's own host (Instagram iOS sends `https://instagram.com/`), and without this layer those visits would be classified as `referral/instagram.com` instead of `in_app/instagram`.

When a User-Agent matches one of the patterns, the result is:

```js
{ typ: 'in_app', src: 'instagram', mdm: 'social', cmp: '(none)', cnt: '(none)', trm: '(none)' }
```

The library ships with a built-in pattern list, enabled by default:

| Pattern (matched in User-Agent, case-insensitive) | `source`          | default `medium` |
|---------------------------------------------------|-------------------|------------------|
| `FBAN`, `FBAV`, `FB_IAB`                          | `facebook`        | `social`         |
| `Instagram`, `IGApp`                              | `instagram`       | `social`         |
| `TikTok`, `musical_ly`, `Aweme`                   | `tiktok`          | `social`         |
| `LinkedInApp`, `LIA`                              | `linkedin`        | `social`         |
| `TwitterAndroid`, `Twitter for ...`               | `twitter`         | `social`         |
| `Snapchat`                                        | `snapchat`        | `social`         |
| `Pinterest`                                       | `pinterest`       | `social`         |
| `TelegramBot`, `TgWebApp`, `Telegram/`            | `telegram`        | `social`         |
| `Viber`                                           | `viber`           | `social`         |
| `WhatsApp`                                        | `whatsapp`        | `social`         |
| `KAKAOTALK`                                       | `kakaotalk`       | `social`         |
| `Weibo`                                           | `weibo`           | `social`         |
| `MicroMessenger`                                  | `wechat`          | `social`         |
| `Line/`                                           | `line`            | `social`         |
| `wv ... Android` (generic Android webview)        | `android_webview` | `in_app`         |

Social and messaging platforms use `medium: 'social'` so downstream tools (GA4, CRMs) route them to **Organic Social** rather than collapsing the visit into "Direct" / "Unassigned". The generic Android webview keeps the neutral `medium: 'in_app'` because the originating app is unknown. The `typ` field is always `'in_app'` either way — code that wants to distinguish webview traffic from "regular" social referral can check `intk.get.current.typ`.

### Add a custom pattern

User-supplied entries are **prepended** to the defaults, so they win on conflict.

```javascript
intk.init({
  in_app_browsers: [
    { pattern: 'MyCustomApp', source: 'mycustom', medium: 'webview' }
  ]
});
```

`pattern` is a JavaScript regular-expression source string (matched case-insensitively). A plain substring like `'MyCustomApp'` is a valid regex.

### Disable the layer

Set `in_app_browsers: false` to disable the layer entirely — webview visits fall back to `referral` (if `document.referrer` is set) or `typein` as in earlier versions.

```javascript
intk.init({ in_app_browsers: false });
```

### Override the medium

Provide your own `medium` per entry to use something other than the defaults (`'social'` for the named platforms, `'in_app'` for the generic Android webview). User entries are matched **before** the defaults, so the same source name with a custom `medium` overrides the built-in:

```javascript
intk.init({
  in_app_browsers: [
    { pattern: 'Instagram|IGApp', source: 'instagram', medium: 'social_webview' }
  ]
});
```

Because custom entries come first, this Instagram entry overrides the default Instagram entry below it.

---

## `typein_attributes`

```javascript
typein_attributes: {
  source: '(direct)',
  medium: '(none)',
}
```

Custom `utm_source` and `utm_medium` for type-in traffic. By default, values of `source` and `medium` for type-in traffic are `(direct)` & `(none)`. You can override this via `typein_attributes`.

**Example:**

```javascript
intk.init({
  typein_attributes: {
    source: 'direct',
    medium: 'none'
  }
});
```

---

## `timezone_offset`

```javascript
timezone_offset: 3
```

By default, datetime is taken from a visitor's system. But you can normalize it to predefined time zone via `timezone_offset` param.

**Example.** Your visitor is in London (UTC +00:00). His local time is 03:00 AM. If no `timezone_offset` is set, a time in cookie will be 03:00 AM. Another visitor at the same moment is from Berlin (UTC +01:00) and his local time is 04:00 AM. The time in cookie will be 04:00 AM.

If you want to normalize time of all visitors (let it be UTC +03:00), you should set it via `timezone_offset: 3`. So a time in cookies of both visitors will be 06:00 AM.

**Example:**

```javascript
intk.init({
  timezone_offset: 3 // Normalize all timestamps to UTC+3
});
```

---

## `campaign_param` (Google Ads gclid param handler)

```javascript
campaign_param: 'my_ads_campaign'
```

Custom GET-param, whose value (if present) will be set as `utm_campaign` in cookies (if there is no original `utm_campaign` in request). This feature was added mainly because of Google Ads `gclid` param.

**Here is a use-case.** If traffic is from Google Ads and you use `gclid` param, you can shorten your urls by removing utm noise. Intake will match this traffic as utm from Google.

If there is only `gclid` param in url, e.g. `http://foo.com/?gclid=googlesHash`

This will give you the following results:

```text
Traffic type: utm
utm_source: google
utm_medium: cpc
utm_campaign: google_cpc
utm_content: (none)
utm_term: (none)
```

You can provide a custom `utm_campaign` name via `campaign_param` and value of this GET-param: `http://foo.com/?gclid=googlesHash&my_ads_campaign=custom_campaign`

You'll get the following:

```text
Traffic type: utm
utm_source: google
utm_medium: cpc
utm_campaign: custom_campaign
utm_content: (none)
utm_term: (none)
```

### ⚠️ WARNING

If there is original utm-param in request (`utm_source`, `utm_medium`, `utm_campaign`), it will override `gclid` param and `campaign_param` param value.

If there is only custom campaign param (`campaign_param`) in request, intake will consider it as utm traffic.

**Example:**

```javascript
intk.init({
  campaign_param: 'campaign_id' // Custom campaign parameter name
});
```

---

## `term_param`

```javascript
term_param: 'keyword'
```

Custom GET-param for `utm_term`. Similar to `campaign_param`, but for term parameter.

**Example:**

```javascript
intk.init({
  term_param: 'search_term'
});
```

---

## `content_param`

```javascript
content_param: 'ad_content'
```

Custom GET-param for `utm_content`. Similar to `campaign_param`, but for content parameter.

**Example:**

```javascript
intk.init({
  content_param: 'ad_variant'
});
```

---

## `user_ip`

```javascript
user_ip: '192.168.1.1'
```

User's ip address. By default, intake can't get ip address of a visitor. But if you need it, you can get it on your backend and push it using `user_ip` param.

**Example:**

```javascript
intk.init({
  user_ip: '192.168.1.1' // IP address from your backend
});
```

---

## `promocode`

```javascript
promocode: true

// or

promocode: {
  min: 100000,
  max: 999999,
}
```

Generate (pseudo) random promocodes for visitors.

If you don't want to bother yourself with promocode stuff on your backend, intake can generate them for you. There is no check for uniqueness, of course. But you can rely on probability and set range of promocode values via `min` and `max` params. They are optional, by the way. If they are not set, range will be between 100 000 and 999 999.

**Example:**

```javascript
intk.init({
  promocode: {
    min: 1000000,
    max: 9999999
  }
});
```

---

## `analytics_ids`

```javascript
analytics_ids: {
  google_analytics: true,  // Use defaults
  amplitude: true,          // Use defaults
  mixpanel: true,          // Use defaults
  custom: [
    {
      name: 'my_analytics',
      cookie_name: 'my_analytics_id',
      pattern: '^(.+)$'  // Optional regex pattern
    }
  ]
}
```

Configure automatic collection of analytics IDs from various platforms.

**Supported platforms:**

- **Google Analytics**: Collects Client ID from `_ga` cookie and Session ID from `_ga_*` cookies
- **Amplitude**: Collects ID from `amp_*` cookies
- **Mixpanel**: Collects `distinct_id` from cookie
- **Custom**: Configure your own analytics platform

**Example:**

```javascript
intk.init({
  analytics_ids: {
    google_analytics: {
      cookie_name: '_ga',
      client_id_pattern: 'GA1\\.\\d+\\.(.+)'
    },
    amplitude: {
      cookie_name: 'amp_*'
    },
    custom: [
      {
        name: 'segment',
        cookie_name: 'ajs_user_id',
        pattern: '^(.+)$'
      }
    ]
  }
});
```

---

## `pii_collection`

```javascript
pii_collection: {
  enabled: true,
  email_selectors: ['input[type="email"]', '#email'],
  phone_selectors: ['input[type="tel"]', '#phone']
}
```

Configure automatic collection and hashing of PII (Personally Identifiable Information) from forms.

**Features:**

- Automatically watches forms on the page
- Captures email and phone from input fields
- Hashes data using SHA-256 before storage
- Never stores raw PII data

**Default selectors:**

- Email: `['input[type="email"]']`
- Phone: `['input[type="tel"]']`

**Example:**

```javascript
intk.init({
  pii_collection: {
    enabled: true,
    email_selectors: ['input[type="email"]', '.email-field'],
    phone_selectors: ['input[type="tel"]', '.phone-field']
  }
});
```

**⚠️ Privacy Note:** All PII is hashed using SHA-256 before storage. Raw email/phone values are never stored in cookies.

---

## `user_id`

```javascript
user_id: {
  source: 'dataLayer',  // 'dataLayer' | 'cookie' | 'localStorage' | 'function'
  key: 'userId',        // Key name for dataLayer/cookie/localStorage
  lifetime: 259200,     // Cookie lifetime in minutes (default: 6 months)
  cookieDomain: '.site.com'  // Optional cookie domain
}

// Or with custom function:

user_id: {
  source: 'function',
  function: () => {
    return window.myApp?.getUserId() || null;
  }
}
```

Configure automatic User ID collection from various sources.

**Supported sources:**

- `dataLayer`: Read from Google Tag Manager dataLayer
- `cookie`: Read from cookie
- `localStorage`: Read from localStorage
- `function`: Use custom function to get User ID

**Example:**

```javascript
intk.init({
  user_id: {
    source: 'cookie',
    key: 'user_id',
    lifetime: 259200  // 6 months
  }
});
```

---

## `spa_tracking`

```javascript
spa_tracking: true  // default: true
```

Enable or disable automatic Single Page Application (SPA) tracking via History API.

When enabled, intake automatically tracks page views when using `pushState` or `replaceState` (SPA navigation). You can also manually track page views using `intk.trackPageview()`.

**Example:**

```javascript
intk.init({
  spa_tracking: true  // Enable SPA tracking
});

// Manual tracking (optional):
intk.trackPageview('/new-page');
```

---

## `data_layer`

```javascript
data_layer: true  // default: true
```

Enable or disable Google Tag Manager dataLayer integration.

When enabled, intake automatically pushes data to `dataLayer` with different event types depending on the scenario:

**Event Types:**

| Event | When Fired | Description |
|-------|------------|-------------|
| `intk_ready` | On initialization, page views, setUserId | General Intake data update |
| `intk_email` | When email is captured from form inputs | Dedicated event for email capture |
| `intk_phone` | When phone is captured from form inputs | Dedicated event for phone capture |

**Note:** When both email AND phone are captured simultaneously, `intk_email` fires first, then `intk_phone` fires separately.

**Example:**

```javascript
intk.init({
  data_layer: true,  // Enable dataLayer integration
  pii_collection: {
    enabled: true    // Enable PII collection for intk_email/intk_phone events
  }
});

// In GTM, you can create triggers for:
// - Event: intk_ready (initialization, page views)
// - Event: intk_email (email captured)
// - Event: intk_phone (phone captured)

// All events contain the same intk_user_profile data structure
```

**GTM Variable Setup:**

```javascript
// Create Data Layer Variables in GTM:
// - intk_user_profile.identity.pii_hashes.email_sha256
// - intk_user_profile.identity.pii_hashes.phone_sha256
// - intk_user_profile.traffic_attribution.first_visit.source
// - intk_user_profile.traffic_attribution.current_visit.source
// - intk_user_profile.browser.browser_type
// - intk_user_profile.browser.is_in_app
// - intk_user_profile.browser.in_app_source
// - intk_user_profile.browser.language
```

**`intk_user_profile.browser` object:**

Always present in every event. No configuration required.

| Field | Values | Description |
|-------|--------|-------------|
| `browser_type` | `'chrome'` `'safari'` `'firefox'` `'edge'` `'samsung'` `'opera'` `'in_app'` `'other'` | Detected browser family. |
| `is_in_app` | `true` / `false` | Whether the visit comes from a social or messenger webview. |
| `in_app_source` | `'instagram'` `'facebook'` `'tiktok'` `'telegram'` … | Which app's webview (present only when `is_in_app = true`). |
| `language` | e.g. `'ru-RU'` `'en-US'` | `navigator.language` — browser/OS locale setting. |
| `user_agent` | raw string | Full `navigator.userAgent` value. |

---

## `consent_mode`

```javascript
consent_mode: {
  enabled: true,
  default_consent: 'denied',  // 'granted' | 'denied'
  url_passthrough: false,  // Optional: enable/disable URL passthrough (default: false)
  event_names: ['my_custom_consent_event'],  // Optional: custom event names
  field_mapping: {  // Optional: custom field mapping
    analytics_storage: 'analyticsConsent',
    ad_storage: 'marketingConsent'
  },
  custom_parser: (item) => { ... }  // Optional: custom parser function
}
```

Configure consent detection for privacy compliance. Intake 2.0 uses an **event-driven dataLayer listener** that works with ANY Consent Management Platform (CMP).

**How It Works:**

Intake intercepts `dataLayer.push()` to capture consent events from any source:
- Google Tag Manager Consent Mode (gtag commands)
- OneTrust
- Cookiebot
- Axeptio
- Didomi
- Sirdata
- Termly
- TrustArc
- Iubenda
- Klaro
- Any custom CMP that pushes to dataLayer

**Features:**

- **Event-driven**: No polling, no race conditions - consent is captured as soon as CMP pushes to dataLayer
- **Universal**: Works with ANY CMP without specific integrations
- **Extensible**: Add custom parsers for unknown CMPs
- **Backward compatible**: Existing configurations continue to work
- Switches between persistent storage (cookies) and parameter forwarding modes
- Automatically handles consent withdrawal
- Complies with GDPR and ePrivacy Directive

**Parameters:**

- **`enabled`**: Enable Consent Mode integration
- **`default_consent`**: Default consent status if consent cannot be detected (`'granted'` | `'denied'`)
- **`url_passthrough`**: (default: `false`) Similar to Google Consent Mode's `url_passthrough` setting. When consent is denied and this option is enabled, Intake uses URL parameters and runtime memory (window.name) to pass UTM params and click IDs (gclid, fbclid, msclkid, etc.) between pages. Set to `true` to enable this mechanism.
- **`event_names`**: Optional array of custom event names to listen for
- **`field_mapping`**: Optional mapping for custom consent field names
- **`custom_parser`**: Optional custom parser function for unknown CMPs

**Modes:**

- **`persistent_storage`**: Uses cookies when consent is granted
- **`parameter_forwarding`**: Uses URL parameters and runtime memory when consent is denied

**Basic Example (Auto-detect):**

```javascript
intk.init({
  consent_mode: {
    enabled: true,
    default_consent: 'denied'
  }
});
```

This automatically detects consent events from popular CMPs like OneTrust, Cookiebot, etc.

**Enable URL Passthrough:**

```javascript
intk.init({
  consent_mode: {
    enabled: true,
    default_consent: 'denied',
    url_passthrough: true  // Enable data transfer between pages when consent denied
  }
});
```

When `url_passthrough: true`, tracking parameters (UTM, gclid, fbclid, etc.) will be passed between pages via URL parameters and window.name when consent is denied. This improves attribution accuracy but transfers some data without explicit consent. By default, URL passthrough is disabled for maximum privacy.

**Custom CMP with Specific Event:**

```javascript
intk.init({
  consent_mode: {
    enabled: true,
    default_consent: 'denied',
    event_names: ['my_cmp_consent_updated'],
    field_mapping: {
      analytics_storage: 'analyticsConsent',
      ad_storage: 'marketingConsent'
    }
  }
});

// Your CMP pushes:
// dataLayer.push({
//   event: 'my_cmp_consent_updated',
//   analyticsConsent: true,
//   marketingConsent: false
// });
```

**Custom Parser for Unknown CMP:**

```javascript
intk.init({
  consent_mode: {
    enabled: true,
    default_consent: 'denied',
    custom_parser: (item) => {
      if (item.event === 'myCustomConsentEvent') {
        return {
          analytics_storage: item.myAnalytics ? 'granted' : 'denied',
          ad_storage: item.myAds ? 'granted' : 'denied'
        };
      }
      return null;  // Let built-in parsers handle other events
    }
  }
});
```

**Supported CMP Events:**

| CMP | Event Name | Data Structure |
|-----|------------|----------------|
| GTM Consent Mode | `['consent', 'update', {...}]` | Array with consent object |
| OneTrust | `OneTrustGroupsUpdated` | `OptanonActiveGroups: ',C0001,C0002,'` |
| Cookiebot | `CookiebotOnAccept` | `CookieConsent: { statistics, marketing }` |
| Axeptio | `consent.answer` | `privacy_consent_value: 'full'\|'partial'\|'refusal'` |
| Sirdata | `sirdataConsent` | Event presence indicates consent |
| Consentmo | `consent_status` | `analytics: true, marketing: true` |
| Didomi | `didomi:consent` | `purposes: { analytics, advertising }` |
| Termly | `termly_consent` | `analytics: true, advertising: true` |
| TrustArc | `truste.consent.update` | `consentDecision: { analytics, targeting }` |
| Iubenda | `iubenda_consent_given` | `purposes: { measurement, marketing }` |
| Klaro | `klaro-consent` | `services: { analytics, marketing }` |
| Generic | `consent_update` | `analytics_storage, ad_storage` |

**⚠️ Privacy Note:** When consent is denied, intake does not use cookies, localStorage, or sessionStorage. Data is only passed via URL parameters and runtime memory (window.name).

**Legacy: wait_for_gtag_timeout**

The `wait_for_gtag_timeout` parameter is deprecated. The new dataLayer listener approach is event-driven and doesn't require polling or timeouts. However, the parameter is still accepted for backward compatibility.

---

## `link_decoration`

```javascript
link_decoration: {
  enabled: true,
  allowedDomains: ['partner.com', '*.example.org', 'app.mysite.com'],
  decorateUtm: true,      // default: true
  decorateClickIds: true, // default: true
  customParams: {
    affiliate_id: 'abc123',
    partner: 'acme'
  }
}
```

Configure external link decoration to pass UTM parameters and click IDs to specified domains.

**Features:**

- Decorates outbound links to allowed domains with tracking parameters
- Supports exact domain match and wildcard subdomains (`*.domain.com`)
- Never decorates same-origin links (internal navigation)
- Respects consent status (disabled when consent is denied)
- Uses event delegation for performance

**Parameters:**

- **`enabled`**: (default: `false`) Enable/disable link decoration
- **`allowedDomains`**: Array of domains to decorate links for
  - Exact match: `'partner.com'`
  - Wildcard subdomains: `'*.partner.com'` (matches `sub.partner.com`, `deep.sub.partner.com`, and `partner.com` itself)
- **`decorateUtm`**: (default: `true`) Pass UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
- **`decorateClickIds`**: (default: `true`) Pass click IDs (`gclid`, `fbclid`, `msclkid`, `ttclid`, etc.)
- **`customParams`**: Additional custom parameters to add to decorated links

**How It Works:**

When a user clicks a link to an allowed domain, Intake automatically appends tracking parameters from the current traffic source:

1. UTM parameters from current source (if `decorateUtm: true`)
2. Click IDs from URL/cookies (if `decorateClickIds: true`)
3. Custom parameters (if configured)

**Example:**

User arrived via `utm_source=google&gclid=abc123` and clicks a link to `partner.com/page`:

```
Before: https://partner.com/page
After:  https://partner.com/page?utm_source=google&utm_medium=cpc&gclid=abc123
```

**Basic Example:**

```javascript
intk.init({
  link_decoration: {
    enabled: true,
    allowedDomains: ['partner.com', 'affiliate.org']
  }
});
```

**With Custom Parameters:**

```javascript
intk.init({
  link_decoration: {
    enabled: true,
    allowedDomains: ['partner.com', '*.example.org'],
    decorateUtm: true,
    decorateClickIds: true,
    customParams: {
      affiliate_id: 'xyz789',
      source_site: 'main'
    }
  }
});
```

**UTM Only (No Click IDs):**

```javascript
intk.init({
  link_decoration: {
    enabled: true,
    allowedDomains: ['partner.com'],
    decorateUtm: true,
    decorateClickIds: false
  }
});
```

**Supported Click IDs:**

| Parameter | Platform |
|-----------|----------|
| `gclid` | Google Ads |
| `wbraid` | Google Ads (web-to-app) |
| `gbraid` | Google Ads (app-to-web) |
| `dclid` | Google Display & Video 360 |
| `fbclid` | Facebook Ads |
| `msclkid` | Microsoft Advertising |
| `ttclid` | TikTok Ads |
| `li_fatid` | LinkedIn Ads |
| `twclid` | Twitter/X Ads |
| `snapclid` | Snapchat Ads |
| `pclid` | Pinterest Ads |

**⚠️ Privacy Note:** Link decoration is disabled by default and requires explicit configuration. It also respects consent status — when consent is denied, link decoration is disabled.

**⚠️ Security Note:** Only links to explicitly whitelisted domains are decorated. Links to other domains are never modified.

---

## `callback`

```javascript
callback: doSomething
```

Callback function. Just pass a function to this option, and it will be executed right after cookies are set. Callback will get an object with intk data as argument.

**Example:**

```javascript
function logSource(intkData) {
  console.log(`Cookies are set! Your source is: ${intkData.current.src}`);
  console.log(`First visit source: ${intkData.first.src}`);
  console.log(`Touchpoints:`, intkData.touchpoints);
  console.log(`Click IDs:`, intkData.click_ids);
  console.log(`Analytics IDs:`, intkData.analytics_ids);
}

intk.init({
  callback: logSource
});
```

**Note:** Callback is called twice:

1. Immediately after initialization with synchronous data
2. After all async data (analytics IDs, PII) is collected

---

## Complete Example

```javascript
intk.init({
  // Basic configuration
  domain: 'site.com',
  lifetime: 6,
  session_length: 30,

  // Custom sources
  referrals: [
    {
      host: 'facebook.com',
      medium: 'social',
      display: 'facebook'
    }
  ],
  organics: [
    {
      host: 'duckduckgo.com',
      param: 'q',
      display: 'duckduckgo'
    }
  ],

  // Campaign parameters
  campaign_param: 'campaign_id',
  term_param: 'keyword',
  content_param: 'ad_content',

  // User data
  user_ip: '192.168.1.1',
  promocode: {
    min: 100000,
    max: 999999
  },

  // Advanced features
  analytics_ids: {
    google_analytics: true,
    amplitude: true
  },
  pii_collection: {
    enabled: true,
    email_selectors: ['input[type="email"]'],
    phone_selectors: ['input[type="tel"]']
  },
  user_id: {
    source: 'cookie',
    key: 'user_id'
  },

  // SPA and integration
  spa_tracking: true,
  data_layer: true,

  // Privacy
  consent_mode: {
    enabled: true,
    default_consent: 'denied',
    wait_for_gtag_timeout: 3000  // Wait up to 3 seconds for gtag
  },

  // External link decoration
  link_decoration: {
    enabled: true,
    allowedDomains: ['partner.com', '*.affiliate.org'],
    decorateUtm: true,
    decorateClickIds: true,
    customParams: {
      affiliate_id: 'abc123'
    }
  },

  // Callback
  callback: function(data) {
    console.log('Intake initialized:', data);
  }
});
```

---

## Public API Methods

### `intk.get`

Access all collected data:

```javascript
const data = intk.get;
console.log(data.current);      // Current visit source
console.log(data.first);        // First visit source
console.log(data.session);      // Session data
console.log(data.udata);        // User data
console.log(data.touchpoints);  // Touchpoint chain
console.log(data.click_ids);    // Click IDs
console.log(data.analytics_ids); // Analytics IDs
console.log(data.pii_hashes);   // PII hashes
console.log(data.user_id);      // User ID
console.log(data.metadata);     // Metadata (consent, operating mode)
```

### `intk.trackPageview(url?)`

Manually track a page view (useful for SPA):

```javascript
intk.trackPageview('/new-page');
```

### `intk.getAttribution(model)`

Get attribution credit for different models:

```javascript
const attribution = intk.getAttribution('u-shaped');
console.log(attribution.credits);  // Array of touchpoints with credits
```

**Supported models:** `'first'`, `'last'`, `'linear'`, `'u-shaped'`, `'time-decay'`

### `intk.toJSON()`

Return a deep-cloned snapshot of `intk.get` — every traffic, identity, session, touchpoint, click-id, and metadata field — ready to JSON-serialize and POST to your backend in one request:

```javascript
fetch('/api/attribution', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(intk),   // intk.toJSON() is called automatically
});
```

Follows the standard JS `toJSON` convention, so `JSON.stringify(intk)` picks it up automatically. The returned object is a deep clone — safe to mutate without affecting library internals. Async fields (`analytics_ids`, async `pii_hashes`) only land after the configured `callback` fires a second time — call `intk.toJSON()` from inside `callback` to capture the fully-populated payload.

### `intk.setUserId(userId)`

Manually set User ID:

```javascript
intk.setUserId('user123');
```

### `intk.withdrawConsent()`

Manually withdraw consent and clear all data:

```javascript
intk.withdrawConsent();
```

---

## Migration from v1

Intake v2 is backward compatible with v1. All v1 configuration parameters work the same way. New parameters are optional and don't affect existing functionality.

**Breaking changes:** None. All v1 code will work without modifications.

**New features:** Multi-touch attribution, click IDs collection, analytics IDs collection, PII hashing, User ID, SPA tracking, dataLayer integration, Consent Mode v2 support, external link decoration.

---

© 2026 intake.plurio.ai

intake.js
