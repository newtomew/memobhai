import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProductShowcase from '../components/landing/ProductShowcase';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import ArticlesSection from '../components/landing/ArticlesSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-bg text-white landing-page">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProductShowcase />
        <PricingSection />
        <FAQSection />
        <ArticlesSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
