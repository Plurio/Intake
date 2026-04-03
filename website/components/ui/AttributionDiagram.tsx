'use client';

import { useState } from 'react';

type Model = 'first' | 'last' | 'linear' | 'u-shaped' | 'time-decay';

const touchpoints = [
  { src: 'Google Ads', mdm: 'cpc', typ: 'utm' },
  { src: 'facebook.com', mdm: 'referral', typ: 'referral' },
  { src: 'google', mdm: 'organic', typ: 'organic' },
  { src: 'Newsletter', mdm: 'email', typ: 'utm' },
  { src: 'Google Ads', mdm: 'cpc', typ: 'utm' },
];

const models: { id: Model; label: string }[] = [
  { id: 'first', label: 'First Touch' },
  { id: 'last', label: 'Last Touch' },
  { id: 'linear', label: 'Linear' },
  { id: 'u-shaped', label: 'U-Shaped' },
  { id: 'time-decay', label: 'Time Decay' },
];

function getCredits(model: Model): number[] {
  const n = touchpoints.length;
  switch (model) {
    case 'first':
      return [1, 0, 0, 0, 0];
    case 'last':
      return [0, 0, 0, 0, 1];
    case 'linear':
      return Array(n).fill(1 / n);
    case 'u-shaped':
      return [0.4, 0.067, 0.067, 0.067, 0.4];
    case 'time-decay':
      return [0.06, 0.1, 0.16, 0.26, 0.42];
  }
}

const colors = [
  'bg-brand-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-brand-600',
];

export default function AttributionDiagram() {
  const [active, setActive] = useState<Model>('u-shaped');
  const credits = getCredits(active);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              active === m.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative mb-8">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-surface-200" />
        <div className="relative flex justify-between">
          {touchpoints.map((tp, i) => (
            <div key={i} className="flex flex-col items-center z-10">
              <div className={`h-8 w-8 rounded-full ${colors[i]} flex items-center justify-center text-white text-xs font-bold`}>
                {i + 1}
              </div>
              <span className="mt-2 text-xs font-medium text-surface-700 text-center max-w-[80px]">
                {tp.src}
              </span>
              <span className="text-[10px] text-surface-400">{tp.mdm}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Credit bars */}
      <div className="space-y-3">
        {touchpoints.map((tp, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-24 text-xs text-surface-600 text-right truncate">
              {tp.src}
            </span>
            <div className="flex-1 h-8 bg-surface-100 rounded-lg overflow-hidden relative">
              <div
                className={`h-full ${colors[i]} rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(credits[i] * 100, credits[i] > 0 ? 3 : 0)}%` }}
              >
                {credits[i] > 0.05 && (
                  <span className="text-xs font-mono text-white font-medium">
                    {Math.round(credits[i] * 100)}%
                  </span>
                )}
              </div>
              {credits[i] > 0 && credits[i] <= 0.05 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-surface-500">
                  {Math.round(credits[i] * 100)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
