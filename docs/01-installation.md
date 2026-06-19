# Installation

This page describes how to include Intake in your project.

## Configurator (AI-assisted setup)

Prefer not to hand-write your config? The **Intake Configurator** interviews you about your site and generates a ready-to-paste **standalone snippet** or a **GTM container JSON**, with sensible defaults and version pinning. It lives in [`tools/configurator/`](../tools/configurator/) and works three ways:

- **As a skill** — for agentic tools (Claude Code, Cursor). Point the agent at [`SKILL.md`](../tools/configurator/SKILL.md); it runs the interview and calls `generate.py` to produce the output file.
- **As a chat prompt** — for any chat assistant (ChatGPT, Gemini, Claude). Paste the contents of [`PROMPT.md`](../tools/configurator/PROMPT.md) as your first message; it runs the full interview and outputs the snippet or container — no local tooling required.
- **As a CLI** — `python3 tools/configurator/generate.py --mode standalone|gtm --interview interview.json` (see the [configurator README](../tools/configurator/README.md)).

To wire Intake up manually instead, use the options below.

## npm

Install the package:

```bash
npm install @plurio/intake
```

Then use it as a module:

- **ES Modules** (recommended for modern bundlers):

  ```javascript
  import intk from '@plurio/intake';
  intk.init({ domain: 'site.com' });
  ```

- **CommonJS** (Node or older bundlers):

  ```javascript
  const intk = require('@plurio/intake');
  intk.init({ domain: 'site.com' });
  ```

The package exposes the built files; see the project's `package.json` `main` and module entry points. After `npm install`, your bundler will resolve `@plurio/intake` to the appropriate build (UMD or ESM depending on configuration).

## Script tag (browser)

If you are not using a bundler, load one of the built scripts from the `dist` folder.

### UMD build (global `intk`)

Use this for classic script tags. The library attaches to `window.intk`.

```html
<script src="path/to/intake.js"></script>
<script>
  intk.init({ domain: 'site.com', callback: function(data) {
    console.log('Source:', data.current.src);
  }});
</script>
```

Build output: `dist/intake.js` (from `npm run build:standard`).

### ESM build (module script)

For native ES modules in the browser:

```html
<script type="module">
  import intk from './path/to/intake.esm.js';
  intk.init({ domain: 'site.com' });
</script>
```

Build output: `dist/intake.esm.js`.

## GTM build (Google Tag Manager)

For use inside Google Tag Manager or other environments that require ES5-compatible code, use the GTM build:

```html
<script src="path/to/intake.gtm.js"></script>
<script>
  intk.init({ domain: 'site.com', lifetime: 6 });
</script>
```

Build output: `dist/intake.gtm.js`. Generate it with:

```bash
npm run build:gtm
```

Or build everything (standard + GTM):

```bash
npm run build
```

The GTM build is transpiled to ES5 (e.g. with Babel) so it runs in older browsers and inside GTM custom HTML tags.

## Requirements

- **Environment:** Browser only. Intake is not intended for Node.js server-side execution.
- **Cookies:** The library stores data in cookies when consent is granted. Ensure your site can set first-party cookies (and, if using consent mode, that your CMP and `consent_mode` config are aligned).
- **Build:** For script-tag usage, use the pre-built files from `dist/` after running `npm run build` (and optionally `npm run build:gtm`). For npm-based projects, the installed package provides the built outputs.

## Next steps

- [Quick start](02-quick-start.md) — minimal setup and first `intk.init()` call.
- [Configuration](03-configuration.md) — all init options.
