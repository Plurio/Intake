'use client';

import { useState } from 'react';
import Button from '../ui/Button';

export default function CTA() {
  const [copied, setCopied] = useState(false);
  const command = 'npm install @plurio/intake';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <section id="getting-started" className="py-20 bg-gradient-to-r from-brand-600 to-brand-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Start Tracking Sources in 3 Lines of Code
        </h2>
        <p className="mt-4 text-lg text-brand-100 max-w-xl mx-auto">
          Install Intake, call init, and access your attribution data. It&apos;s that simple.
        </p>

        <div className="mt-8 inline-flex items-center rounded-lg bg-white/10 backdrop-blur border border-white/20 px-4 py-3 gap-4">
          <code className="text-white font-mono text-sm">{command}</code>
          <button
            onClick={handleCopy}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            href="https://github.com/elly-analytics/Intake#readme"
            variant="secondary"
            size="lg"
            className="!bg-white !text-brand-700 hover:!bg-brand-50 !border-white hover:!border-brand-100"
          >
            Read the Docs
          </Button>
          <Button
            href="https://github.com/elly-analytics/Intake"
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
      </div>
    </section>
  );
}
