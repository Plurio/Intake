import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';

const metrics = [
  {
    label: 'Setup Time',
    manual: '2\u20134\u00A0weeks of dev work',
    intake: '15\u00A0minutes',
  },
  {
    label: 'Code to Write',
    manual: '500\u20131,000+ lines across scripts',
    intake: '3 lines',
  },
  {
    label: 'Click ID Support',
    manual: 'Custom parser per platform',
    intake: '11 platforms, automatic',
  },
  {
    label: 'CRM Integration',
    manual: 'Build & maintain data pipeline',
    intake: 'Callbacks + hidden fields',
  },
  {
    label: 'Consent Handling',
    manual: 'Research + implement per CMP',
    intake: 'Built-in, 10+ CMPs',
  },
  {
    label: 'PII Compliance',
    manual: 'Manual hashing implementation',
    intake: 'SHA-256 in browser, automatic',
  },
  {
    label: 'Maintenance',
    manual: 'Fix when platforms change APIs',
    intake: 'Zero \u2014 library handles updates',
  },
];

export default function CaseStudy() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Comparison"
          title={'Weeks of Development \u2014 or 15\u00A0Minutes?'}
          description="The real cost of building attribution tracking in-house. Compare the effort."
        />

        <FadeIn>
          <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-6">
            {/* Manual Setup Card */}
            <div className="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-200">
                <h3 className="text-lg font-semibold text-surface-700">Manual Setup</h3>
                <p className="text-sm text-surface-400 mt-0.5">Custom scripts & tag manager hacks</p>
              </div>
              <div className="divide-y divide-surface-200">
                {metrics.map((m) => (
                  <div key={m.label} className="px-6 py-3.5">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <div>
                        <div className="text-xs text-surface-400 font-medium uppercase tracking-wide">{m.label}</div>
                        <div className="text-sm text-surface-600 mt-0.5">{m.manual}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* With Intake Card */}
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-200">
                <h3 className="text-lg font-semibold text-brand-700">With Intake</h3>
                <p className="text-sm text-brand-500 mt-0.5">One library, zero dependencies</p>
              </div>
              <div className="divide-y divide-brand-100">
                {metrics.map((m) => (
                  <div key={m.label} className="px-6 py-3.5">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <div>
                        <div className="text-xs text-brand-500 font-medium uppercase tracking-wide">{m.label}</div>
                        <div className="text-sm text-surface-800 font-medium mt-0.5">{m.intake}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
