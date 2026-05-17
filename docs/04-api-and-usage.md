# API and usage

After `intk.init()` has run, you read data from `intk.get` and use the methods below.

## Data object: `intk.get`

`intk.get` is populated during `init()` and updated by `trackPageview()` and `setUserId()`. It has the following shape (see `IntkData` in the codebase).

### Traffic attribution

| Property | Type | Description |
|----------|------|-------------|
| `intk.get.current` | `TrafficSource` | Latest (current) source. |
| `intk.get.current_add` | `ExtraData` | Extra data for the current source (date, entrance URL, referrer). |
| `intk.get.first` | `TrafficSource` | First-ever source (never overwritten). |
| `intk.get.first_add` | `ExtraData` | Extra data for the first source. |

**TrafficSource fields:** `typ` (traffic type), `src` (source), `mdm` (medium), `cmp` (campaign), `cnt` (content), `trm` (term).
**Traffic types:** `'utm'`, `'organic'`, `'referral'`, `'in_app'`, `'typein'`.

`'in_app'` is emitted when a visit has no UTM/click ID, no organic referrer, and no referral, but `navigator.userAgent` matches a known in-app browser (Instagram, Facebook, TikTok, Telegram, etc.). See [Configuration → `in_app_browsers`](./03-configuration.md#in_app_browsers).

**ExtraData fields:** `fd` (date/time of visit), `ep` (entrance URL), `rf` (referrer URL).

### Session and user

| Property | Type | Description |
|----------|------|-------------|
| `intk.get.session` | `SessionData` | Current session: `pgs` (pages seen), `cpg` (current page URL). |
| `intk.get.udata` | `UserData` | `vst` (visit count), `uip` (IP if set), `uag` (user-agent). |
| `intk.get.promo` | `PromoData` | `code` (promocode if configured). Always present; may be `{}`. |

### Optional / feature-dependent

| Property | Type | Description |
|----------|------|-------------|
| `intk.get.touchpoints` | `TouchpointChain` | `touchpoints: Touchpoint[]` — chain for multi-touch attribution. |
| `intk.get.click_ids` | `ClickIds` | gclid, fbclid, msclkid, ttclid, etc. (from URL/cookies). |
| `intk.get.analytics_ids` | `AnalyticsIds` | ga_client_id, amplitude_id, mixpanel_id, etc. (async). |
| `intk.get.pii_hashes` | `PiiHashes` | email_hash, phone_hash (SHA-256) if PII collection enabled. |
| `intk.get.user_id` | `string` | User ID if configured or set via `setUserId`. |
| `intk.get.metadata` | `IntkMetadata` | `consent_status`, `operating_mode` (persistent_storage vs parameter_forwarding). |

---

## Methods

### `intk.trackPageview(url?)`

Updates attribution for a “virtual” page view. Used automatically for SPA navigation (History API) when `spa_tracking` is enabled. Pass optional `url` (e.g. new path after `pushState`); if omitted, uses `window.location.href`.

- Updates `current` / `current_add` / `session` / touchpoints / click_ids by the same rules as init.
- Updates `intk.get` and pushes to dataLayer (if enabled). Calls `callback` if configured.

```javascript
intk.trackPageview();
intk.trackPageview('/checkout/step2');
```

---

### `intk.getAttribution(model)`

Returns attribution credits for the current touchpoint chain.

- **Argument:** `model` — one of `'first'`, `'last'`, `'linear'`, `'u-shaped'`, `'time-decay'`.
- **Returns:** `{ model, credits: [{ touchpoint, credit }], totalCredit }` (totalCredit = 1.0).

Use when you have `intk.get.touchpoints` (chain of significant sources). Requires touchpoints to be collected (default behavior when consent is granted).

```javascript
const result = intk.getAttribution('last');
console.log(result.credits[0].touchpoint.src);
```

---

### `intk.setUserId(userId)`

Set or clear the User ID. Accepts `string` or `null` (clears). Updates `intk.get.user_id` and pushes to dataLayer if enabled.

```javascript
intk.setUserId('user_123');
intk.setUserId(null);
```

---

### `intk.withdrawConsent()`

Programmatic consent withdrawal: clears all Intake cookies and storage, sets consent status to denied, stops link decoration, and (if `url_passthrough` was enabled) turns on parameter forwarding. Then pushes updated data to dataLayer.

Call this when the user revokes consent in your CMP (if the CMP does not push a consent event that Intake already listens to).

```javascript
intk.withdrawConsent();
```

---

## Examples

### Phone or content by source

```javascript
intk.init({ domain: 'site.com' });
var src = intk.get.current.src;
var phone = src === 'google' ? '+1-800-GOOGLE' : '+1-800-DEFAULT';
document.getElementById('phone').textContent = phone;
```

### Hidden form fields for CRM

```javascript
intk.init({
  domain: 'site.com',
  callback: function(data) {
    document.querySelector('input[name="utm_source"]').value = data.current.src;
    document.querySelector('input[name="utm_medium"]').value = data.current.mdm;
    document.querySelector('input[name="first_source"]').value = data.first.src;
  }
});
```

### Using touchpoints and attribution

```javascript
intk.init({ domain: 'site.com' });
var chain = intk.get.touchpoints;
if (chain && chain.touchpoints.length) {
  var lastTouch = intk.getAttribution('last');
  console.log('Last touch source:', lastTouch.credits[0].touchpoint.src);
}
```

---

## Next steps

- [Cookies](05-cookies.md) — cookie names and formats.
- [Limitations](06-limitations.md) — known limits and recommendations.
