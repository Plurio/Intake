import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';

const comparisons = [
  {
    alternative: 'Manual UTM parsing with custom scripts',
    intake: 'Automatic UTM extraction, normalization, and storage — no custom code needed',
  },
  {
    alternative: 'Tracking only the landing page referrer',
    intake: 'Full session history: first visit, current visit, referrer chain, and entrance pages',
  },
  {
    alternative: 'Losing click IDs because nobody wrote the code to capture them',
    intake: '11 click IDs (gclid, fbclid, ttclid, msclkid, etc.) captured automatically on every visit',
  },
  {
    alternative: 'No data collection when cookies are blocked',
    intake: 'Cookieless mode with URL passthrough — attribution survives even without consent',
  },
  {
    alternative: 'Stitching together 3-4 scripts and tag manager hacks',
    intake: 'One library, zero dependencies, ~37KB — installs in 3 lines of code',
  },
  {
    alternative: 'Raw PII in hidden form fields and spreadsheets',
    intake: 'SHA-256 hashing in the browser — only secure hashes leave the page',
  },
];

export default function WhyIntake() {
  return (
    <section id="why" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Why Intake"
          title="What Are You Comparing Against?"
          description="Most teams collect traffic source data with a patchwork of scripts, manual UTM parsing, and tag manager workarounds. Intake replaces all of that with a single library."
        />

        <FadeIn>
          <div className="mx-auto max-w-4xl rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="px-5 py-3 border-b border-r border-surface-100 bg-surface-50">
                <h3 className="text-sm font-semibold text-surface-500">Without Intake</h3>
              </div>
              <div className="px-5 py-3 border-b border-surface-100 bg-brand-50">
                <h3 className="text-sm font-semibold text-brand-700">With Intake</h3>
              </div>
              {comparisons.map((row, i) => (
                <div key={i} className="contents">
                  <div className={`px-5 py-4 border-r border-surface-100 ${i < comparisons.length - 1 ? 'border-b border-surface-100' : ''}`}>
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-surface-600">{row.alternative}</span>
                    </div>
                  </div>
                  <div className={`px-5 py-4 ${i < comparisons.length - 1 ? 'border-b border-surface-100' : ''}`}>
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-surface-700 font-medium">{row.intake}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
