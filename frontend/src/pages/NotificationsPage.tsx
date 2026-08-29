import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Bell, CheckCheck, Clock, Sparkles, AlertTriangle } from 'lucide-react';

const categoryMeta: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  since_login: { label: 'Since Last Login', icon: Sparkles, color: 'text-accent-dark bg-accent/15' },
  overdue: { label: 'Needs Attention', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  activity: { label: 'Recent Activity', icon: Clock, color: 'text-gray-500 bg-surface-muted' },
};

export default function NotificationsPage() {
  const { isAdmin } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [summary, setSummary] = useState({ sinceLogin: 0, overdue: 0, total: 0 });
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationsAPI.list(true)
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setSummary(res.data.summary || { sinceLogin: 0, overdue: 0, total: 0 });
        setLastLoginAt(res.data.lastLoginAt || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notificationsAPI.markAsRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n)),
    );
    setSummary((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    setSummary({ sinceLogin: 0, overdue: 0, total: 0 });
  };

  const grouped = ['since_login', 'overdue', 'activity'].map((cat) => ({
    category: cat,
    items: notifications.filter((n) => n.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="slide-up max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-accent/20 rounded-2xl flex items-center justify-center">
              <Bell size={20} className="text-accent-dark" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal">Notifications</h1>
          </div>
          {lastLoginAt && (
            <p className="text-sm text-gray-400 mt-1 pl-[52px]">
              Showing updates since your last login on{' '}
              {new Date(lastLoginAt).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1 pl-[52px]">
            {isAdmin()
              ? 'Managers see new org memos and approvals overdue 2+ days'
              : 'Staff see approved/rejected memos and approvals overdue 5+ days'}
          </p>
        </div>
        {summary.total > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex-shrink-0">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {summary.sinceLogin > 0 && (
          <span className="badge-info">{summary.sinceLogin} since last login</span>
        )}
        {summary.overdue > 0 && (
          <span className="badge-warning">{summary.overdue} overdue</span>
        )}
        {summary.total === 0 && !loading && (
          <span className="badge-neutral">All caught up</span>
        )}
      </div>

      {loading ? (
        <div className="card py-12 text-center text-gray-400 text-sm">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card py-16 text-center">
          <Bell size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-charcoal font-medium">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, items }) => {
            const meta = categoryMeta[category];
            const Icon = meta.icon;
            return (
              <div key={category} className="card !p-0 overflow-hidden">
                <div className={`flex items-center gap-2 px-5 py-3 border-b border-gray-50 ${meta.color}`}>
                  <Icon size={16} />
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <span className="ml-auto text-xs opacity-70">{items.filter((n) => !n.isRead).length} unread</span>
                </div>
                <ul>
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={`px-5 py-4 border-b border-gray-50 last:border-0 transition ${!n.isRead ? 'bg-accent/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.isRead ? 'font-medium text-charcoal' : 'text-gray-600'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                          {n.memoId && (
                            <Link
                              to={`/memos/${n.memoId}`}
                              onClick={() => !n.isRead && markRead(n.id)}
                              className="text-xs text-accent-dark hover:underline mt-1 inline-block"
                            >
                              View memo →
                            </Link>
                          )}
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-xs text-gray-400 hover:text-charcoal flex-shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
