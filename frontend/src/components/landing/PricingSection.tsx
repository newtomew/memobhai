import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'For small teams getting started with digital memos.',
    features: ['Up to 10 users', '50 memos / month', 'Basic workflow (3 steps)', 'PDF export', 'Email support'],
    cta: 'Start Free',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '৳2,999',
    period: '/ month',
    desc: 'For growing organizations that need full workflow control.',
    features: [
      'Up to 100 users', 'Unlimited memos', 'Unlimited workflow steps', 'Workflow templates',
      'Version history and audit logs', 'Org branding and logo', 'Delegation and messaging', 'Priority support',
    ],
    cta: 'Upgrade Now',
    href: '/billing',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large institutions with advanced compliance needs.',
    features: [
      'Unlimited users', 'Multi-department analytics', 'Platform admin oversight',
      'Custom onboarding', 'SLA and dedicated support', 'SSO integration (roadmap)', 'On-premise option (roadmap)',
    ],
    cta: 'Contact Sales',
    href: 'mailto:hello@memobhai.com',
    highlight: false,
  },
];

export default function PricingSection() {
  const { token } = useAuthStore();

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-landing-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Plans that scale with your organization</h2>
          <p className="text-landing-muted max-w-lg mx-auto">
            Start free, upgrade when you need advanced workflows, analytics, and branding. Limits are enforced across the app.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const href = plan.name === 'Professional' && !token ? '/register' : plan.href;
            const isMail = href.startsWith('mailto:');
            const Cta = isMail ? 'a' : Link;
            const ctaProps = isMail ? { href } : { to: href };

            return (
              <div
                key={plan.name}
                className={clsx(
                  'rounded-3xl border p-8 flex flex-col relative',
                  plan.highlight
                    ? 'border-accent/50 bg-gradient-to-b from-accent/10 to-landing-card shadow-xl shadow-accent/10 scale-[1.02]'
                    : 'border-landing-border bg-landing-card',
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-accent text-charcoal px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <div className="mb-3">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-landing-muted text-sm">{plan.period}</span>}
                </div>
                <p className="text-sm text-landing-muted mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                      <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Cta
                  {...(ctaProps as any)}
                  className={clsx(
                    'block text-center py-3 rounded-full font-semibold text-sm transition-all',
                    plan.highlight
                      ? 'bg-accent text-charcoal hover:bg-accent-dark hover:text-white'
                      : 'border border-white/10 text-white hover:bg-white/5',
                  )}
                >
                  {plan.cta}
                </Cta>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-landing-muted mt-8">
          Professional payments use aamarPay sandbox. Your admin confirms upgrades manually before limits change.
        </p>
      </div>
    </section>
  );
}
