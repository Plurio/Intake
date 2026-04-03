import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import LiveDemo from '@/components/sections/LiveDemo';
import WhyIntake from '@/components/sections/WhyIntake';
import UseCases from '@/components/sections/UseCases';
import PlurioCTA from '@/components/sections/PlurioCTA';
import Features from '@/components/sections/Features';
import CodeExamples from '@/components/sections/CodeExamples';
import Attribution from '@/components/sections/Attribution';
import Privacy from '@/components/sections/Privacy';
import Integrations from '@/components/sections/Integrations';
import Pricing from '@/components/sections/Pricing';
import FAQ from '@/components/sections/FAQ';
import CTA from '@/components/sections/CTA';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LiveDemo />
        <WhyIntake />
        <UseCases />
        <PlurioCTA />
        <Features />
        <CodeExamples />
        <Attribution />
        <Privacy />
        <Integrations />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
