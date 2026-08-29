import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { dashboardAPI } from '../services/api';
import UserDashboard from './dashboard/UserDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

export default function DashboardPage() {
  const { isAdmin } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getSummary()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 px-5 py-3 rounded-3xl text-sm">{error}</div>
    );
  }

  if (isAdmin() && data?.role === 'admin') {
    return (
      <AdminDashboard
        stats={data.stats}
        recentMemos={data.recentMemos || []}
        myPending={data.myPending}
      />
    );
  }

  return (
    <UserDashboard
      stats={data?.stats || { pending: 0, inProgress: 0, completed: 0, rejected: 0 }}
      recentMemos={data?.recentMemos || []}
    />
  );
}
