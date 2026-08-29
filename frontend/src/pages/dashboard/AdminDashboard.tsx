import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { adminAPI } from '../../services/api';
import DonutChart from '../../components/ui/DonutChart';
import { statusBadgeClass, statusLabel, avatarColor } from '../../lib/statusColors';
import { Users, Building2, FileText, Settings, Inbox, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminStats {
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  totalUsers: number;
  totalMemos: number;
  pendingMemos: number;
  approvedMemos: number;
  rejectedMemos: number;
  departments: number;
  urgentMemos?: number;
  avgCompletionHours?: number | null;
  rejectionRate?: number;
  memosByDepartment?: { department: string; count: number }[];
  memosByCategory?: { category: string; count: number }[];
  statusBreakdown?: { status: string; count: number }[];
}

interface Props {
  stats: AdminStats;
  recentMemos: any[];
  myPending?: number;
}

export default function AdminDashboard({ stats, recentMemos, myPending = 0 }: Props) {
  const { user, organization } = useAuthStore();
  const [reporting, setReporting] = useState<Partial<AdminStats>>({});

  useEffect(() => {
    const loadReporting = () => {
      adminAPI.getDashboard()
        .then((res) => setReporting(res.data.stats || {}))
        .catch(() => {});
    };
    const id = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(loadReporting, { timeout: 4000 })
      : window.setTimeout(loadReporting, 2500);
    return () => {
      if (typeof id === 'number') window.clearTimeout(id);
      else if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
    };
  }, []);

  const insights = { ...reporting };
  const orgTotal = stats.totalMemos || 0;

  return (
    <div className="slide-up">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-accent-dark uppercase tracking-wide mb-1">Manager Console</p>
          <h1 className="text-2xl font-bold text-charcoal">{organization?.name || 'Organization'} Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome, {user?.name} — org-wide management dashboard</p>
        </div>
        <Link to="/admin" className="btn-dark text-sm self-start">
          <Settings size={16} /> Admin Panel
        </Link>
      </div>

      {/* Org-wide metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, dark: true },
          { label: 'Departments', value: stats.departments, icon: Building2, dark: false },
          { label: 'Total Memos', value: stats.totalMemos, icon: FileText, dark: false },
          { label: 'Org Pending', value: stats.pendingMemos, icon: Inbox, dark: true },
        ].map(({ label, value, icon: Icon, dark }) => (
          <div key={label} className={dark ? 'stat-card-dark' : 'stat-card-light'}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={dark ? 'text-gray-400' : 'text-accent-dark'} />
              <p className="text-sm opacity-70">{label}</p>
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Approval pipeline */}
          <div className="card">
            <h2 className="text-lg font-bold text-charcoal mb-4">Organization Memo Pipeline</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-50 rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.pendingMemos}</p>
                <p className="text-xs text-amber-700 mt-1">Pending Review</p>
              </div>
              <div className="bg-emerald-50 rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.approvedMemos}</p>
                <p className="text-xs text-emerald-700 mt-1">Approved</p>
              </div>
              <div className="bg-red-50 rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{stats.rejectedMemos}</p>
                <p className="text-xs text-red-600 mt-1">Rejected</p>
              </div>
            </div>
          </div>

          {/* My personal inbox as manager */}
          {myPending > 0 && (
            <div className="card border-l-4 border-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-charcoal">{myPending} memo{myPending !== 1 ? 's' : ''} need your approval</p>
                  <p className="text-sm text-gray-400">Items assigned to you in the workflow</p>
                </div>
                <Link to="/inbox" className="btn-primary text-sm">Review Inbox</Link>
              </div>
            </div>
          )}

          {/* Reporting insights */}
          <div className="card">
            <h2 className="text-lg font-bold text-charcoal mb-4">Reporting Insights</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface-muted rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-charcoal">
                  {insights.avgCompletionHours != null ? `${insights.avgCompletionHours}h` : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg completion time</p>
              </div>
              <div className="bg-red-50 rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{insights.urgentMemos ?? 0}</p>
                <p className="text-xs text-red-600 mt-1">Urgent open</p>
              </div>
              <div className="bg-surface-muted rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-charcoal">{insights.rejectionRate ?? 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Rejection rate</p>
              </div>
              <div className="bg-emerald-50 rounded-3xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.approvedMemos}</p>
                <p className="text-xs text-emerald-700 mt-1">Approved total</p>
              </div>
            </div>

            {(insights.memosByDepartment?.length ?? 0) > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-charcoal mb-3">Memos by department</p>
                <div className="space-y-2">
                  {insights.memosByDepartment!.slice(0, 6).map((row) => {
                    const max = Math.max(...insights.memosByDepartment!.map((d) => d.count), 1);
                    return (
                      <div key={row.department} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28 truncate">{row.department}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${(row.count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-charcoal w-6 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(insights.statusBreakdown?.length ?? 0) > 0 && (
              <div>
                <p className="text-sm font-medium text-charcoal mb-3">Status breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {insights.statusBreakdown!.map((s) => (
                    <span key={s.status} className="badge-neutral text-xs capitalize">
                      {s.status.replace(/_/g, ' ')}: {s.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Org recent memos */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-charcoal">Recent Organization Memos</h2>
              <Link to="/search" className="text-sm text-gray-400 hover:text-accent-dark flex items-center gap-1">
                Search all <ArrowRight size={14} />
              </Link>
            </div>
            {recentMemos.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No memos in the organization yet</p>
            ) : (
              <ul className="space-y-1">
                {recentMemos.map((memo) => (
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
                      <span className="text-sm text-gray-400 self-center hidden sm:block">{memo.department?.name || '—'}</span>
                      <span className={`self-center hidden sm:inline-flex ${statusBadgeClass[memo.status] || 'badge-neutral'}`}>
                        {statusLabel(memo.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Org stats panel */}
        <div className="xl:w-80 flex-shrink-0">
          <div className="card sticky top-0">
            <h2 className="text-lg font-bold text-charcoal mb-2">Org Statistics</h2>
            <p className="text-xs text-gray-400 mb-6">Organization-wide memo distribution</p>
            <div className="flex justify-center mb-6">
              <DonutChart
                total={orgTotal}
                centerLabel="Memos"
                segments={[
                  { value: stats.approvedMemos, color: '#89B9F6', label: 'Approved' },
                  { value: stats.pendingMemos, color: '#1c1c1e', label: 'Pending' },
                  { value: stats.rejectedMemos, color: '#fca5a5', label: 'Rejected' },
                ]}
              />
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {[
                { label: 'Approved', value: stats.approvedMemos, color: 'bg-accent' },
                { label: 'Pending', value: stats.pendingMemos, color: 'bg-charcoal' },
                { label: 'Rejected', value: stats.rejectedMemos, color: 'bg-red-300' },
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
            <Link to="/admin" className="btn-secondary w-full mt-6 text-sm justify-center">
              Manage Users & Departments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
