import Badge from '../ui/Badge';
import Button from '../ui/Button';
import CodeBlock from '../ui/CodeBlock';

const heroCode = `import intk from '@plurio/intake';

intk.init({ domain: 'yoursite.com' });

// Access attribution data
console.log(intk.get.current);
// → { typ: 'utm', src: 'google', mdm: 'cpc',
//     cmp: 'spring_sale', cnt: 'banner', trm: 'shoes' }`;

const stats = [
  { value: '11', label: 'Click IDs' },
  { value: '5', label: 'Attribution Models' },
  { value: '10+', label: 'CMPs Supported' },
  { value: '~37KB', label: 'Gzipped' },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-white -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <Badge variant="brand" className="mb-6">v2.0 — Privacy-First</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-surface-900 leading-[1.1]">
              Your First Step to{' '}
              <span className="text-brand-600">Full Funnel Analytics.</span>
            </h1>
            <p className="mt-6 text-xl text-surface-700 max-w-xl leading-relaxed font-medium">
              One lightweight library that captures every touchpoint — from first ad click to closed deal. Privacy-compliant, ready for any analytics stack.
            </p>
            <p className="mt-3 text-base text-surface-500 max-w-xl leading-relaxed">
              Multi-touch attribution, 11 click IDs, Consent Mode v2, PII hashing — all in ~37KB with zero dependencies. Install once, feed dashboards, CRM, and revenue reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#getting-started" size="lg">
                Get Started
              </Button>
              <Button
                href="https://github.com/elly-analytics/Intake"
                variant="secondary"
                size="lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </Button>
            </div>
            {/* Stats */}
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-lg font-bold text-surface-900">{stat.value}</span>
                  <span className="text-sm text-surface-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — code snippet */}
          <div className="relative">
            <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-surface-100 bg-surface-50">
                <div className="h-3 w-3 rounded-full bg-surface-200" />
                <div className="h-3 w-3 rounded-full bg-surface-200" />
                <div className="h-3 w-3 rounded-full bg-surface-200" />
                <span className="ml-3 text-xs text-surface-400 font-mono">app.js</span>
              </div>
              <CodeBlock code={heroCode} lang="javascript" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
