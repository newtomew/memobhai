import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Bell, ChevronDown, Search, User, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationsAPI, messagesAPI } from '../services/api';
import { avatarColor } from '../lib/statusColors';

function whenIdle(cb: () => void, fallbackMs = 1500) {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout: fallbackMs });
  }
  return window.setTimeout(cb, fallbackMs);
}

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, sinceLogin: 0, overdue: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const fullNotifsLoaded = useRef(false);

  const loadNotificationBadges = () => {
    notificationsAPI.badge()
      .then((r) => setSummary(r.data.summary || { total: 0, sinceLogin: 0, overdue: 0 }))
      .catch(() => {});
  };

  const loadFullNotifications = () => {
    notificationsAPI.list(false)
      .then((r) => {
        setNotifications(r.data.notifications || []);
        setSummary(r.data.summary || { total: 0, sinceLogin: 0, overdue: 0 });
        fullNotifsLoaded.current = true;
      })
      .catch(() => {});
  };

  const loadMessageBadge = () => {
    messagesAPI.unreadCount()
      .then((r) => setUnreadMessages(r.data.unreadTotal || 0))
      .catch(() => {});
  };

  useEffect(() => {
    let idleId: number | ReturnType<typeof window.requestIdleCallback>;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      loadNotificationBadges();
      loadMessageBadge();
      pollTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadNotificationBadges();
          loadMessageBadge();
        }
      }, 180_000);
    };

    idleId = whenIdle(startPolling, 2000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadNotificationBadges();
        loadMessageBadge();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (typeof idleId === 'number') window.clearTimeout(idleId);
      else if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (pollTimer) clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccount(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = summary.total || notifications.filter((n) => !n.isRead).length;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const markRead = async (id: string) => {
    await notificationsAPI.markAsRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n)),
    );
    setSummary((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const openNotifications = () => {
    setShowNotifs((v) => {
      const opening = !v;
      if (opening && !fullNotifsLoaded.current) loadFullNotifications();
      return opening;
    });
    setShowAccount(false);
  };

  const sinceLogin = notifications.filter((n) => n.category === 'since_login' && !n.isRead).slice(0, 5);
  const overdue = notifications.filter((n) => n.category === 'overdue' && !n.isRead).slice(0, 5);
  const other = notifications.filter((n) => n.category === 'activity' && !n.isRead).slice(0, 5);

  const renderGroup = (title: string, items: any[], accent?: string) => {
    if (items.length === 0) return null;
    return (
      <>
        <li className={`px-5 py-2 text-xs font-semibold uppercase tracking-wide ${accent || 'text-gray-400'}`}>
          {title}
        </li>
        {items.map((n) => (
          <li
            key={n.id}
            onClick={() => {
              markRead(n.id);
              if (n.memoId) navigate(`/memos/${n.memoId}`);
            }}
            className="px-5 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-surface-muted transition bg-accent/5"
          >
            <p className="text-sm text-charcoal font-medium">{n.message}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </>
    );
  };

  return (
    <header className="bg-white rounded-4xl shadow-card px-6 py-4 flex items-center gap-6 flex-shrink-0">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold ${avatarColor(user?.name)}`}>
          {user?.name?.[0]?.toUpperCase() || <User size={16} />}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-charcoal leading-tight">Greetings! 👋</p>
          <p className="text-xs text-gray-400">Start your day with {firstName}</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:block">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memos, subjects, numbers..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-muted rounded-full text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <Link
          to="/messages"
          className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-surface-muted transition"
          title="Messages"
        >
          <MessageCircle size={18} className="text-gray-500" />
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-charcoal text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-surface-muted transition"
            title="Notifications"
          >
            <Bell size={18} className="text-gray-500" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-96 bg-white border border-gray-100 rounded-3xl shadow-card-hover z-50 max-h-[28rem] overflow-y-auto">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
                <div>
                  <p className="font-semibold text-sm">Notifications</p>
                  {unread > 0 && (
                    <p className="text-xs text-gray-400">
                      {summary.sinceLogin > 0 && `${summary.sinceLogin} new since login`}
                      {summary.sinceLogin > 0 && summary.overdue > 0 && ' · '}
                      {summary.overdue > 0 && `${summary.overdue} overdue`}
                    </p>
                  )}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="text-xs text-accent-dark hover:underline"
                >
                  View all
                </Link>
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-8 text-center">
                  {unread > 0 ? 'Open notifications page for details' : 'No notifications'}
                </p>
              ) : (
                <ul>
                  {renderGroup('Since Last Login', sinceLogin, 'text-accent-dark')}
                  {renderGroup('Needs Attention', overdue, 'text-amber-600')}
                  {renderGroup('Activity', other)}
                  {sinceLogin.length === 0 && overdue.length === 0 && other.length === 0 && (
                    <li className="px-5 py-8 text-center text-sm text-gray-400">All caught up!</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={accountRef}>
          <button
            onClick={() => { setShowAccount((v) => !v); setShowNotifs(false); }}
            className="flex items-center gap-2 bg-charcoal text-white pl-3 pr-4 py-2 rounded-full text-sm font-medium hover:bg-charcoal-light transition"
          >
            <User size={15} />
            <span className="hidden sm:inline">My account</span>
            <ChevronDown size={14} className={`transition-transform ${showAccount ? 'rotate-180' : ''}`} />
          </button>

          {showAccount && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 rounded-3xl shadow-card-hover z-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-semibold text-sm text-charcoal">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                <span className="mt-2 inline-block badge-info capitalize">{user?.role}</span>
              </div>
              <div className="py-1">
                <Link to="/notifications" onClick={() => setShowAccount(false)} className="block px-5 py-2.5 text-sm text-charcoal hover:bg-surface-muted transition">
                  Notifications {unread > 0 && `(${unread})`}
                </Link>
                <Link to="/profile" onClick={() => setShowAccount(false)} className="block px-5 py-2.5 text-sm text-charcoal hover:bg-surface-muted transition">
                  Profile settings
                </Link>
                <button
                  onClick={() => { clearAuth(); navigate('/login'); }}
                  className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
