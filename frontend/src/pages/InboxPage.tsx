import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';
import { statusBadgeClass, statusLabel, avatarColor } from '../lib/statusColors';
import { Inbox } from 'lucide-react';

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
    <div className="slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/20 rounded-2xl flex items-center justify-center">
          <Inbox size={20} className="text-accent-dark" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Inbox</h1>
          <p className="text-sm text-gray-400">{memos.length} memo{memos.length !== 1 ? 's' : ''} awaiting action</p>
        </div>
      </div>

      <div className="card">
        {loading && <p className="text-gray-400 text-sm py-8 text-center">Loading...</p>}
        {error && <p className="text-red-500 text-sm py-4">{error}</p>}
        {!loading && !error && memos.length === 0 && (
          <p className="text-gray-400 text-sm py-12 text-center">No memos awaiting your action</p>
        )}
        {memos.length > 0 && (
          <>
            <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-2 pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Number</span>
              <span>Subject</span>
              <span>From</span>
              <span>Priority</span>
              <span>Status</span>
            </div>
            <ul className="space-y-1">
              {memos.map((memo) => (
                <li key={memo.id}>
                  <Link to={`/memos/${memo.id}`} className="table-row grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-2 md:gap-4">
                    <span className="text-sm font-mono text-accent-dark font-medium self-center">{memo.memoNumber}</span>
                    <div className="flex items-center gap-3 min-w-0 self-center">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(memo.author?.name)}`}>
                        {memo.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium text-charcoal truncate">{memo.subject}</span>
                    </div>
                    <span className="text-sm text-gray-500 self-center hidden md:block">{memo.author?.name || '—'}</span>
                    <span className="text-sm capitalize text-gray-500 self-center hidden md:block">{memo.priority}</span>
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
