import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import LiveDemo from '@/components/sections/LiveDemo';
import Features from '@/components/sections/Features';
import CaseStudy from '@/components/sections/CaseStudy';
import Privacy from '@/components/sections/Privacy';
import UseCases from '@/components/sections/UseCases';
import PlurioCTA from '@/components/sections/PlurioCTA';
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
        <Features />
        <CaseStudy />
        <Privacy />
        <UseCases />
        <PlurioCTA />
        <Integrations />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
