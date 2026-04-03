import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';

const highlights = [
  'Works with or without cookies — attribution survives consent denial via URL passthrough',
  'Built-in Consent Mode v2 — respects analytics_storage and ad_storage signals',
  'SHA-256 hashing for emails and phones — raw PII never leaves the browser',
  'Programmatic consent withdrawal via intk.withdrawConsent()',
  'No third-party requests, no external servers — everything runs client-side',
];

const cmps = [
  'OneTrust',
  'Cookiebot',
  'Axeptio',
  'Didomi',
  'Sirdata',
  'Termly',
  'TrustArc',
  'Iubenda',
  'Klaro',
  'Quantcast',
  'Consentmo',
];

export default function Privacy() {
  return (
    <section id="privacy" className="py-20 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Privacy"
          title="Privacy-First by Design"
          description="Intake adapts to consent status automatically. Full tracking when consent is granted, cookieless attribution when it's denied."
        />

        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="rounded-xl border border-surface-200 bg-white p-6 sm:p-8 shadow-card">
              <ul className="space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-surface-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-surface-100">
                <h3 className="text-sm font-semibold text-surface-900 mb-3">
                  Compatible with 10+ Consent Management Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cmps.map((cmp) => (
                    <span
                      key={cmp}
                      className="inline-flex items-center rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600"
                    >
                      {cmp}
                    </span>
                  ))}
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
                    + custom parsers
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
