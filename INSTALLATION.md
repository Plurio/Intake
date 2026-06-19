# Intake Installation

## Configurator (generate your config automatically)

The fastest way to set up Intake is the **Configurator** in [`tools/configurator/`](tools/configurator/): a short interview that produces a ready-to-paste **standalone snippet** or a **GTM container JSON**. Use it as a **skill** ([`tools/configurator/SKILL.md`](tools/configurator/SKILL.md)) inside an agentic tool (Claude Code, Cursor), as a **chat prompt** ([`tools/configurator/PROMPT.md`](tools/configurator/PROMPT.md)) in any assistant (ChatGPT, Gemini, Claude), or as a **CLI** (`python3 tools/configurator/generate.py …`). Prefer to wire it up manually? Continue below.

## Installation via npm

```bash
npm install @plurio/intake
```

## Usage

### Option 1: ES Modules (modern projects)

```javascript
import intk from '@plurio/intake';

intk.init({
  domain: 'site.com',
  lifetime: 6,
  callback: (data) => {
    console.log('Source:', data.current.src);
  }
});

// Using the data
const source = intk.get.current.src;
```

### Option 2: CommonJS (Node.js / legacy bundlers)

```javascript
const intk = require('@plurio/intake');

intk.init({
  domain: 'site.com',
  lifetime: 6
});
```

### Option 3: Browser via JavaScript file

```html
<script src="path/to/intake.js"></script>
<script>
  intk.init({
    domain: 'site.com',
    lifetime: 6,
    callback: function(data) {
      console.log('Source:', data.current.src);
    }
  });

  // Using the data
  const source = intk.get.current.src;
</script>
```

### Option 4: CDN (when published)

```html
<script src="https://cdn.example.com/intake.js"></script>
<script>
  intk.init({
    domain: 'site.com'
  });
</script>
```

### Option 5: Google Tag Manager (Custom HTML tag)

Paste the contents of `intake.gtm.js` directly into a **Custom HTML** tag in GTM, followed by your init code:

```html
<script>
  // Paste the full contents of intake.gtm.js here
  // ...

  intk.init({
    domain: 'site.com',
    lifetime: 6
  });
</script>
```

The `intake.gtm.js` build is transpiled to ES5 for maximum browser compatibility.

### Option 6: GTM build via external script

If you prefer loading from a hosted file instead of inline:

```html
<script src="path/to/intake.gtm.js"></script>
<script>
  intk.init({
    domain: 'site.com',
    lifetime: 6
  });
</script>
```

## Minimal example

### Via npm / ES Modules:

```javascript
import intk from '@plurio/intake';

intk.init({
  domain: 'example.com',
  callback: (data) => {
    console.log('Current source:', data.current.src);
    console.log('First source:', data.first.src);
  }
});
```

### Via JavaScript file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Intake Example</title>
</head>
<body>
  <script src="dist/intake.js"></script>
  <script>
    intk.init({
      domain: 'example.com',
      callback: function(data) {
        console.log('Current source:', data.current.src);
        console.log('First source:', data.first.src);
      }
    });
  </script>
</body>
</html>
```

## Build output files

After running `npm run build:all`, the following files are available in the `dist/` directory:

- **`intake.js`** — UMD build for browsers (37 KB)
- **`intake.esm.js`** — ES module build for bundlers (37 KB)
- **`intake.gtm.js`** — GTM build with ES5 transpilation (47 KB)

## Quick start

1. Install the library: `npm install @plurio/intake`
2. Import or include the script file
3. Call `intk.init()` with your configuration
4. Use `intk.get` to access the data

```javascript
import intk from '@plurio/intake';

intk.init({
  domain: 'your-site.com',
  lifetime: 6,
  session_length: 30
});

// Data is available via intk.get
console.log(intk.get.current);  // Current source
console.log(intk.get.first);    // First-touch source
console.log(intk.get.session);  // Session data
```

For full configuration details, see [CONFIGURATION.md](./CONFIGURATION.md).
