import SectionHeading from '../ui/SectionHeading';
import FeatureCard from '../ui/FeatureCard';
import FadeIn from '../ui/FadeIn';

const features = [
  {
    icon: '\u{1F6E1}',
    title: 'Privacy-First',
    description:
      'Built for Consent Mode v2. Supports 10+ CMPs including OneTrust, Cookiebot, Axeptio, and Didomi. When consent is denied, attribution survives via URL pass-through — no cookies, no lost sources.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Multi-Touch Attribution',
    description:
      '5 attribution models — first touch, last touch, linear, U-shaped, and time decay. Tracks up to 50 touchpoints per visitor.',
  },
  {
    icon: '\u{1F517}',
    title: 'Click ID Tracking',
    description:
      'Automatically captures 11 click IDs: gclid, fbclid, ttclid, msclkid, li_fatid, twclid, and more.',
  },
  {
    icon: '\u{1F4C8}',
    title: 'Analytics IDs',
    description:
      'Collects GA Client ID, Amplitude ID, Mixpanel distinct_id, and custom analytics IDs. Links attribution to your analytics stack.',
  },
  {
    icon: '\u{1F512}',
    title: 'PII Hashing for Identity Resolution',
    description:
      'Visitors fill out a form — Intake hashes their email and phone with SHA-256 right in the browser. Raw PII never leaves the page. Send secure hashes to your ad platform to match anonymous sessions to real leads and offline conversions — without compliance risk.',
  },
  {
    icon: '\u{1F310}',
    title: 'Link Decoration',
    description:
      'Automatically decorates external links with UTM parameters and click IDs. Pass attribution to partner domains.',
  },
  {
    icon: '\u{26A1}',
    title: 'SPA Support',
    description:
      'Built-in History API tracking for single-page applications. Automatically updates attribution on virtual page views.',
  },
  {
    icon: '\u{1F3F7}',
    title: 'GTM Integration',
    description:
      'Pushes events to dataLayer. ES5-compatible GTM build included. Works seamlessly with Google Tag Manager.',
  },
  {
    icon: '\u{1F4E6}',
    title: 'Zero Dependencies',
    description:
      'No external dependencies. ~14 kB gzipped. ESM and GTM builds included. Simple, lightweight, fast.',
  },
  {
    icon: '\u{1F5A5}',
    title: 'Server-Side Ready',
    description:
      'Pair Intake with your own server container and route events through your server instead of Google. Click IDs, consent state, and the full touchpoint chain arrive server-side ready for deduplicated CAPI/Ads API calls.',
  },
  {
    icon: '\u{1F680}',
    title: 'Drop-in Install',
    description:
      '3 lines of code to get started. npm install, import, init. Works with any framework or vanilla JS.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Features"
          title="Everything You Need for Traffic Attribution"
          description="A complete toolkit for understanding where your visitors come from — without compromising their privacy."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 50}>
              <FeatureCard icon={f.icon} title={f.title} description={f.description} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
