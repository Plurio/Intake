import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';

const levels = [
  {
    level: '1',
    title: 'Know Your Traffic Sources',
    description: 'Install Intake, see where visitors come from. UTM parameters, referrers, organic vs paid — all captured automatically and available in cookies or dataLayer.',
    what: 'Intake on your site',
    result: 'You know which channels bring traffic',
    color: 'border-surface-300 bg-surface-50',
    levelColor: 'bg-surface-200 text-surface-700',
  },
  {
    level: '2',
    title: 'Enrich Leads with Attribution',
    description: 'Pass first-touch source, click IDs, and campaign data into your CRM via hidden form fields or API calls. Every lead arrives with full marketing context.',
    what: 'Intake + CRM integration (hidden fields, webhooks)',
    result: 'Sales sees which campaign generated each lead',
    color: 'border-brand-200 bg-brand-50',
    levelColor: 'bg-brand-100 text-brand-700',
  },
  {
    level: '3',
    title: 'From Data to Decisions: Run the Full Optimization Loop',
    description: 'Connect Intake to Plurio to run the full loop: attribution, analysis, and campaign optimization, grounded in your business context (goals, seasonality, KPI thresholds). Ask questions in plain English, get answers from your data. Automate weekly reviews, budget shifts, and rules that optimize on LTV and revenue.',
    what: 'Intake on your site + Plurio (or your own data warehouse + optimization layer)',
    result: ['One source of truth: ad and CRM data with full-funnel attribution', 'Chat-based insights and code-backed rules that run on your data', 'Campaign optimization that compounds without scaling analyst hours'],
    color: 'border-brand-400 bg-gradient-to-br from-brand-50 to-white',
    levelColor: 'bg-brand-600 text-white',
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-20 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Key Use Case"
          title="Data Collection for End-to-End Analytics"
          description="Intake is the data collection layer. How far you take the analytics depends on your needs. Start simple, grow when ready."
        />
        <div className="mx-auto max-w-3xl space-y-6">
          {levels.map((lvl, i) => (
            <FadeIn key={lvl.level} delay={i * 80}>
              <div className={`rounded-xl border-2 ${lvl.color} p-6 sm:p-8 relative`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full ${lvl.levelColor} flex items-center justify-center font-bold text-sm`}>
                    {lvl.level}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-surface-900">{lvl.title}</h3>
                    <p className="mt-2 text-sm text-surface-600 leading-relaxed">{lvl.description}</p>
                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/80 border border-surface-200 p-3">
                        <div className="text-xs font-medium text-surface-400 uppercase tracking-wide mb-1">What you need</div>
                        <div className="text-sm text-surface-700">{lvl.what}</div>
                      </div>
                      <div className="rounded-lg bg-white/80 border border-surface-200 p-3">
                        <div className="text-xs font-medium text-surface-400 uppercase tracking-wide mb-1">What you get</div>
                        <div className="text-sm text-surface-700">
                          {Array.isArray(lvl.result) ? (
                            <ul className="space-y-1">
                              {lvl.result.map((item, j) => (
                                <li key={j}>{item}</li>
                              ))}
                            </ul>
                          ) : lvl.result}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
