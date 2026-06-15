---
name: plurio-intake-configurator
description: >-
  Configure @plurio/intake for any website. Fetches the latest configuration
  reference from GitHub, conducts a full interview covering all parameters,
  and produces either a standalone HTML snippet or a complete GTM container JSON.
  Triggers on: "configure Intake", "install Intake", "add Intake to site",
  "set up @plurio/intake", "Intake snippet", "Intake GTM container",
  "настроить Intake", "подключить Intake", "скрипт для сайта Intake",
  "добавить Intake на сайт".
---

# Plurio Intake Configurator

Configure `@plurio/intake` for any website through a full interview covering all available parameters, then generate a ready-to-use snippet or GTM container JSON.

| Deliverable | Format | How to deploy |
|---|---|---|
| Standalone snippet | `intake-snippet.html` | Paste the two `<script>` tags into every page's `<head>` before `</head>` |
| GTM container | `intake-gtm-container.json` | GTM Admin → Import Container → Merge (any workspace) |

- **Product page:** https://intake.plurio.ai/
- **Config reference:** https://github.com/plurio/Intake/blob/main/CONFIGURATION.md
- **Generator script:** `tools/configurator/generate.py`

---

## Step 0 — Locate script + fetch live config reference

Resolve the path to `generate.py` — it lives next to this SKILL.md in `tools/configurator/`:

```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# or if running from the repo root:
SCRIPT_DIR="tools/configurator"
```

Then use WebFetch to retrieve the live configuration reference:

```
URL: https://raw.githubusercontent.com/plurio/Intake/main/CONFIGURATION.md
```

**If fetch succeeds:** use the fetched parameter list as the authoritative reference. If it contains parameters not listed in this skill's interview below, add questions for those parameters before Step 3.

**If fetch fails:** proceed using the full parameter list defined in this skill (below). No configuration will be missed — all known parameters are covered.

---

## Step 1 — Mode selection

> **What do you need to generate?**
> - **A — Standalone snippet** — two `<script>` tags to paste directly into every page's `<head>`
> - **B — GTM container** — a JSON file to import into Google Tag Manager (Admin → Import Container → Merge)

Save answer to `mode` (`standalone` | `gtm`).

---

## Step 1.5 — Quick or full setup?

> **How would you like to configure Intake?**
> - **Quick setup** ← recommended — 4 essential questions, done in under a minute. Sensible defaults are applied for everything else.
> - **Full setup** — go through all 22 parameters across 8 groups for complete control.

- **Quick setup** → go to **Step 2-Quick**, then skip to Step 3
- **Full setup** → go to **Step 2-Full**, then proceed to Step 3

---

## Step 2-Quick — Essential questions only (4 questions)

Ask one at a time. Save answers to `/tmp/intake_configurator.json`.

**Q1 — Consent mode (GDPR)**
> Does the site use a CMP (OneTrust, Cookiebot, Didomi, Axeptio, or similar) to manage user consent?
- **Yes** → `"consent_mode": true`, `"consent_default": "denied"`, `"url_passthrough": true`
  - Ask: *Denied or granted as default?* (default: `denied`)
  - Ask: *Pass UTM params through when consent is declined?* Recommended: **Yes** → `"url_passthrough": true/false`
- **No** → `"consent_mode": false`

**Q2 — Email and phone collection**
> Should Intake collect and hash email addresses and phone numbers for CRM matching?
> Recommended: **Yes**.
- **Yes** → `"pii_collection_enabled": true`
- **No** → `"pii_collection_enabled": false`

**Q3 — User ID**
> Authenticated users with a user ID? If yes — source: dataLayer / cookie / localStorage?
- **No** → `"user_id_source": null`
- **Yes** → set `"user_id_source"` + `"user_id_key"`

**Q4 — SPA**
> Single-page app (React, Vue, Angular, Next.js with client-side routing)?
- **Yes** → `"spa": true`
- **No** → `"spa": false`

