import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import DonutChart from '../../components/ui/DonutChart';
import { statusBadgeClass, statusLabel, avatarColor } from '../../lib/statusColors';
import { FilePlus, Inbox, Search, CheckCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  stats: { pending: number; inProgress: number; completed: number; rejected: number };
  recentMemos: any[];
}

export default function UserDashboard({ stats, recentMemos }: Props) {
  const { user } = useAuthStore();
  const total = stats.pending + stats.inProgress + stats.completed + stats.rejected;

  const quickActions = [
    { label: 'Create Memo', href: '/memos/create', icon: FilePlus, variant: 'active' as const },
    { label: 'My Inbox', href: '/inbox', icon: Inbox, variant: 'default' as const },
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
      <div className="mb-6">
        <p className="text-xs font-medium text-accent-dark uppercase tracking-wide mb-1">Staff Dashboard</p>
        <h1 className="text-2xl font-bold text-charcoal">Hello, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-sm text-gray-400 mt-1">Track your memos, approvals, and submissions</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal">My Overview</h2>
              <Link to="/my-memos" className="text-sm text-gray-400 hover:text-accent-dark transition flex items-center gap-1">
                My memos <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="stat-card-dark">
                <p className="text-gray-400 text-sm mb-1">Awaiting My Action</p>
                <p className="text-4xl font-bold">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-3">In your inbox</p>
              </div>
              <div className="stat-card-light">
                <p className="text-gray-400 text-sm mb-1">In Progress</p>
                <p className="text-4xl font-bold text-charcoal">{stats.inProgress}</p>
                <p className="text-xs text-gray-400 mt-3">Memos you submitted</p>
              </div>
              <div className="stat-card-light">
                <p className="text-gray-400 text-sm mb-1">Approved</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="stat-card-dark">
                <p className="text-gray-400 text-sm mb-1">Rejected</p>
                <p className="text-4xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-charcoal mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {quickActions.map(({ label, href, icon: Icon, variant }) => (
                <Link key={href} to={href} className={actionClass[variant]}>
                  <Icon size={16} /> {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-charcoal">Recent Activity</h2>
              <Link to="/inbox" className="text-sm text-gray-400 hover:text-accent-dark transition">See inbox</Link>
            </div>
            {recentMemos.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No recent activity</p>
            ) : (
              <ul className="space-y-1">
                {recentMemos.map((memo) => (
                  <li key={memo.id}>
                    <Link to={`/memos/${memo.id}`} className="table-row grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-2 sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(memo.author?.name)}`}>
                          {memo.author?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-charcoal truncate">{memo.subject}</p>
                          <p className="text-xs text-gray-400 font-mono">{memo.memoNumber}</p>
                        </div>
                      </div>
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
            )}
          </div>
        </div>

        <div className="xl:w-80 flex-shrink-0">
          <div className="card sticky top-0">
            <h2 className="text-lg font-bold text-charcoal mb-6">My Statistics</h2>
            <div className="flex justify-center mb-6">
              <DonutChart
                total={total}
                centerLabel="Total"
                segments={[
                  { value: stats.completed, color: '#89B9F6', label: 'Approved' },
                  { value: stats.pending + stats.inProgress, color: '#1c1c1e', label: 'Active' },
                  { value: stats.rejected, color: '#fca5a5', label: 'Rejected' },
                ]}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Personal memo stats only — org-wide reports are available to managers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
