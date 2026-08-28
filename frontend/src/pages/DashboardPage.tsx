import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { adminAPI, memosAPI } from '../services/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isAdmin } = useAuthStore();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
  });
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
        setRecent(all.slice(0, 8));

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}!</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Pending Approvals</p>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-3xl font-bold">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-3xl font-bold">{stats.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-3xl font-bold">{stats.rejected}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="text-gray-500">No recent activity</p>
        ) : (
          <ul className="divide-y">
            {recent.map((memo) => (
              <li key={memo.id} className="py-3">
                <Link to={`/memos/${memo.id}`} className="text-blue-600 hover:underline font-medium">
                  {memo.memoNumber}: {memo.subject}
                </Link>
                <p className="text-sm text-gray-500 capitalize">{memo.status.replaceAll('_', ' ')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
