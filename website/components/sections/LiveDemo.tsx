'use client';

import { useEffect, useState } from 'react';
import DataCard from '../ui/DataCard';

interface IntkSource {
  typ: string;
  src: string;
  mdm: string;
  cmp: string;
  cnt: string;
  trm: string;
}

interface IntkExtra {
  fd: string;
  ep: string;
  rf: string;
}

interface IntkSession {
  pgs: number | string;
  cpg: string;
}

interface IntkUdata {
  vst: number | string;
  uag: string;
  uip?: string;
}

interface IntkTouchpoint {
  typ: string;
  src: string;
  mdm: string;
  cmp: string;
  ts: number;
}

interface IntkData {
  current: IntkSource;
  current_add: IntkExtra;
  first: IntkSource;
  first_add: IntkExtra;
  session: IntkSession;
  udata: IntkUdata;
  touchpoints?: { touchpoints: IntkTouchpoint[] };
  click_ids?: Record<string, string>;
}

declare global {
  interface Window {
    intk: {
      init: (config?: any) => void;
      get: IntkData;
    };
  }
}

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

export default function LiveDemo() {
  const [data, setData] = useState<IntkData | null>(null);

  useEffect(() => {
    function tryInit() {
      if (typeof window !== 'undefined' && window.intk) {
        window.intk.init({
          domain: window.location.hostname,
          callback: function () {
            setData({ ...window.intk.get });
          },
        });
        // Also read synchronously in case callback already fired
        if (window.intk.get?.current) {
          setData({ ...window.intk.get });
        }
      } else {
        // Retry if script hasn't loaded yet
        setTimeout(tryInit, 200);
      }
    }
    tryInit();
  }, []);

  const demoUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?utm_source=test&utm_medium=demo&utm_campaign=intake_demo`
      : '/?utm_source=test&utm_medium=demo&utm_campaign=intake_demo';

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

        <div className="mt-4 text-center">
          <p className="text-sm text-surface-400">
            Try visiting with UTM parameters:{' '}
            <a
              href={demoUrl}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = demoUrl;
              }}
              className="text-brand-600 hover:underline font-mono text-xs break-all"
            >
              ?utm_source=test&utm_medium=demo
            </a>
          </p>
        </div>

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
            </div>
          )}
      </div>
    </section>
  );
}
