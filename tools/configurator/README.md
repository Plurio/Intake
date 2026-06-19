# Plurio Intake Configurator

A command-line tool that generates a ready-to-use `@plurio/intake` configuration — either a standalone HTML snippet or a Google Tag Manager container JSON.

## What it produces

| Mode | Output | How to deploy |
|---|---|---|
| `standalone` | `intake-snippet.html` | Paste the two `<script>` tags into every page's `<head>` |
| `gtm` | `intake-gtm-container.json` | GTM Admin → Import Container → Merge |

The GTM container embeds the full library code inline — no runtime CDN dependency.

## Requirements

- Python 3.9+
- Internet access at generation time — to resolve the latest release from npm (for version pinning) and, in `gtm` mode, to fetch the library build from jsDelivr for inlining. Offline, the tool falls back to `@latest` and the `gtm` container falls back to a CDN `<script src>`.

No third-party Python packages required — only stdlib.

## Usage

**1. Create an interview file** describing your configuration:

```json
{
  "consent_mode": true,
  "consent_default": "denied",
  "url_passthrough": true,
  "pii_collection_enabled": true,
  "spa": false
}
```

**2. Preview the generated config:**

```bash
python3 generate.py --mode standalone --interview interview.json --preview
```

**3. Generate the output file:**

```bash
# Standalone snippet → ./intake-snippet.html (current directory)
python3 generate.py --mode standalone --interview interview.json

# GTM container → ./intake-gtm-container.json (current directory)
python3 generate.py --mode gtm --interview interview.json
```

**Custom output path:**

```bash
python3 generate.py --mode gtm --interview interview.json --out /path/to/output.json
```

**Pin a specific library version** (otherwise the latest release is resolved from npm):

```bash
python3 generate.py --mode standalone --interview interview.json --version 2.2.0
```

## Tests

```bash
python3 -m unittest discover -s tools/configurator
```

## Interview file — all parameters

| Key | Type | Default | Description |
|---|---|---|---|
| `domain` | string | — | Root domain for cross-subdomain cookie sharing (e.g. `"example.com"`) |
| `lifetime` | number | 6 | Cookie lifetime in months |
| `session_length` | number | 30 | Session duration in minutes |
| `referral_starts_new_session` | boolean | false | Whether a mid-session referral starts a new session |
| `timezone_offset` | number | — | UTC offset for timestamp normalization |
| `consent_mode` | boolean | — | Enable CMP consent mode integration |
| `consent_default` | string | `"denied"` | Default consent status (`"denied"` or `"granted"`) |
| `url_passthrough` | boolean | true | Pass UTM params through when consent is declined |
| `consent_event_names` | array | — | Custom GTM event names for consent updates |
| `pii_collection_enabled` | boolean | true | Collect and SHA-256 hash emails and phone numbers |
| `pii_email_selectors` | array | — | Custom CSS selectors for email inputs |
| `pii_phone_selectors` | array | — | Custom CSS selectors for phone inputs |
| `analytics_ga4` | boolean | true | Collect GA4 Client ID and Session ID |
| `data_layer` | boolean | true | Push `intk_ready` event to GTM dataLayer |
| `spa` | boolean | `true` (library default) | SPA tracking via History API. Set `false` to disable on a non-SPA site — omitting the key leaves it ON |
| `user_id_source` | string | — | User ID source: `"dataLayer"`, `"cookie"`, or `"localStorage"` |
| `user_id_key` | string | — | Key name to read the user ID from |
| `user_ip` | string | — | Visitor IP address (passed from backend) |
| `promocode` | boolean/object | — | Promo code generation settings |
| `custom_referrals` | array | — | Additional referral sources beyond the 7 social sources this configurator adds |
| `organics` | array | — | Custom organic (search engine) sources |
| `typein_attributes` | object | — | Custom label for direct traffic |
| `campaign_param` | string | — | Custom URL parameter as UTM campaign fallback |
| `term_param` | string | — | Custom URL parameter as UTM term fallback |
| `content_param` | string | — | Custom URL parameter as UTM content fallback |
| `in_app_browsers` | boolean/array | — | In-app browser detection patterns |
| `link_decoration` | object | — | Outbound link UTM decoration settings |

## Defaults applied automatically

The following are included in every generated config without needing to specify them:

- `referrals` — 7 social networks (Facebook, Instagram, LinkedIn, Twitter/X, YouTube, TikTok). These are added *by this configurator*, not the library — its own defaults are only `t.co` and `plus.url.google.com`. Keep the array in your config to retain `medium: social` classification.
- `analytics_ids: { google_analytics: true }` — GA4 Client ID + Session ID
- `data_layer: true` — GTM dataLayer push

## Full example

```json
{
  "domain": "example.com",
  "consent_mode": true,
  "consent_default": "denied",
  "url_passthrough": true,
  "pii_collection_enabled": true,
  "analytics_ga4": true,
  "data_layer": true,
  "spa": false,
  "user_id_source": "dataLayer",
  "user_id_key": "userId",
  "custom_referrals": [
    { "host": "t.me", "medium": "social", "display": "telegram" }
  ],
  "lifetime": 6,
  "session_length": 30
}
```

## Links

- [Intake product page](https://intake.plurio.ai/)
- [Full configuration reference](../CONFIGURATION.md)
- [Installation guide](../INSTALLATION.md)
