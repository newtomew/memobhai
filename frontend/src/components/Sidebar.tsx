import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import {
  LayoutDashboard,
  Inbox,
  Send,
  FilePlus,
  CheckCircle,
  Search,
  User,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const { isAdmin } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', admin: false },
    { icon: Inbox, label: 'Inbox', href: '/inbox', admin: false },
    { icon: Send, label: 'My Memos', href: '/my-memos', admin: false },
    { icon: FilePlus, label: 'Create Memo', href: '/memos/create', admin: false },
    { icon: CheckCircle, label: 'Completed', href: '/completed', admin: false },
    { icon: Search, label: 'Search', href: '/search', admin: false },
    { icon: User, label: 'Profile', href: '/profile', admin: false },
    { icon: Settings, label: 'Admin', href: '/admin', admin: true },
  ];

  const filteredItems = menuItems.filter((item) => !item.admin || isAdmin());

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold">MemoBhai</h2>
        <p className="text-xs text-gray-400 mt-1">Memo Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800',
              )}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">© 2026 MemoBhai</p>
      </div>
    </div>
  );
}
