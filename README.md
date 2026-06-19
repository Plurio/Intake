# Intake

**The first step to full-funnel analytics.** Intake is a privacy-first JavaScript library for client-side traffic source detection, multi-touch attribution, click ID tracking, and CRM identity resolution — in ~14 kB with zero dependencies.

Built by the team behind [**Plurio**](https://www.plurio.ai/), an AI agent for performance marketing. Pair Intake on your site with Plurio to turn raw attribution data into decisions: optimisation rules, LTV/revenue automation, and plain-English queries over your ad, CRM, and backend data.

- Website: [intake.plurio.ai](https://intake.plurio.ai)
- Plurio: [plurio.ai](https://www.plurio.ai/)

[![npm version](https://img.shields.io/npm/v/@plurio/intake.svg)](https://www.npmjs.com/package/@plurio/intake)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Traffic source detection** — UTM parameters, organic search (Google, Bing, DuckDuckGo, Ecosia, Brave, Baidu), referral, and direct
- **11 click IDs tracked** — gclid, fbclid, msclkid, ttclid, li_fat_id, twclid, sccid, dclid, gbraid, wbraid, ko_click_id
- **Multi-touch attribution** — first, last, linear, U-shaped, and time-decay models
- **Consent Mode v2** — respects CMP signals; no cookies when consent is denied
- **Cookieless fallback** — parameter forwarding and URL passthrough preserve attribution without persistent storage
- **dataLayer integration** — pushes `intk_ready`, `intk_email`, `intk_phone` events
- **Zero dependencies** — ~14 kB gzipped

## Quick Start

```bash
npm install @plurio/intake
```

```javascript
import intk from '@plurio/intake';

intk.init({
  domain: 'example.com',
  lifetime: 6
});

// Get current traffic source
const source = intk.get.current.src;
const medium = intk.get.current.mdm;
const campaign = intk.get.current.cmp;
```

## Configurator (AI-assisted setup)

Prefer not to hand-write your config? The **Intake Configurator** interviews you about your site and generates a ready-to-paste **standalone snippet** or a **GTM container JSON** — with sensible defaults and version pinning. It lives in [`tools/configurator/`](tools/configurator/) and works three ways:

- **As a skill** — for agentic tools (Claude Code, Cursor). Point the agent at [`tools/configurator/SKILL.md`](tools/configurator/SKILL.md); it runs the interview and calls `generate.py` to produce the output file.
- **As a chat prompt** — for any chat assistant (ChatGPT, Gemini, Claude). Paste the contents of [`tools/configurator/PROMPT.md`](tools/configurator/PROMPT.md) as your first message; it runs the full interview and outputs the snippet or container — no local tooling required.
- **As a CLI** — `python3 tools/configurator/generate.py --mode standalone|gtm --interview interview.json` (see [`tools/configurator/README.md`](tools/configurator/README.md)).

## Builds

| File | Format | Use case |
|------|--------|----------|
| `intake.js` | UMD | Script tag, legacy bundlers |
| `intake.esm.js` | ESM | Modern bundlers (Vite, webpack, etc.) |
| `intake.gtm.js` | ES5 | Google Tag Manager Custom HTML tag |

## Script Tag

```html
<script src="https://cdn.example.com/intake.js"></script>
<script>
  intk.init({ domain: 'example.com', lifetime: 6 });
</script>
```

## GTM (Custom HTML Tag)

Paste the contents of `intake.gtm.js` directly into a Custom HTML tag in GTM:

```html
<script>
  // Paste the full contents of intake.gtm.js here
  // ...

  intk.init({
    domain: 'example.com',
    lifetime: 6
  });
</script>
```

## Documentation

Full documentation: [intake.plurio.ai](https://intake.plurio.ai)

- [Installation](docs/01-installation.md)
- [Quick Start](docs/02-quick-start.md)
- [Configuration](docs/03-configuration.md)
- [API & Usage](docs/04-api-and-usage.md)
- [Cookies](docs/05-cookies.md)
- [Limitations](docs/06-limitations.md)
- [Configurator](tools/configurator/README.md) — generate a snippet or GTM container via an AI interview (skill + chat prompt)

## License

[MIT](LICENSE)
