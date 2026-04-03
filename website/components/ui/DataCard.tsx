interface DataRow {
  label: string;
  value: string;
}

interface DataCardProps {
  title: string;
  rows: DataRow[];
  className?: string;
}

const trafficTypeBadge: Record<string, string> = {
  utm: 'bg-brand-50 text-brand-700',
  organic: 'bg-emerald-50 text-emerald-700',
  referral: 'bg-amber-50 text-amber-700',
  typein: 'bg-sky-50 text-sky-700',
};

export default function DataCard({ title, rows, className = '' }: DataCardProps) {
  return (
    <div className={`rounded-xl bg-white shadow-card border border-surface-100 overflow-hidden ${className}`}>
      <div className="border-b border-surface-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
      </div>
      <div className="divide-y divide-surface-50">
        {rows.map((row) => {
          const isNone = row.value === '(none)' || row.value === '';
          const isTrafficType = row.label === 'Traffic Type' && trafficTypeBadge[row.value];
          return (
            <div key={row.label} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-xs text-surface-500">{row.label}</span>
              {isTrafficType ? (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trafficTypeBadge[row.value]}`}>
                  {row.value}
                </span>
              ) : (
                <span
                  className={`text-xs font-mono ${
                    isNone ? 'text-surface-300' : 'text-surface-800'
                  }`}
                >
                  {row.value || '—'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
