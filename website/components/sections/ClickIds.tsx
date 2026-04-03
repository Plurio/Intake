import SectionHeading from '../ui/SectionHeading';
import FadeIn from '../ui/FadeIn';

const platforms = [
  { name: 'Google Ads', param: 'gclid', color: 'bg-blue-50 text-blue-700' },
  { name: 'Google Ads (Web-to-App)', param: 'wbraid', color: 'bg-blue-50 text-blue-700' },
  { name: 'Google Ads (App-to-Web)', param: 'gbraid', color: 'bg-blue-50 text-blue-700' },
  { name: 'Google DV360', param: 'dclid', color: 'bg-green-50 text-green-700' },
  { name: 'Facebook / Meta', param: 'fbclid', color: 'bg-indigo-50 text-indigo-700' },
  { name: 'Microsoft Ads', param: 'msclkid', color: 'bg-cyan-50 text-cyan-700' },
  { name: 'TikTok Ads', param: 'ttclid', color: 'bg-pink-50 text-pink-700' },
  { name: 'LinkedIn Ads', param: 'li_fatid', color: 'bg-sky-50 text-sky-700' },
  { name: 'Twitter / X Ads', param: 'twclid', color: 'bg-slate-50 text-slate-700' },
  { name: 'Snapchat Ads', param: 'snapclid', color: 'bg-yellow-50 text-yellow-700' },
  { name: 'Pinterest Ads', param: 'pclid', color: 'bg-red-50 text-red-700' },
];

export default function ClickIds() {
  return (
    <section id="click-ids" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Click IDs"
          title="11 Ad Platforms Tracked"
          description="Automatically captures click identifiers from all major advertising platforms."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {platforms.map((p, i) => (
            <FadeIn key={p.param} delay={i * 30}>
              <div className="rounded-xl border border-surface-100 bg-white p-4 shadow-card hover:shadow-card-hover transition-shadow">
                <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mb-2 ${p.color}`}>
                  {p.name}
                </div>
                <div className="font-mono text-sm text-surface-800">{p.param}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
