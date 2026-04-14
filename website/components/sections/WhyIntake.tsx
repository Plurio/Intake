import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';

const comparisons = [
  {
    problem: 'UTM parameters are parsed inconsistently across pages',
    consequence: 'You can\'t trust source/medium data — reports conflict, decisions are based on guesswork',
  },
  {
    problem: 'Click IDs from ad platforms are silently dropped',
    consequence: 'You lose the link between ad clicks and conversions — ad platform optimization suffers',
  },
  {
    problem: 'Cookies get blocked, attribution data disappears',
    consequence: 'You have zero visibility into privacy-conscious visitors — a growing share of traffic',
  },
  {
    problem: 'Each CMP requires a separate consent integration',
    consequence: 'Consent handling is fragile — one platform change breaks tracking across the site',
  },
  {
    problem: 'Raw PII leaks into analytics, dataLayer, and ad platforms',
    consequence: 'You\'re one audit away from a compliance issue with GDPR or ad platform policies',
  },
  {
    problem: 'Multiple scripts compete for the same attribution data',
    consequence: 'Race conditions, conflicts, and unmaintainable code that breaks with every update',
  },
];

export default function WhyIntake() {
  return (
    <section id="why" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Why Intake"
          title="What Happens Without Proper Attribution?"
          description="Most teams stitch together scripts, miss critical data, and make decisions based on incomplete information."
        />

        <FadeIn>
          <div className="mx-auto max-w-4xl rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="px-5 py-3 border-b border-r border-surface-100 bg-surface-50">
                <h3 className="text-sm font-semibold text-surface-500">The Problem</h3>
              </div>
              <div className="px-5 py-3 border-b border-surface-100 bg-red-50">
                <h3 className="text-sm font-semibold text-red-700">What It Costs You</h3>
              </div>
              {comparisons.map((row, i) => (
                <div key={i} className="contents">
                  <div className={`px-5 py-4 border-r border-surface-100 ${i < comparisons.length - 1 ? 'border-b border-surface-100' : ''}`}>
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-surface-600">{row.problem}</span>
                    </div>
                  </div>
                  <div className={`px-5 py-4 ${i < comparisons.length - 1 ? 'border-b border-surface-100' : ''}`}>
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <span className="text-sm text-surface-600">{row.consequence}</span>
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
