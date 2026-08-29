import { CheckCircle2 } from 'lucide-react';

const BENEFITS = [
  'Create and submit memos in under 2 minutes',
  'Sequential approval with no step skipped',
  'Delegation when approvers are away',
  'Version history on every edit',
  'Platform admin cross-org oversight',
  'Branded PDF export with org logo',
];

const USE_CASES = [
  { src: '/landing/corporate-offices.jpg', alt: 'Modern corporate office', caption: 'Corporate offices' },
  { src: '/landing/university-campus.jpg', alt: 'University campus building', caption: 'Universities and colleges' },
  { src: '/landing/ngo-government.jpg', alt: 'Team collaboration meeting', caption: 'NGOs and government' },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-emerald-500/10 rounded-[3rem] blur-2xl scale-110" />
      <div className="relative rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="h-7 bg-gray-900 flex items-center justify-center">
          <div className="w-20 h-4 bg-black rounded-full" />
        </div>
        <div className="bg-landing-bg px-4 pb-6 min-h-[480px]">
          <div className="flex items-center justify-between mb-4 pt-2">
            <span className="text-white text-sm font-bold">MemoBhai</span>
            <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-[10px] text-accent font-bold">3</div>
          </div>
          <p className="text-[10px] text-landing-muted uppercase tracking-wider mb-2">Inbox, 3 pending</p>
          {[
            { num: 'MEMO-0041', sub: 'Budget Reallocation Q3', pri: 'urgent' },
            { num: 'MEMO-0039', sub: 'Leave Policy Update', pri: 'normal' },
            { num: 'MEMO-0037', sub: 'IT Procurement Request', pri: 'high' },
          ].map((m) => (
            <div key={m.num} className="rounded-xl bg-landing-card border border-landing-border p-3 mb-2">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-mono text-landing-muted">{m.num}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full capitalize ${
                  m.pri === 'urgent' ? 'bg-red-500/20 text-red-400' :
                  m.pri === 'high' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-white/5 text-landing-muted'
                }`}>{m.pri}</span>
              </div>
              <p className="text-xs text-white font-medium line-clamp-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductShowcase() {
  return (
    <section id="about" className="py-20 sm:py-28 bg-landing-surface border-y border-landing-border">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <PhoneMockup />
          <div>
            <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Mobile-Ready</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Ditch the paper trail,<br />embrace digital memos
            </h2>
            <p className="text-landing-muted mb-8 leading-relaxed">
              MemoBhai gives every employee a clean inbox, one-click approvals, and full visibility into
              where memos stand from any device. No more lost files in email threads or unsigned paper forms.
            </p>
            <ul className="space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20 grid sm:grid-cols-3 gap-4">
          {USE_CASES.map((img) => (
            <div key={img.caption} className="relative rounded-2xl overflow-hidden group aspect-[4/3]">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white font-semibold text-sm">{img.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
