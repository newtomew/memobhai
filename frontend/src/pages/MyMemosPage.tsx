import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';

export default function MyMemosPage() {
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    memosAPI
      .list('sent')
      .then((res) => setMemos(res.data.memos || []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load memos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Memos</h1>
        <Link
          to="/memos/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Memo
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && memos.length === 0 && (
          <p className="text-gray-500">No memos yet</p>
        )}
        {memos.length > 0 && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="py-2">Number</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Department</th>
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
                  <td>{memo.department?.name || '—'}</td>
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
