import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { LogOut, Bell, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationsAPI } from '../services/api';

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    notificationsAPI.list().then(r => setNotifications(r.data.notifications || [])).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await notificationsAPI.markAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-800">Memo Management System</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center px-4 py-3 border-b">
                <p className="font-semibold text-sm">Notifications</p>
                {unread > 0 && (
                  <span className="text-xs text-blue-600">{unread} unread</span>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 px-4 py-6 text-center">No notifications</p>
              ) : (
                <ul>
                  {notifications.map(n => (
                    <li
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User info */}
        <Link to="/profile" className="flex items-center gap-2 pl-3 border-l hover:bg-gray-50 rounded-lg px-3 py-1.5">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || <User size={14} />}
          </div>
          <div className="text-right text-sm hidden sm:block">
            <p className="font-medium leading-tight">{user?.name}</p>
            <p className="text-gray-400 text-xs">{user?.role}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
