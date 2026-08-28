import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';
import { statusBadgeClass, statusLabel } from '../lib/statusColors';
import { Send, Plus } from 'lucide-react';

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
    <div className="slide-up">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
            <Send size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">My Memos</h1>
            <p className="text-sm text-gray-400">{memos.length} memo{memos.length !== 1 ? 's' : ''} sent</p>
          </div>
        </div>
        <Link to="/memos/create" className="btn-primary">
          <Plus size={16} /> Create Memo
        </Link>
      </div>

      <div className="card">
        {loading && <p className="text-gray-400 text-sm py-8 text-center">Loading...</p>}
        {error && <p className="text-red-500 text-sm py-4">{error}</p>}
        {!loading && !error && memos.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm mb-4">No memos yet</p>
            <Link to="/memos/create" className="btn-primary">Create your first memo</Link>
          </div>
        )}
        {memos.length > 0 && (
          <>
            <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-2 pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Number</span>
              <span>Subject</span>
              <span>Department</span>
              <span>Status</span>
            </div>
            <ul className="space-y-1">
              {memos.map((memo) => (
                <li key={memo.id}>
                  <Link to={`/memos/${memo.id}`} className="table-row grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr] gap-2 md:gap-4">
                    <span className="text-sm font-mono text-accent-dark font-medium self-center">{memo.memoNumber}</span>
                    <span className="text-sm font-medium text-charcoal self-center truncate">{memo.subject}</span>
                    <span className="text-sm text-gray-500 self-center hidden md:block">{memo.department?.name || '—'}</span>
                    <span className={`self-center hidden md:inline-flex ${statusBadgeClass[memo.status] || 'badge-neutral'}`}>
                      {statusLabel(memo.status)}
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
