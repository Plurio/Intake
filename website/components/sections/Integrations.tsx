import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';
import CodeBlock from '../ui/CodeBlock';

const methods = [
  {
    title: 'CDN (jsDelivr)',
    description: 'One line, no build tools needed. Works everywhere.',
    code: `<script src="https://cdn.jsdelivr.net/npm/@plurio/intake@2/dist/intake.js"></script>`,
    lang: 'html',
  },
  {
    title: 'Script Tag',
    description: 'Download and self-host the file',
    code: `<script src="intake.js"></script>`,
    lang: 'html',
  },
  {
    title: 'npm / ESM',
    description: 'For modern bundlers and frameworks',
    code: `npm install @plurio/intake`,
    lang: 'bash',
  },
  {
    title: 'Google Tag Manager',
    description:
      'Import our ready-made JSON container, or paste this snippet into a Custom HTML tag with an All Pages trigger.',
    code: `<!-- GTM → Tags → New → Custom HTML (trigger: All Pages) -->
<script src="https://cdn.jsdelivr.net/npm/@plurio/intake@2/dist/intake.gtm.js"></script>
<script>
  intk.init({
    domain: 'yoursite.com',
    data_layer: true
  });
</script>`,
    lang: 'html',
  },
];

export default function Integrations() {
  return (
    <section id="getting-started" className="py-20 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Installation"
          title="Install in Seconds"
          description="Choose your preferred method. Works with any framework or plain HTML."
        />

        <div className="grid sm:grid-cols-2 gap-6 min-w-0">
          {methods.map((m, i) => (
            <FadeIn key={m.title} delay={i * 80}>
              <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden h-full min-w-0">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-surface-900">{m.title}</h3>
                  <p className="mt-1 text-sm text-surface-500">{m.description}</p>
                </div>
                <CodeBlock code={m.code} lang={m.lang} />
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <a
            href="https://github.com/plurio/Intake"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
          <a
            href="https://github.com/plurio/Intake#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Documentation
          </a>
        </div>
      </div>
    </section>
  );
}
