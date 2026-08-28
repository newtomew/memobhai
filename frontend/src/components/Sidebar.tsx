import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Inbox,
  Send,
  FilePlus,
  CheckCircle,
  Search,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', admin: false },
  { icon: Inbox, label: 'Inbox', href: '/inbox', admin: false },
  { icon: Send, label: 'My Memos', href: '/my-memos', admin: false },
  { icon: FilePlus, label: 'Create', href: '/memos/create', admin: false },
  { icon: CheckCircle, label: 'Completed', href: '/completed', admin: false },
  { icon: Search, label: 'Search', href: '/search', admin: false },
  { icon: User, label: 'Profile', href: '/profile', admin: false },
  { icon: Settings, label: 'Admin', href: '/admin', admin: true },
];

export default function Sidebar() {
  const { isAdmin, clearAuth } = useAuthStore();
  const location = useLocation();
  const filteredItems = menuItems.filter((item) => !item.admin || isAdmin());

  return (
    <aside className="w-[72px] flex-shrink-0 bg-charcoal rounded-4xl flex flex-col items-center py-6 shadow-sidebar">
      {/* Logo */}
      <Link to="/dashboard" className="mb-8 group">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <span className="text-charcoal font-extrabold text-lg leading-none">M</span>
        </div>
      </Link>

      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              title={item.label}
              className={clsx(
                'w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-accent text-charcoal shadow-md'
                  : 'text-gray-400 hover:bg-charcoal-light hover:text-white',
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-charcoal text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={() => { clearAuth(); window.location.href = '/login'; }}
        title="Logout"
        className="w-11 h-11 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-charcoal-light hover:text-red-400 transition-all duration-200 mt-4"
      >
        <LogOut size={20} />
      </button>
    </aside>
  );
}
