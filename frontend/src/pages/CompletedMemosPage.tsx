import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';
import { CheckCircle } from 'lucide-react';

export default function CompletedMemosPage() {
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    memosAPI
      .list('sent')
      .then((res) => {
        const all = res.data.memos || [];
        setMemos(all.filter((m: any) => ['approved', 'rejected', 'cancelled'].includes(m.status)));
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <CheckCircle className="text-green-500" size={28} />
        <h1 className="text-3xl font-bold">Completed Memos</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && memos.length === 0 && (
          <p className="text-gray-500">No completed memos yet.</p>
        )}
        {memos.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 pr-4">Number</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {memos.map((memo) => (
                <tr key={memo.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <Link to={`/memos/${memo.id}`} className="text-blue-600 hover:underline font-medium">
                      {memo.memoNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{memo.subject}</td>
                  <td className="py-3 pr-4">{memo.department?.name || '—'}</td>
                  <td className="py-3 pr-4 capitalize">{memo.priority}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(memo.status)}`}>
                      {memo.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {memo.createdAt ? new Date(memo.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
