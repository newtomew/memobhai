import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas-pattern flex p-3 gap-3">
      {/* Decorative sidebar — matches app shell */}
      <aside className="hidden lg:flex w-[72px] flex-shrink-0 bg-charcoal rounded-4xl flex-col items-center py-6 shadow-sidebar">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-auto">
          <span className="text-charcoal font-extrabold text-lg">M</span>
        </div>
        <div className="mt-auto w-11 h-11 flex items-center justify-center rounded-2xl text-gray-600">
          <LogOut size={18} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 gap-3">
        {/* Header bar */}
        <header className="bg-white rounded-4xl shadow-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center lg:hidden">
              <span className="text-white font-extrabold text-sm">M</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">Greetings! 👋</p>
              <p className="text-xs text-gray-400">Welcome to MemoBhai</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 bg-surface-muted px-3 py-1.5 rounded-full hidden sm:inline">
            Memo Management System
          </span>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center rounded-4xl">
          <div className="w-full max-w-md slide-up">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-charcoal">{title}</h1>
              {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
            </div>
            <div className="card shadow-card-hover">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
