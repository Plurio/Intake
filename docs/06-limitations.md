# Limitations

Known limitations and recommended practices.

## Referrer and protocol

### HTTPS → HTTP

When a user follows a link from an **HTTPS** page to an **HTTP** page, the browser does not send the `Referer` header. Intake has no referrer in that case and will classify the visit as **typein** (direct). This is a browser security behavior, not something the library can change.

**Recommendation:** Serve your site over HTTPS so that referrers from other HTTPS sites are preserved.

---

## Consent mode

### No cookies when consent is denied

With [consent mode](03-configuration.md#consent_mode) enabled and consent denied, Intake does **not** set or read cookies (or use localStorage/sessionStorage for its own data). Attribution in that mode relies on:

- **Parameter forwarding** — UTM and click IDs passed via URL and `window.name` when `url_passthrough: true`. Data is not persisted in cookies between sessions.
- **Same-session only** — without cookies, returning users are not recognized; each page load is evaluated with only the current URL and referrer.

### Withdrawing consent

Calling `intk.withdrawConsent()` (or the CMP pushing a consent-denied event that Intake listens to) clears all Intake cookies and storage. Link decoration is disabled. If `url_passthrough` is enabled, parameter forwarding is activated so that attribution can still be passed to same-origin links without cookies.

---

## Cookie and storage limits

- **Cookie size:** Browsers limit cookie size (often 4 KB per cookie). The touchpoint chain is capped (e.g. 50 touchpoints) to avoid overflow. Very long query strings or many touchpoints can approach that limit.
- **SameSite:** Cookies are set without an explicit `SameSite` attribute in the current implementation; browser default applies. Be aware of cross-site scenarios (e.g. if your site is embedded in iframes).
- **Domain/isolate:** Do **not** change the `domain` or `isolate` setting after the script is already in production with existing users. Changing it can lead to duplicate or inconsistent cookies across subdomains.

---

## Script placement and timing

- **Where to load:** Loading the script early in `<head>` ensures cookies are set before other scripts or DOM logic (e.g. phone substitution) run. If you load it asynchronously, ensure `intk.init()` runs before any code that reads `intk.get`.
- **Single init:** Call `intk.init()` once per page load. Repeated inits are supported but usually unnecessary; the second run will reuse or update cookies as per attribution rules.

---

## SPA and History API

- **Assumption:** SPA tracking relies on the **History API** (`pushState` / `replaceState`). If your SPA uses hash-based routing only (`#/path`) without updating `history.state`, Intake will not auto-detect route changes. In that case call `intk.trackPageview()` manually on route change.
- **trackPageview(url):** When you pass a `url` to `trackPageview`, that URL is used as the “current page” for session and entrance data. The script still reads `window.location` for the actual document URL when detecting UTM/referrer; in SPA flows the document URL is usually already updated when the History API fires.

---

## Attribution rules (recap)

- **UTM and organic** always override the previous current source.
- **Referral** overrides only when there is **no** active session (session length is configurable; default 30 minutes).
- **Typein** (direct) never overrides; the previous current source is kept.

These rules match common GA-like behavior. Changing `session_length` or mixing subdomains with different `domain`/`isolate` settings can change how often referral or typein is recorded.

---

## Next steps

- [Overview](00-overview.md) — back to the documentation index.
- [Configuration](03-configuration.md) — tune `domain`, `session_length`, and consent/link decoration.
