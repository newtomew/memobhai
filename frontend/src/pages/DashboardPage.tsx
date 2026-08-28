import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { adminAPI, memosAPI } from '../services/api';
import DonutChart from '../components/ui/DonutChart';
import { statusBadgeClass, statusLabel, avatarColor } from '../lib/statusColors';
import { FilePlus, Inbox, Search, CheckCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isAdmin } = useAuthStore();
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, rejected: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [inboxRes, sentRes] = await Promise.all([
          memosAPI.list('inbox'),
          memosAPI.list('sent'),
        ]);
        const inbox = inboxRes.data.memos || [];
        const sent = sentRes.data.memos || [];
        const all = [...inbox, ...sent];
        setStats({
          pending: inbox.length,
          inProgress: sent.filter((m: any) =>
            ['submitted', 'pending_review', 'pending_approval'].includes(m.status),
          ).length,
          completed: sent.filter((m: any) => m.status === 'approved').length,
          rejected: sent.filter((m: any) => m.status === 'rejected').length,
        });
        setRecent(all.slice(0, 6));

        if (isAdmin()) {
          const dash = await adminAPI.getDashboard();
          const s = dash.data.stats || {};
          setStats((prev) => ({
            pending: s.pendingMemos ?? prev.pending,
            inProgress: prev.inProgress,
            completed: s.approvedMemos ?? prev.completed,
            rejected: s.rejectedMemos ?? prev.rejected,
          }));
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      }
    };
    load();
  }, [isAdmin]);

  const total = stats.pending + stats.inProgress + stats.completed + stats.rejected;

  const quickActions = [
    { label: 'Create Memo', href: '/memos/create', icon: FilePlus, variant: 'active' as const },
    { label: 'Inbox', href: '/inbox', icon: Inbox, variant: 'default' as const },
    { label: 'Search', href: '/search', icon: Search, variant: 'dark' as const },
    { label: 'Completed', href: '/completed', icon: CheckCircle, variant: 'dark' as const },
  ];

  const actionClass = {
    active: 'action-pill-active',
    default: 'action-pill-default',
    dark: 'action-pill-dark',
  };

  return (
    <div className="slide-up">
      {error && (
        <div className="bg-red-50 text-red-600 px-5 py-3 rounded-3xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Stat cards — bento style */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal">Overview</h2>
              <Link to="/my-memos" className="text-sm text-gray-400 hover:text-accent-dark transition flex items-center gap-1">
                See all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="stat-card-dark">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="text-gray-400 text-sm mb-1">Pending Approvals</p>
                <p className="text-4xl font-bold">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-3">Awaiting your action</p>
              </div>
              <div className="stat-card-light">
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-accent/10" />
                <p className="text-gray-400 text-sm mb-1">In Progress</p>
                <p className="text-4xl font-bold text-charcoal">{stats.inProgress}</p>
                <p className="text-xs text-gray-400 mt-3">Active workflows</p>
              </div>
              <div className="stat-card-light">
                <p className="text-gray-400 text-sm mb-1">Completed</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.completed}</p>
                <p className="text-xs text-gray-400 mt-3">Approved memos</p>
              </div>
              <div className="stat-card-dark">
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <p className="text-gray-400 text-sm mb-1">Rejected</p>
                <p className="text-4xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-gray-500 mt-3">Declined memos</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-lg font-bold text-charcoal mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {quickActions.map(({ label, href, icon: Icon, variant }) => (
                <Link key={href} to={href} className={actionClass[variant]}>
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent memos table */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-charcoal">Recent Memos</h2>
              <Link to="/inbox" className="text-sm text-gray-400 hover:text-accent-dark transition">
                See all
              </Link>
            </div>

            {recent.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No recent activity</p>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-2 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  <span>Subject</span>
                  <span>Author</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>
                <ul className="space-y-1">
                  {recent.map((memo) => (
                    <li key={memo.id}>
                      <Link to={`/memos/${memo.id}`} className="table-row grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(memo.author?.name)}`}>
                            {memo.author?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-charcoal truncate">{memo.subject}</p>
                            <p className="text-xs text-gray-400 font-mono">{memo.memoNumber}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 self-center hidden sm:block">{memo.author?.name || '—'}</span>
                        <span className={`self-center hidden sm:inline-flex ${statusBadgeClass[memo.status] || 'badge-neutral'}`}>
                          {statusLabel(memo.status)}
                        </span>
                        <span className="text-sm text-gray-400 self-center hidden sm:block">
                          {memo.createdAt ? formatDistanceToNow(new Date(memo.createdAt), { addSuffix: true }) : '—'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Right stats panel */}
        <div className="xl:w-80 flex-shrink-0">
          <div className="card sticky top-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-charcoal">Statistics</h2>
              <span className="text-xs text-gray-400 bg-surface-muted px-3 py-1 rounded-full">This month</span>
            </div>

            <div className="flex justify-center mb-6">
              <DonutChart
                total={total}
                centerLabel="Total"
                segments={[
                  { value: stats.completed, color: '#89B9F6', label: 'Completed' },
                  { value: stats.pending + stats.inProgress, color: '#1c1c1e', label: 'Active' },
                  { value: stats.rejected, color: '#fca5a5', label: 'Rejected' },
                ]}
              />
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Pending', value: stats.pending, color: 'bg-charcoal' },
                { label: 'In Progress', value: stats.inProgress, color: 'bg-accent' },
                { label: 'Completed', value: stats.completed, color: 'bg-emerald-400' },
                { label: 'Rejected', value: stats.rejected, color: 'bg-red-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-sm text-gray-500">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-charcoal">{value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Latest Activity</p>
              <ul className="space-y-3">
                {recent.slice(0, 4).map((memo) => (
                  <li key={memo.id}>
                    <Link to={`/memos/${memo.id}`} className="flex items-center gap-3 group">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(memo.author?.name)}`}>
                        {memo.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate group-hover:text-accent-dark transition">{memo.subject}</p>
                        <p className="text-xs text-gray-400">
                          {memo.createdAt ? formatDistanceToNow(new Date(memo.createdAt), { addSuffix: true }) : ''}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 ${statusBadgeClass[memo.status] || 'badge-neutral'}`}>
                        {statusLabel(memo.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
