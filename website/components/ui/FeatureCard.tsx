interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative rounded-xl border border-surface-100 bg-white p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-surface-200">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-surface-900">{title}</h3>
      <p className="mt-2 text-sm text-surface-500 leading-relaxed">{description}</p>
    </div>
  );
}
