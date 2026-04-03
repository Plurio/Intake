import SectionHeading from '../ui/SectionHeading';
import AttributionDiagram from '../ui/AttributionDiagram';
import FadeIn from '../ui/FadeIn';

export default function Attribution() {
  return (
    <section id="attribution" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Attribution"
          title="5 Attribution Models Built In"
          description="Understand the full customer journey. Switch between models to see how credit is distributed across touchpoints."
        />
        <FadeIn>
          <div className="mx-auto max-w-3xl rounded-xl border border-surface-200 bg-white p-6 sm:p-8 shadow-card">
            <AttributionDiagram />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