Defaults applied silently: `data_layer: true`, `analytics_ids: { google_analytics: true }`, 7 social referrals, in-app browser detection enabled.

→ Proceed to Step 3.

---

## Step 2-Full — Full interview

Save all answers to `/tmp/intake_configurator.json`. Ask questions **one group at a time** — introduce each group with its heading, then ask all questions in that group before moving to the next.

---

### Group A — Privacy & Consent

**A1 — Consent mode (GDPR)**

> Does the site use a CMP (OneTrust, Cookiebot, Didomi, Axeptio, or similar) to manage user consent?

- **Yes** → `"consent_mode": true`; ask A1a and A1b
- **No** → `"consent_mode": false`

**A1a — Default consent status**
> What should the default consent status be before the user makes a choice?
> - `denied` — recommended for GDPR sites
> - `granted` — for non-GDPR sites

Save: `"consent_default"` (`"denied"` | `"granted"`, default: `"denied"`)

**A1b — URL pass-through**
> Should UTM parameters be passed through for attribution when a user declines consent?
> Recommended: **Yes** — preserves traffic source data even when consent is declined.

- **Yes** (recommended) → `"url_passthrough": true`
- **No** → `"url_passthrough": false`

**A1c — Custom consent event names**
> Does your CMP fire custom GTM events for consent updates (e.g. `"OneTrustGroupsUpdated"`)? If yes, list them. If no — skip.

- If provided: `"consent_event_names": ["<event1>", ...]`
- If skipped: omit

---

**A2 — Email and phone collection**

> Should Intake collect email addresses and phone numbers for CRM matching?
> Values are hashed via SHA-256 — raw data is never stored.
> Recommended: **Yes**.

- **Yes** (recommended) → `"pii_collection_enabled": true`
- **No** → `"pii_collection_enabled": false`

**A2a — Custom email selectors** *(only if A2 = Yes)*
> Intake auto-detects standard email inputs. Do you have custom selectors to add (e.g. `"input[name='email_address']"`)? Skip to use defaults.

- If provided: `"pii_email_selectors": ["<selector>", ...]`
- If skipped: omit

**A2b — Custom phone selectors** *(only if A2 = Yes)*
> Same for phone inputs — any custom selectors? Skip to use defaults.

- If provided: `"pii_phone_selectors": ["<selector>", ...]`
- If skipped: omit

---

### Group B — User Identification

**B1 — User ID**

> Does the site have authenticated users with a user ID (CRM, backend, auth system)?
> If yes — where should Intake read the ID from?

- **No / no authentication** → `"user_id_source": null`
- **Yes, from dataLayer** → ask key name (e.g. `userId`) → `"user_id_source": "dataLayer"`, `"user_id_key": "<key>"`
- **Yes, from cookie** → ask cookie name → `"user_id_source": "cookie"`, `"user_id_key": "<name>"`
- **Yes, from localStorage** → ask key name → `"user_id_source": "localStorage"`, `"user_id_key": "<key>"`

**B2 — User IP**

> Should Intake receive the visitor's IP address (passed from your backend)?
> Leave blank if not applicable.

- If provided: `"user_ip": "<value or JS expression>"`
- If skipped: omit

**B3 — Promocodes**

> Should Intake generate random promo codes for visitors?

- **No** (default) → omit
- **Yes, simple** → `"promocode": true`
- **Yes, with custom settings** → ask for config object (length, charset, prefix, etc.) → `"promocode": { ... }`

---

### Group C — SPA & GTM Integration

**C1 — Single Page App**

> Is this a single-page app (React, Vue, Angular, Next.js with client-side routing)?

- **Yes** → `"spa": true`
- **No** → `"spa": false`

**C2 — GTM dataLayer push**

> Should Intake push an `intk_ready` event to GTM's dataLayer after initialization?
> Recommended: **Yes** (required if using GTM triggers based on Intake data).

- **Yes** (recommended, default) → `"data_layer": true`
- **No** → `"data_layer": false`

