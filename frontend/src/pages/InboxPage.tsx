import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';

export default function InboxPage() {
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    memosAPI
      .list('inbox')
      .then((res) => setMemos(res.data.memos || []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load inbox'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Inbox</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && memos.length === 0 && (
          <p className="text-gray-500">No memos awaiting your action</p>
        )}
        {memos.length > 0 && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Number</th>
                <th className="py-2">Subject</th>
                <th className="py-2">From</th>
                <th className="py-2">Priority</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {memos.map((memo) => (
                <tr key={memo.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <Link to={`/memos/${memo.id}`} className="text-blue-600 hover:underline">
                      {memo.memoNumber}
                    </Link>
                  </td>
                  <td>{memo.subject}</td>
                  <td>{memo.author?.name || '—'}</td>
                  <td className="capitalize">{memo.priority}</td>
                  <td className="capitalize">{memo.status.replaceAll('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
