import Button from '../ui/Button';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Start Tracking Sources in 3 Lines of Code
        </h2>
        <p className="mt-4 text-lg text-brand-100 max-w-xl mx-auto">
          Install Intake, call init, and access your attribution data. It&apos;s that simple.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            href="#getting-started"
            size="lg"
            className="!bg-white !text-brand-700 hover:!bg-brand-50 !border-white hover:!border-brand-100"
          >
            Install Now
          </Button>
          <Button
            href="https://github.com/plurio/Intake#readme"
            variant="secondary"
            size="lg"
            className="!bg-white !text-brand-700 hover:!bg-brand-50 !border-white hover:!border-brand-100"
          >
            Read the Docs
          </Button>
          <Button
            href="https://github.com/plurio/Intake"
            variant="ghost"
            size="lg"
            className="!text-white hover:!bg-white/10"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Star on GitHub
          </Button>
        </div>

        <div className="mt-6">
          <a
            href="/intake-quick-start.html"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white underline-offset-2 hover:underline transition-colors"
          >
            Get quick start guide
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
