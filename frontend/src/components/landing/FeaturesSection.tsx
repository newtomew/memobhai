import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, GitBranch, Shield, Clock, Users, BarChart3, Layers } from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    title: 'Rich Text Memos',
    desc: 'Create professional memos with bold, lists, tables, images, and links. No more Word attachments.',
  },
  {
    icon: GitBranch,
    title: 'Sequential Workflows',
    desc: 'Route memos through reviewers, approvers, and signatories in the exact order your org requires.',
  },
  {
    icon: Shield,
    title: 'Audit & Compliance',
    desc: 'Every action logged. Version history, approval chains, and PDF exports for regulatory readiness.',
  },
  {
    icon: Clock,
    title: 'Real-Time Tracking',
    desc: 'See where every memo sits (pending, approved, changes requested, or cancelled) at a glance.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Orgs',
    desc: 'Each organization gets isolated data, branding, departments, and role-based access control.',
  },
  {
    icon: BarChart3,
    title: 'Admin Analytics',
    desc: 'Completion times, department breakdowns, rejection rates, and status charts for leadership.',
  },
];

function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="flex items-end gap-1.5 h-24 mt-4">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-accent/30 to-accent" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function WorkflowPreview() {
  const steps = ['Draft', 'Review', 'Approve', 'Done'];
  return (
    <div className="mt-4 space-y-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
            i < 3 ? 'bg-accent text-charcoal' : 'bg-white/10 text-landing-muted'
          }`}>{i + 1}</div>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            {i < 3 && <div className="h-full bg-accent rounded-full w-full" />}
          </div>
          <span className="text-xs text-landing-muted w-16">{s}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-landing-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Powerful Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything your office needs to go paperless</h2>
          <p className="text-landing-muted max-w-xl mx-auto">
            From draft to final approval, MemoBhai handles the full lifecycle of internal communications.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 lg:row-span-2 rounded-3xl border border-landing-border bg-landing-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            <Layers className="text-accent mb-4" size={28} />
            <h3 className="text-xl font-bold text-white mb-2">End-to-end memo management</h3>
            <p className="text-landing-muted text-sm mb-6 max-w-md">
              Create drafts, attach files, submit for approval, track every step, and export a signed PDF, all in one platform.
            </p>
            <ul className="space-y-3">
              {['Draft, edit, and version memos', 'Attach PDFs, images, and Office docs (10 MB)', 'Request changes and resubmit seamlessly', 'Cancel or forward at any workflow step'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-landing-border bg-landing-card p-6">
            <BarChart3 className="text-accent mb-2" size={22} />
            <h3 className="text-white font-semibold mb-1">Approval Analytics</h3>
            <p className="text-xs text-landing-muted">Avg. completion: 18 hours</p>
            <MiniChart />
          </div>

          <div className="rounded-3xl border border-landing-border bg-landing-card p-6">
            <GitBranch className="text-accent mb-2" size={22} />
            <h3 className="text-white font-semibold mb-1">Workflow Engine</h3>
            <p className="text-xs text-landing-muted">Sequential approval chains</p>
            <WorkflowPreview />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-landing-border bg-landing-surface p-6 hover:border-accent/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-sm text-landing-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
