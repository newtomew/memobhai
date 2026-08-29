import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Articles', href: '/articles', route: true },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-landing-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/memobhai-logo.svg" alt="MemoBhai" className="w-9 h-9 rounded-xl" />
          <span className="text-white font-bold text-lg tracking-tight">MemoBhai</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) =>
            (l as { route?: boolean }).route ? (
              <Link key={l.href} to={l.href} className="text-sm text-landing-muted hover:text-white transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm text-landing-muted hover:text-white transition-colors">
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/80 hover:text-white px-4 py-2 transition-colors">
            Log In
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-accent text-charcoal px-5 py-2.5 rounded-full hover:bg-accent-dark hover:text-white transition-all"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={clsx('md:hidden border-t border-white/5 bg-landing-bg', open ? 'block' : 'hidden')}>
        <div className="px-5 py-4 flex flex-col gap-3">
          {LINKS.map((l) =>
            (l as { route?: boolean }).route ? (
              <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="text-landing-muted hover:text-white py-2">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-landing-muted hover:text-white py-2">
                {l.label}
              </a>
            ),
          )}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <Link to="/login" className="text-center py-2.5 text-white/80" onClick={() => setOpen(false)}>
              Log In
            </Link>
            <Link
              to="/register"
              className="text-center py-2.5 bg-accent text-charcoal rounded-full font-medium"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
