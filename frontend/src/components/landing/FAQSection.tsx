import { useState } from 'react';
import clsx from 'clsx';

const FAQS = [
  { q: 'What is MemoBhai?', a: 'MemoBhai is a cloud-based inter-office memo management platform. It replaces paper memos and email chains with structured digital documents, sequential approval workflows, audit trails, and PDF exports.' },
  { q: 'Who is MemoBhai built for?', a: 'Universities, corporate offices, NGOs, and government departments that need formal internal communication with approval chains, compliance records, and multi-department visibility.' },
  { q: 'How does the approval workflow work?', a: 'When you submit a memo, it routes sequentially through approvers you define: reviewer first, then approver, then signatory. Each person can approve, reject, request changes, or forward. The author can edit and resubmit after changes are requested.' },
  { q: 'Can multiple organizations use MemoBhai?', a: 'Yes. MemoBhai is multi-tenant. Each organization gets isolated data, its own departments, users, categories, workflow templates, and branding. Platform admins can oversee all organizations.' },
  { q: 'What are the plan limits?', a: 'Starter includes up to 10 users, 50 memos per month, and 3 workflow steps. Professional supports 100 users with unlimited memos and workflow steps. Enterprise is custom. Limits are enforced when creating memos, users, and workflows.' },
  { q: 'How does billing work?', a: 'Professional plan payments go through aamarPay sandbox. After payment succeeds, your organization admin manually confirms the upgrade before limits change. No live charges occur in sandbox mode.' },
  { q: 'Can I export memos as PDF?', a: 'Yes. Every memo can be exported as a branded PDF including the full body, approval chain, comments, and your organization logo when configured.' },
  { q: 'How do I get started?', a: 'Click Get Started to register a new organization or request to join an existing one. New orgs and manager accounts require admin approval.' },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 sm:py-28 bg-landing-surface border-y border-landing-border">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-12">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className={clsx('rounded-2xl border transition-all overflow-hidden', open === i ? 'border-accent/40 bg-landing-card' : 'border-landing-border bg-landing-bg')}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-start gap-4 px-6 py-5 text-left">
                <span className={clsx('w-1 self-stretch rounded-full shrink-0', open === i ? 'bg-accent' : 'bg-transparent')} />
                <span className="flex-1 text-white font-medium">{faq.q}</span>
                <span className="text-landing-muted text-xl leading-none">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 pl-11">
                  <p className="text-sm text-landing-muted leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
