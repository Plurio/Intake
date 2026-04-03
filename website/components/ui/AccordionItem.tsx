'use client';

import { useState } from 'react';

interface AccordionItemProps {
  question: string;
  answer: string;
}

export default function AccordionItem({ question, answer }: AccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-surface-100">
      <button
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base font-medium text-surface-900">{question}</span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-surface-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-1fr' : 'grid-rows-0fr'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm text-surface-500 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
