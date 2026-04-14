import FadeIn from '../ui/FadeIn';
import Button from '../ui/Button';

const capabilities = [
  {
    title: 'Chat — Ask Questions, Get Answers',
    description: 'Ask performance questions in plain English. Plurio runs them against your data (including Intake attribution) and returns answers in minutes — the analysis that used to take days, without dependency on analysts or dashboards.',
  },
  {
    title: 'Workflows — Dashboards, Monitored for You',
    description: 'Connect Intake data to Plurio and get weekly reviews, budget optimization, and creative audits automated. The AI monitors all campaigns and delivers actionable insights on schedule — same logic, same quality, every time.',
  },
  {
    title: 'Rules — Automation Grounded in Your Data',
    description: 'Define code-based rules of any complexity that optimize on LTV and full-funnel revenue, not platform vanity metrics. Plurio runs them on your Intake-enriched data; you approve before anything executes — transparent reasoning, predictable outcomes.',
  },
  {
    title: 'Data Foundation — One Source of Truth',
    description: 'Unify ad platforms, CRM, and backend (including Intake touchpoints and click IDs) into one connected dataset with revenue-level attribution. The base every chat answer, workflow, and rule runs on — clean data, no stitching.',
  },
];

export default function PlurioCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="rounded-2xl bg-gradient-to-br from-surface-900 to-surface-800 p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <img src="/logo/plurio-icon.svg" alt="Plurio" className="h-8 w-8 rounded-lg" />
                  <img src="/logo/plurio-logo.svg" alt="Plurio" className="h-5" />
                  <span className="inline-flex items-center rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-medium text-brand-300 ring-1 ring-inset ring-brand-500/30">
                    AI Agent for Performance Marketing
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Intake Collects the Data.{' '}
                  <span className="text-brand-400">Plurio Turns It Into Revenue Decisions and Automation.</span>
                </h2>
                <p className="mt-4 text-base text-surface-300 leading-relaxed">
                  Plurio is the AI layer for performance marketing: it turns your ad and CRM data (including everything Intake captures) into a single source of truth, lets you query it in plain English, and runs optimization and workflows for you, so the same team can do more, faster, on revenue-based decisions.
                </p>
                <div className="mt-6">
                  <Button
                    href="https://www.plurio.ai/"
                    variant="secondary"
                    size="lg"
                    className="!bg-white !text-surface-900 hover:!bg-surface-100"
                  >
                    Explore Plurio
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {capabilities.map((cap) => (
                  <div
                    key={cap.title}
                    className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur"
                  >
                    <h3 className="text-sm font-semibold text-white mb-1">{cap.title}</h3>
                    <p className="text-sm text-surface-400">{cap.description}</p>
                  </div>
                ))}
                <p className="text-sm text-surface-500 italic mt-2">
                  Chat-based insights. Code-backed rules. Account-level execution.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
