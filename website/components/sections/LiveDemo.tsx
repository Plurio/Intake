'use client';

import DataCard from '../ui/DataCard';
import { useIntakeData } from '../../hooks/useIntakeData';
import type { IntkSource, IntkExtra } from '../../hooks/useIntakeData';

function sourceRows(label: string, src: IntkSource, extra: IntkExtra) {
  return [
    { label: 'Traffic Type', value: src.typ || '(none)' },
    { label: 'Source', value: src.src || '(none)' },
    { label: 'Medium', value: src.mdm || '(none)' },
    { label: 'Campaign', value: src.cmp || '(none)' },
    { label: 'Content', value: src.cnt || '(none)' },
    { label: 'Term', value: src.trm || '(none)' },
    { label: 'Date', value: extra.fd || '(none)' },
    { label: 'Entrance Page', value: extra.ep || '(none)' },
    { label: 'Referrer', value: extra.rf || '(none)' },
  ];
}

function SkeletonCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl bg-white shadow-card border border-surface-100 overflow-hidden">
      <div className="border-b border-surface-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 bg-surface-100 rounded animate-pulse" />
            <div className="h-3 w-32 bg-surface-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMO_LINKS = [
  {
    label: 'Google Ads',
    description: 'Paid search click with gclid',
    query:
      '?utm_source=google&utm_medium=cpc&utm_campaign=intake_demo&utm_content=hero&gclid=demo_gclid_123',
    accent: 'bg-brand-50 text-brand-700 ring-brand-200 hover:bg-brand-100',
  },
  {
    label: 'Facebook Ads',
    description: 'Paid social click with fbclid',
    query:
      '?utm_source=facebook&utm_medium=cpc&utm_campaign=intake_demo&utm_content=hero&fbclid=demo_fbclid_456',
    accent: 'bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100',
  },
  {
    label: 'Google organic',
    description: 'Unpaid search result click',
    query: '?utm_source=google&utm_medium=organic&utm_campaign=intake_demo',
    accent:
      'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  },
  {
    label: 'Product Hunt referral',
    description: 'Referral traffic from an external site',
    query: '?utm_source=producthunt&utm_medium=referral&utm_campaign=launch',
    accent:
      'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100',
  },
];

export default function LiveDemo() {
  const data = useIntakeData();

  const makeUrl = (query: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${query}`
      : `/${query}`;

  return (
    <section id="live-demo" className="py-20 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
            Live Demo
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl text-center">
          See It In Action
        </h2>
        <p className="mt-4 text-lg text-surface-500 text-center max-w-2xl mx-auto">
          Intake is running on this page right now. Below is your real attribution data.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {data ? (
            <>
              <DataCard title="First Visit" rows={sourceRows('First', data.first, data.first_add)} />
              <DataCard title="Current Visit" rows={sourceRows('Current', data.current, data.current_add)} />
            </>
          ) : (
            <>
              <SkeletonCard title="First Visit" />
              <SkeletonCard title="Current Visit" />
            </>
          )}
        </div>

        {/* Session & User Data */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {data ? (
            <>
              <DataCard
                title="Session Data"
                rows={[
                  { label: 'Pages Seen', value: String(data.session?.pgs || '—') },
                  { label: 'Current Page', value: data.session?.cpg || '—' },
                ]}
              />
              <DataCard
                title="User Data"
                rows={[
                  { label: 'Total Visits', value: String(data.udata?.vst || '—') },
                  {
                    label: 'User Agent',
                    value:
                      data.udata?.uag
                        ? data.udata.uag.length > 60
                          ? data.udata.uag.slice(0, 60) + '...'
                          : data.udata.uag
                        : '—',
                  },
                ]}
              />
            </>
          ) : (
            <>
              <SkeletonCard title="Session Data" />
              <SkeletonCard title="User Data" />
            </>
          )}
        </div>

        {/* Click IDs (if present) */}
        {data?.click_ids && Object.keys(data.click_ids).length > 0 && (
          <div className="mt-6">
            <DataCard
              title="Detected Click IDs"
              rows={Object.entries(data.click_ids)
                .filter(([, v]) => v && v !== '(none)')
                .map(([k, v]) => ({ label: k, value: v }))}
            />
          </div>
        )}

        {/* Touchpoints (if present) */}
        {data?.touchpoints &&
          data.touchpoints.touchpoints &&
          data.touchpoints.touchpoints.length > 0 && (
            <div className="mt-6">
              <DataCard
                title="Touchpoints"
                rows={data.touchpoints.touchpoints.map((tp, i) => ({
                  label: `#${i + 1} — ${tp.typ}`,
                  value: `${tp.src} / ${tp.mdm}`,
                }))}
              />
              <p className="mt-2 text-xs text-surface-400">
                Direct traffic is excluded — only significant sources (utm, organic, referral) create touchpoints.
              </p>
            </div>
          )}

        {/* Demo source links — click in sequence to build a multi-touch chain */}
        <div className="mt-8 mx-auto max-w-3xl rounded-xl border border-surface-200 bg-white p-5 sm:p-6 shadow-card">
          <p className="text-sm font-medium text-surface-900">
            Simulate a multi-touch journey
          </p>
          <p className="mt-1 text-sm text-surface-500">
            Click the links below in sequence and watch the touchpoint chain
            build up. Direct traffic is excluded from attribution.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {DEMO_LINKS.map((link) => (
              <a
                key={link.label}
                href={makeUrl(link.query)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors ${link.accent}`}
                title={link.description}
              >
                {link.label}
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