**C3 — GA4 Client ID & Session ID**

> Should Intake collect GA4 Client ID and Session ID for BigQuery stitching?
> Recommended: **Yes**.

- **Yes** (recommended, default) → `"analytics_ga4": true`
- **No** → `"analytics_ga4": false`

---

### Group D — Traffic Source Classification

**D1 — Custom referral sources**

> Intake includes 7 social networks by default (Facebook, Instagram, LinkedIn, Twitter/X, YouTube, TikTok). Do you need to add more referral sources?

- **No** → use defaults only
- **Yes** → for each additional source, ask: host, medium, display name
  Save as: `"custom_referrals": [{ "host": "...", "medium": "...", "display": "..." }, ...]`

**D2 — Custom organic (search) sources**

> Intake has a built-in list of search engines. Do you need to add custom organic sources?

- **No** → omit `organics`
- **Yes** → for each: host, query param name, display name
  Save as: `"organics": [{ "host": "...", "param": "...", "display": "..." }, ...]`

**D3 — Direct traffic label**

> What label should Intake use for direct traffic (no referrer, no UTM)?
> Default: `source: "(direct)"`, `medium: "(none)"`. Skip to keep defaults.

- If customized: `"typein_attributes": { "source": "...", "medium": "..." }`
- If skipped: omit

**D4 — Custom UTM fallback parameters**

> Does the site use non-standard URL parameters as fallbacks for UTM values?
> For example, a `ref` parameter that maps to campaign. Skip if not applicable.

- campaign fallback → `"campaign_param": "<param_name>"`
- term fallback → `"term_param": "<param_name>"`
- content fallback → `"content_param": "<param_name>"`
- If all skipped: omit all three

---

### Group E — In-App Browser Detection

**E1 — In-app browser detection**

> Should Intake detect in-app browsers (Facebook, Instagram, TikTok webviews) and tag them separately?
> Recommended: **Yes** — prevents inflated direct/referral traffic from social apps.

- **Yes** (recommended, default) → omit (enabled by default)
- **No** → `"in_app_browsers": false`
- **Custom patterns** → provide pattern list → `"in_app_browsers": [...]`

---

### Group F — Link Decoration

**F1 — Outbound link decoration**

> Should Intake automatically append UTM parameters and/or click IDs to outbound links (for cross-domain tracking)?

- **No** (default) → omit `link_decoration`
- **Yes** → ask:
  - Which domains to decorate? (comma-separated list)
  - Decorate UTM params? (Yes/No)
  - Decorate click IDs (gclid, fbclid, etc.)? (Yes/No)
  - Any custom params to append?
  Save as: `"link_decoration": { "enabled": true, "allowedDomains": [...], "decorateUtm": true/false, "decorateClickIds": true/false }`

---

### Group G — Session & Cookie Settings

**G1 — Cookie domain**

> Enter the root domain (e.g. `example.com`) if cookies need to be shared across subdomains (`app.example.com`, `www.example.com`, etc.). Skip if the site is on a single domain.

- If provided: `"domain": "<value>"`
- If skipped: omit

**G2 — Cookie lifetime**

> How long should attribution cookies persist?
> Default: **6 months**. Press Enter to keep default.

- If changed: `"lifetime": <number_of_months>`
- If skipped: omit

**G3 — Session length**

> How long should a session last (in minutes) before a new session starts?
> Default: **30 minutes**. Press Enter to keep default.

- If changed: `"session_length": <minutes>`
- If skipped: omit

**G4 — Referral restarts session**

> Should a mid-session referral from an external source start a new session?
> Default: **No**.

- **Yes** → `"referral_starts_new_session": true`
- **No** (default) → omit

**G5 — Timezone offset**

> Should timestamps be normalized to a specific UTC offset (e.g. `3` for UTC+3)?
> Default: visitor's local timezone. Skip to keep default.

- If provided: `"timezone_offset": <number>`
- If skipped: omit

