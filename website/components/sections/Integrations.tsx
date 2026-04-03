import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';
import CodeBlock from '../ui/CodeBlock';

const methods = [
  {
    title: 'npm',
    description: 'For modern bundlers and frameworks',
    code: `npm install @plurio/intake`,
    lang: 'bash',
  },
  {
    title: 'Script Tag',
    description: 'Classic browser integration',
    code: `<script src="intake.js"></script>`,
    lang: 'html',
  },
  {
    title: 'GTM',
    description: 'Create a Custom HTML tag in GTM (trigger: All Pages). Paste the contents of intake.gtm.js inline, then add your init code.',
    code: `<!-- GTM → Tags → New → Custom HTML -->
<script>
  // Paste the full contents of intake.gtm.js here
  // (ES5-compatible, works in all browsers)

  intk.init({
    domain: 'yoursite.com',
    data_layer: true  // pushes intk_ready to dataLayer
  });
</script>
<!-- Trigger: All Pages -->`,
    lang: 'html',
  },
];

export default function Integrations() {
  return (
    <section id="integrations" className="py-20 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Integrations"
          title="Install in Seconds"
          description="Choose your preferred installation method. Works with any framework."
        />

        <div className="grid md:grid-cols-3 gap-6">
          {methods.map((m, i) => (
            <FadeIn key={m.title} delay={i * 80}>
              <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden h-full">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-surface-900">{m.title}</h3>
                  <p className="mt-1 text-sm text-surface-500">{m.description}</p>
                </div>
                <CodeBlock code={m.code} lang={m.lang} />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
