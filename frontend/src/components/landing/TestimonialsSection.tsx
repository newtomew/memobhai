import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'We moved our Finance and HR departments to MemoBhai in one semester. Approval turnaround dropped from five days to under twenty-four hours, with a complete audit trail our auditors appreciated.',
    name: 'Dr. Farhana Rahman',
    role: 'Registrar, Leading Private University',
    image: '/landing/testimonial-1.jpg',
  },
  {
    quote: 'We evaluated three memo systems. MemoBhai was the only one with proper sequential workflows, delegation when managers travel, and PDF exports our board actually accepts.',
    name: 'Karim Hassan',
    role: 'Head of Operations, BRAC Enterprise',
    image: '/landing/testimonial-2.jpg',
  },
  {
    quote: 'The platform admin dashboard lets us oversee twelve partner NGOs from one place. Each org stays isolated, but we can spot bottlenecks and blocked memos instantly.',
    name: 'Nabeel Mohammed',
    role: 'Program Director, MultiFlow Solutions',
    image: '/landing/testimonial-3.jpg',
  },
];

export default function TestimonialsSection() {
  const [idx, setIdx] = useState(0);
  const t = TESTIMONIALS[idx];

  return (
    <section className="py-20 sm:py-28 bg-landing-surface border-y border-landing-border">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">What our customers say</h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button type="button" onClick={() => setIdx((idx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} className="w-10 h-10 rounded-full border border-landing-border flex items-center justify-center text-white hover:bg-white/5" aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => setIdx((idx + 1) % TESTIMONIALS.length)} className="w-10 h-10 rounded-full border border-landing-border flex items-center justify-center text-white hover:bg-white/5" aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-center">
          <div className="relative mx-auto lg:mx-0">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-landing-border bg-landing-card flex items-center justify-center">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" onError={(e) => { (e.target as HTMLImageElement).src = '/memobhai-logo.svg'; }} />
            </div>
            <Quote className="absolute -bottom-2 -right-2 w-12 h-12 text-accent/30 fill-accent/10" />
          </div>
          <div className="relative">
            <blockquote className="text-xl sm:text-2xl text-white/90 leading-relaxed font-medium mb-8">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div>
              <p className="text-white font-bold">{t.name}</p>
              <p className="text-landing-muted text-sm">{t.role}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