---

### Group H — Advanced

**H1 — Custom callback**

> Should Intake call a JavaScript function after initialization (e.g. to send attribution data to your backend)?

- **No** (default) → omit
- **Yes** → note the callback function name/expression; add it manually to the generated snippet after generation (generate.py outputs a comment placeholder)

---

## Step 3 — Preview config, ask for confirm

Run the preview:

```bash
python3 "$SCRIPT_DIR/generate.py" \
  --mode "$MODE" \
  --interview /tmp/intake_configurator.json \
  --preview
```

Show the output to the user and ask:

> Here is the generated config. Does everything look correct? You can change any parameter or add your own.
> - **Yes, generate** → proceed to Step 4
> - **Edit** → collect changes, update `/tmp/intake_configurator.json`, repeat Step 3

---

## Step 4 — Generate output

```bash
python3 "$SCRIPT_DIR/generate.py" \
  --mode "$MODE" \
  --interview /tmp/intake_configurator.json
```

Output file:
- Standalone → `/tmp/intake-snippet.html`
- GTM → `/tmp/intake-gtm-container.json`

If the user specified a callback (H1), remind them to add it manually to the generated file.

---

## Step 5 — Show output + deployment instructions

Show the file content in a code block, then give deployment instructions based on mode:

### Standalone

```
Add both tags to the <head> of every page (before </head>):

1. The first tag loads the library from CDN.
2. The second tag initializes it with your settings.

Order matters: the config script must come AFTER the library tag.
```

### GTM

```
To apply the container:

1. Open Google Tag Manager → select your account and container
2. Admin (gear icon) → Import Container
3. Select the file intake-gtm-container.json
4. Choose workspace → select the target workspace
5. Import type → Merge (not Overwrite!)
6. Click Confirm
7. Verify the created tags in the "Intake" folder:
   • "Intake – Library" — loads the library, trigger: All Pages
   • "Intake – Config" — initializes with config, fires after Library
8. Preview → confirm both tags fire on All Pages
9. Submit → Version name: "Add Plurio Intake" → Publish
```

---

## Parameter reference (fallback if GitHub unreachable)

All 22 parameters supported by `@plurio/intake`:

| Parameter | Type | Default | Interview question |
|---|---|---|---|
| `domain` | string | current domain | G1 |
| `lifetime` | number | 6 months | G2 |
| `session_length` | number | 30 min | G3 |
| `referral_starts_new_session` | boolean | false | G4 |
| `timezone_offset` | number | visitor TZ | G5 |
| `consent_mode` | object | — | A1 |
| `pii_collection` | object | — | A2 |
| `analytics_ids` | object | — | C3 |
| `data_layer` | boolean | true | C2 |
| `spa_tracking` | boolean | — | C1 |
| `user_id` | object | — | B1 |
| `user_ip` | string | — | B2 |
| `promocode` | boolean/object | false | B3 |
| `referrals` | array | 7 social | D1 |
| `organics` | array | predefined | D2 |
| `typein_attributes` | object | direct/none | D3 |
| `campaign_param` | string | — | D4 |
| `term_param` | string | — | D4 |
| `content_param` | string | — | D4 |
| `in_app_browsers` | array/boolean | enabled | E1 |
| `link_decoration` | object | — | F1 |
| `callback` | function | — | H1 |

---

## Error handling

| Symptom | Cause | Fix |
|---|---|---|
| `python3: command not found` | Python not installed | Install Python 3.9+ |
| GitHub fetch fails at Step 0 | No network / repo moved | Use fallback parameter list in this skill |
| GTM "Container JSON is invalid" | File format not accepted | Verify the file contains `exportFormatVersion: 2` |
| GTM "Tags already exist" after Merge | Name conflict with existing tags | Rename existing tags in GTM before importing |
| `intk is not defined` in browser | Library tag did not load before Config tag | Verify Library tag is set as Setup Tag for Config tag |
