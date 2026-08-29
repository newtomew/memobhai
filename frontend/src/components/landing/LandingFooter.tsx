import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Articles', href: '/articles' },
    { label: 'Register', to: '/register' },
  ],
  Company: [
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: 'mailto:hello@memobhai.com' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-landing-surface border-t border-landing-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src="/memobhai-logo.svg" alt="MemoBhai" className="w-9 h-9 rounded-xl" />
              <span className="text-white font-bold text-lg">MemoBhai</span>
            </Link>
            <p className="text-sm text-landing-muted leading-relaxed max-w-xs">
              The modern inter-office memo platform for universities, corporates, and NGOs.
              Structured workflows, audit trails, and paperless approvals.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    {'to' in l ? (
                      <Link to={l.to} className="text-sm text-landing-muted hover:text-white transition-colors">{l.label}</Link>
                    ) : (
                      <a href={l.href} className="text-sm text-landing-muted hover:text-white transition-colors">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-landing-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-landing-muted">&copy; {new Date().getFullYear()} MemoBhai by MultiFlow Solutions. All rights reserved.</p>
          <p className="text-xs text-landing-muted">Built in Bangladesh. Hosted on Vercel. Powered by Supabase.</p>
        </div>
      </div>
    </footer>
  );
}
