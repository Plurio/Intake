import { codeToHtml } from 'shiki';
import SectionHeading from '../ui/SectionHeading';
import TabGroup from '../ui/TabGroup';

const codeSnippets = [
  {
    label: 'Basic Setup',
    code: `import intk from '@plurio/intake';

intk.init({
  domain: 'yoursite.com',
  callback: function(data) {
    console.log('Source:', data.current.src);
    console.log('Medium:', data.current.mdm);
    console.log('Campaign:', data.current.cmp);
  }
});

// Read data anytime
const source = intk.get.current.src;
const firstSource = intk.get.first.src;`,
    lang: 'javascript',
  },
  {
    label: 'Multi-Touch Attribution',
    code: `import intk from '@plurio/intake';

intk.init({ domain: 'yoursite.com' });

// Get touchpoint chain
const chain = intk.get.touchpoints;

// Apply attribution model
const result = intk.getAttribution('u-shaped');
// → { model: 'u-shaped', credits: [
//     { touchpoint: {...}, credit: 0.4 },  // First: 40%
//     { touchpoint: {...}, credit: 0.067 }, // Middle: ~7%
//     { touchpoint: {...}, credit: 0.067 },
//     { touchpoint: {...}, credit: 0.067 },
//     { touchpoint: {...}, credit: 0.4 },  // Last: 40%
//   ], totalCredit: 1.0 }

// Available models: 'first', 'last', 'linear', 'u-shaped', 'time-decay'`,
    lang: 'javascript',
  },
  {
    label: 'Privacy & Consent',
    code: `import intk from '@plurio/intake';

intk.init({
  domain: 'yoursite.com',
  consent_mode: {
    enabled: true,
    default_consent: 'denied',
    // URL passthrough when consent denied
    url_passthrough: true,
    // Works with 10+ CMPs out of the box:
    // OneTrust, Cookiebot, Axeptio, Didomi,
    // Sirdata, Termly, TrustArc, Iubenda, Klaro...
  }
});

// Check consent status
console.log(intk.get.metadata?.consent_status);
// → { analytics_storage: 'granted', ad_storage: 'denied' }

// Programmatic consent withdrawal
intk.withdrawConsent();`,
    lang: 'javascript',
  },
  {
    label: 'CRM & Form Enrichment',
    code: `import intk from '@plurio/intake';

intk.init({
  domain: 'yoursite.com',
  // Hash emails/phones with SHA-256 for identity resolution
  // Raw PII never leaves the browser
  pii_collection: {
    enabled: true,
    email_selectors: ['input[type="email"]'],
    phone_selectors: ['input[type="tel"]'],
  },
  callback: function(data) {
    // Populate hidden form fields for CRM enrichment
    document.querySelector('[name="first_source"]').value = data.first.src;
    document.querySelector('[name="first_medium"]').value = data.first.mdm;
    document.querySelector('[name="first_campaign"]').value = data.first.cmp;

    // Pass click IDs — captured automatically from URL
    const clickIds = intk.get.click_ids;
    if (clickIds.gclid) {
      document.querySelector('[name="gclid"]').value = clickIds.gclid;
    }
  }
});

// Every form submission now carries full attribution context
// Sales sees exactly which campaign generated the lead`,
    lang: 'javascript',
  },
  {
    label: 'Google Tag Manager',
    code: `<!--
  Easiest way: import our ready-made container
  → https://github.com/plurio/Intake/releases/latest
     (download intake-gtm-container.json, then GTM → Admin → Import Container)

  Or add it manually as a Custom HTML tag with trigger "All Pages":
-->
<script src="https://cdn.jsdelivr.net/npm/@plurio/intake@2/dist/intake.gtm.js"></script>
<script>
  intk.init({
    domain: 'yoursite.com',
    data_layer: true,        // pushes intk_ready to dataLayer
    callback: function(data) {
      // Fill hidden form fields with attribution
      document.querySelector('[name="first_source"]').value = data.first.src;
      document.querySelector('[name="first_medium"]').value = data.first.mdm;
      document.querySelector('[name="first_campaign"]').value = data.first.cmp;
    }
  });
</script>`,
    lang: 'html',
  },
];

export default async function CodeExamples() {
  const tabs = await Promise.all(
    codeSnippets.map(async (snippet) => ({
      label: snippet.label,
      content: await codeToHtml(snippet.code, {
        lang: snippet.lang,
        theme: 'github-light',
      }),
    }))
  );

  return (
    <section id="code-examples" className="py-20 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Setup Examples"
          title="Simple, Powerful API"
          description="Get started in 3 lines of code. From basic setup to advanced multi-touch attribution."
        />
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
            <TabGroup tabs={tabs} />
          </div>
        </div>
      </div>
    </section>
  );
}
