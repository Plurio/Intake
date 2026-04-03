'use client';

import { useState } from 'react';

interface Tab {
  label: string;
  content: string; // pre-rendered HTML from Shiki
}

interface TabGroupProps {
  tabs: Tab[];
}

export default function TabGroup({ tabs }: TabGroupProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === i
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="mt-0 overflow-x-auto rounded-b-lg bg-[#fafafa] [&_pre]:!bg-[#fafafa] [&_pre]:p-4 [&_pre]:text-sm [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: tabs[active].content }}
      />
    </div>
  );
}
