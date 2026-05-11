'use client';

import { useEffect, useState } from 'react';
import { useIntakeData } from '../../hooks/useIntakeData';

function getBadge(typ: string, src: string, mdm: string) {
  switch (typ) {
    case 'utm':
      return {
        text: `${src} / ${mdm}`,
        bg: 'bg-brand-100',
        color: 'text-brand-700',
      };
    case 'organic':
      return {
        text: `organic / ${src}`,
        bg: 'bg-emerald-100',
        color: 'text-emerald-700',
      };
    case 'referral':
      return {
        text: `referral / ${src}`,
        bg: 'bg-amber-100',
        color: 'text-amber-700',
      };
    default:
      return {
        text: 'direct visit',
        bg: 'bg-sky-100',
        color: 'text-sky-700',
      };
  }
}

function getCapturedClickIds(clickIds?: Record<string, string>): string[] {
  if (!clickIds) return [];
  return Object.entries(clickIds)
    .filter(([, value]) => value && value !== '(none)')
    .map(([key]) => key);
}

export default function HeroLive() {
  const data = useIntakeData();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => setShowDetails(true), 300);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const badge = data
    ? getBadge(data.current.typ, data.current.src, data.current.mdm)
    : null;

  const clickIds = data ? getCapturedClickIds(data.click_ids) : [];

  const rows = data
    ? [
        { label: 'Source', value: data.current.src || '(direct)' },
        { label: 'Medium', value: data.current.mdm || '(none)' },
        { label: 'Visit #', value: String(data.udata?.vst || 1) },
        { label: 'Pages', value: String(data.session?.pgs || 1) },
      ]
    : [];

  return (
    <div id="hero-live" className="relative rounded-xl border border-surface-200 bg-white shadow-card p-6 sm:p-8">
      {/* Live demo badge */}
      <a
        href="#live-demo"
        className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200 no-underline hover:bg-red-100 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </span>
        Live demo
      </a>

      {/* Headline */}
      <p className="text-surface-500 text-lg font-medium">Your source is</p>

      {/* Badge */}
      <div className="mt-3 min-h-[2.5rem]">
        {badge ? (
          <span
            className={`inline-block rounded-lg px-4 py-2 text-xl sm:text-2xl font-bold font-mono transition-all duration-300 ${badge.bg} ${badge.color}`}
          >
            {badge.text}
          </span>
        ) : (
          <div className="inline-block h-10 w-48 rounded-lg bg-surface-100 animate-pulse" />
        )}
      </div>

      {/* Details — animated slide-in */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          showDetails ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div className="border-t border-surface-100 pt-4 space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-surface-500">{row.label}</span>
              <span className="text-sm font-mono text-surface-800">
                {row.value}
              </span>
            </div>
          ))}
          {clickIds.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm text-surface-500 pt-0.5">
                {clickIds.length === 1 ? 'Click ID' : 'Click IDs'}
              </span>
              <span className="flex flex-wrap justify-end gap-1.5">
                {clickIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-mono font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  >
                    {id}
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ))}
              </span>
            </div>
          )}
          <a
            href="#live-demo"
            className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            See full data
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
