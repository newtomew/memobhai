import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';
import { statusBadgeClass, statusLabel } from '../lib/statusColors';
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

  return (
    <div className="slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <CheckCircle size={20} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Completed Memos</h1>
          <p className="text-sm text-gray-400">{memos.length} finalized memo{memos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card">
        {loading && <p className="text-gray-400 text-sm py-8 text-center">Loading...</p>}
        {error && <p className="text-red-500 text-sm py-4">{error}</p>}
        {!loading && !error && memos.length === 0 && (
          <p className="text-gray-400 text-sm py-12 text-center">No completed memos yet.</p>
        )}
        {memos.length > 0 && (
          <>
            <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-2 pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Number</span>
              <span>Subject</span>
              <span>Department</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            <ul className="space-y-1">
              {memos.map((memo) => (
                <li key={memo.id}>
                  <Link to={`/memos/${memo.id}`} className="table-row grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4">
                    <span className="text-sm font-mono text-accent-dark font-medium self-center">{memo.memoNumber}</span>
                    <span className="text-sm font-medium text-charcoal self-center truncate">{memo.subject}</span>
                    <span className="text-sm text-gray-500 self-center hidden md:block">{memo.department?.name || '—'}</span>
                    <span className="text-sm capitalize text-gray-500 self-center hidden md:block">{memo.priority}</span>
                    <span className={`self-center hidden md:inline-flex ${statusBadgeClass[memo.status] || 'badge-neutral'}`}>
                      {statusLabel(memo.status)}
                    </span>
                    <span className="text-sm text-gray-400 self-center hidden md:block">
                      {memo.createdAt ? new Date(memo.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
