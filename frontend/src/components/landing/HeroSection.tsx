import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PARTNERS = ['North South University', 'BRAC', 'Grameenphone', 'Square Group', 'Biman Bangladesh', 'UNDP'];

function MemoCard({ className, number, subject, status, rotate }: {
  className?: string;
  number: string;
  subject: string;
  status: string;
  rotate?: string;
}) {
  return (
    <div
      className={`absolute w-[280px] sm:w-[320px] rounded-2xl border border-white/10 bg-gradient-to-br from-landing-card to-landing-surface p-5 shadow-2xl ${className}`}
      style={{ transform: rotate }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#89B9F6" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <span className="text-xs text-landing-muted font-mono">{number}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
          {status}
        </span>
      </div>
      <p className="text-white font-semibold text-sm mb-3 line-clamp-2">{subject}</p>
      <div className="space-y-2">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-gradient-to-r from-accent to-emerald-400 rounded-full" />
        </div>
        <div className="flex justify-between text-[10px] text-landing-muted">
          <span>Step 3 of 4</span>
          <span>Finance Dept.</span>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-[500px] hero-glow pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-landing-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trusted by 50+ organizations across Bangladesh
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Smart Digital Memos for a{' '}
            <span className="bg-gradient-to-r from-accent via-emerald-300 to-accent bg-clip-text text-transparent">
              Brighter Workplace
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-landing-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            Replace paper trails and email chaos with structured inter-office memos, sequential approvals,
            audit trails, and real-time visibility. Built for universities, corporates, and NGOs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-accent text-charcoal font-semibold px-8 py-3.5 rounded-full hover:bg-accent-dark hover:text-white transition-all shadow-lg shadow-accent/20"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 transition-all"
            >
              Log In
            </Link>
          </div>
        </div>

        <div className="relative h-[320px] sm:h-[380px] max-w-3xl mx-auto">
          <MemoCard
            number="MEMO-2026-0041"
            subject="Budget Reallocation Request, Q3 Operations"
            status="Approved"
            className="left-1/2 -translate-x-1/2 top-0 z-30"
            rotate="perspective(800px) rotateX(8deg) rotateY(-6deg)"
          />
          <MemoCard
            number="MEMO-2026-0038"
            subject="Staff Leave Policy Update, Academic Year 2026"
            status="Pending"
            className="left-[5%] sm:left-[10%] top-16 z-20 opacity-70 scale-90"
            rotate="perspective(800px) rotateX(12deg) rotateY(12deg)"
          />
          <MemoCard
            number="MEMO-2026-0035"
            subject="Procurement Approval, IT Equipment"
            status="In Review"
            className="right-[5%] sm:right-[10%] top-20 z-20 opacity-70 scale-90"
            rotate="perspective(800px) rotateX(12deg) rotateY(-14deg)"
          />
        </div>

        <div className="mt-16 sm:mt-24 border-t border-white/5 pt-10">
          <p className="text-center text-xs text-landing-muted uppercase tracking-widest mb-6">
            Organizations that trust MemoBhai
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {PARTNERS.map((name) => (
              <span key={name} className="text-sm sm:text-base font-semibold text-white/20 hover:text-white/40 transition-colors">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
