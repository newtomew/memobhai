import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-landing-bg relative overflow-hidden">
      <div className="absolute inset-0 hero-glow opacity-60 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
          Get started with digital memos today
        </h2>
        <p className="text-landing-muted text-lg mb-10 max-w-xl mx-auto">
          Join organizations across Bangladesh who have replaced paper trails with MemoBhai.
          Free to start. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="inline-flex items-center gap-2 bg-accent text-charcoal font-semibold px-8 py-3.5 rounded-full hover:bg-accent-dark hover:text-white transition-all shadow-lg shadow-accent/20">
            Create Organization <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 transition-all">
            Log In to Existing Account
          </Link>
        </div>
      </div>
    </section>
  );
}
