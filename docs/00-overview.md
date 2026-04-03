# Intake — Overview

Intake tracks the sources of your site's visitors and stores the data in cookies for further analysis. It handles source attribution in a way that aligns with Google Analytics: UTM and organic sources override previous values; referral overrides only when there is no active session; typein (direct) never overrides a previous source.

## What it does

- **Detects traffic source** from UTM parameters, referrer, organic search (Google, Bing, DuckDuckGo, etc.), or direct (typein).
- **Stores attribution data** in cookies (when consent is granted) so you can use it across pages and sessions.
- **Supports consent-aware behavior**: when consent is denied, no cookies are set; optional parameter forwarding and URL passthrough can preserve attribution without persistent storage.
- **Integrates** with dataLayer (e.g. `intk_ready`, `intk_email`, `intk_phone`), SPA history tracking, and optional PII hashing, analytics IDs, and link decoration.

## Use cases

- **Phone or content substitution** — show different phone numbers or content based on traffic source.
- **Form and CRM integration** — pass source data (and optional PII hashes) into hidden form fields or to your CRM.
- **Analytics and attribution** — use `intk.get` and touchpoint chain for multi-touch attribution models (first, last, linear, U-shaped, time-decay).
- **Consent mode** — respect user consent; when denied, use parameter forwarding (and optional URL passthrough) instead of cookies.
- **Link decoration** — optionally decorate outbound links to partner domains with UTM and click IDs.

## Technology

- Written in TypeScript; built as **UMD** (`intake.js`), **ESM** (`intake.esm.js`), and **GTM** (`intake.gtm.js`, ES5-compatible).
- No runtime dependencies; can be loaded early in `<head>` so cookies are available for DOM manipulation.
- Runs in the browser only (no Node server-side execution).

## Documentation

| Document | Description |
|----------|-------------|
| [Installation](01-installation.md) | npm, script tag, dist files (UMD/ESM/GTM), requirements |
| [Quick start](02-quick-start.md) | Load script, `intk.init()`, minimal example, callback |
| [Configuration](03-configuration.md) | All `intk.init()` options |
| [API and usage](04-api-and-usage.md) | `intk.get`, `trackPageview`, `getAttribution`, `setUserId`, `withdrawConsent` |
| [Cookies](05-cookies.md) | Cookie names, formats, when each is set |
| [Limitations](06-limitations.md) | Known limits and recommendations |
