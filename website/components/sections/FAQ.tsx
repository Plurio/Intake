import SectionHeading from '../ui/SectionHeading';
import AccordionItem from '../ui/AccordionItem';

const faqs = [
  {
    question: 'How does Intake detect traffic sources?',
    answer:
      'Intake analyzes UTM parameters, document.referrer, and URL click IDs on each page load. It classifies traffic into four types: utm (tagged campaigns), organic (search engines), referral (external sites), and typein (direct). The detection runs during intk.init() and on SPA virtual page views.',
  },
  {
    question: 'What happens when a user denies consent?',
    answer:
      'When consent is denied, Intake sets no cookies and stores no data persistently. If url_passthrough is enabled, attribution data is passed between pages using window.name and automatic link decoration — allowing basic attribution without any cookies.',
  },
  {
    question: 'Does it work with Single Page Applications (SPAs)?',
    answer:
      'Yes. When spa_tracking is enabled (default: true), Intake listens for History API pushState and replaceState calls. It automatically runs attribution detection on virtual page views, updating current source, session data, and touchpoints.',
  },
  {
    question: 'How does multi-touch attribution work?',
    answer:
      'Each significant source change (utm, organic, referral) creates a touchpoint with a timestamp. You can then use intk.getAttribution(model) to distribute credit across the touchpoint chain. Five models are available: first touch, last touch, linear, U-shaped (40/20/40), and time decay (7-day half-life).',
  },
  {
    question: 'Which CMPs are supported out of the box?',
    answer:
      'Intake includes built-in parsers for OneTrust, Cookiebot, Axeptio, Didomi, Sirdata, Termly, TrustArc, Iubenda, Klaro, Quantcast, and Consentmo. It also supports gtag consent commands and generic consent_update events. You can add custom parsers for any CMP.',
  },
  {
    question: 'How is PII handled?',
    answer:
      'When pii_collection is enabled, Intake watches configured form fields (email, phone). Values are normalized (lowercase, trimmed) and hashed with SHA-256 before storage. Raw PII is never written to cookies or dataLayer — only the hash is stored for identity resolution.',
  },
  {
    question: 'Can I use it with Google Tag Manager?',
    answer:
      'Yes. The GTM build (intake.gtm.js) is transpiled to ES5 for compatibility with GTM Custom HTML tags. Intake automatically pushes events to dataLayer (intk_ready, intk_user_profile) so they can be used as GTM triggers and variables.',
  },
  {
    question: 'What is the bundle size?',
    answer:
      'The UMD bundle is approximately 37KB gzipped with zero external dependencies. ESM and GTM builds are also available. The library is designed to be lightweight and suitable for production use without impacting page performance.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="FAQ"
          title="Frequently Asked Questions"
        />
        <div className="mx-auto max-w-3xl">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
