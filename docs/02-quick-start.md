# Quick start

Get Intake running with minimal setup.

> **Skip the manual setup:** the [Configurator](../tools/configurator/) can generate your snippet or GTM container from a short interview — as a **skill** ([`SKILL.md`](../tools/configurator/SKILL.md)) in an agentic tool, or by pasting [`PROMPT.md`](../tools/configurator/PROMPT.md) into any chat assistant.

## 1. Load the script

Choose one of:

- **ESM (browser):** `<script type="module">` and `import intk from './intake.esm.js';`
- **UMD (browser):** `<script src="intake.js"></script>` — then `intk` is on `window`.
- **GTM:** `<script src="intake.gtm.js"></script>` — same global `intk`.

See [Installation](01-installation.md) for npm and script-tag details.

## 2. Call `intk.init()`

You can call `init()` with no arguments. Cookies will use default settings (current domain, 6 months lifetime, 30 minutes session). For production you usually set at least `domain` so cookies are consistent across your host.

```javascript
intk.init();
```

With minimal config:

```javascript
intk.init({
  domain: 'site.com',
  callback: function(data) {
    console.log('Current source:', data.current.src);
  }
});
```

## 3. What init does

- **Detects** the current traffic source (UTM, referrer, organic, or direct).
- **Updates or sets cookies** (when consent is granted): first visit, current source, session, user data, optional promocode, touchpoints, click IDs, etc. If [consent mode](03-configuration.md#consent_mode) is enabled and consent is denied, no cookies are set; optional parameter forwarding can still pass data between pages.
- **Fills `intk.get`** with the same data so you can read it immediately in code (e.g. `intk.get.current.src`, `intk.get.first.src`).
- **Runs your `callback`** once (and again after async data like analytics IDs or PII hashes are ready, if configured).
- **Pushes to dataLayer** (if `data_layer` is not disabled) — e.g. `intk_ready` with `intk_user_profile`.

So right after `init()`, you can use `intk.get` and, if you passed a `callback`, it will run with the current attribution data.

## 4. Minimal full example

**Via script tag (UMD):**

```html
<script src="path/to/intake.js"></script>
<script>
  intk.init({
    domain: 'example.com',
    callback: function(data) {
      console.log('Source:', data.current.src);
      console.log('Medium:', data.current.mdm);
    }
  });
  // Also available synchronously:
  console.log(intk.get.current.src);
</script>
```

**Via ESM import:**

```javascript
import intk from '@plurio/intake';

intk.init({
  domain: 'example.com',
  callback: function(data) {
    console.log('Source:', data.current.src);
  }
});

console.log(intk.get.current.src);
```

## Next steps

- [Configuration](03-configuration.md) — all options for `intk.init()`.
- [API and usage](04-api-and-usage.md) — reading `intk.get`, `trackPageview`, `getAttribution`, `setUserId`, `withdrawConsent`.
