import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchAPI, adminAPI } from '../services/api';
import { statusBadgeClass, statusLabel, avatarColor } from '../lib/statusColors';
import { Search } from 'lucide-react';

const STATUSES = ['', 'draft', 'submitted', 'pending_review', 'pending_approval', 'changes_requested', 'rejected', 'approved', 'cancelled'];
const PRIORITIES = ['', 'normal', 'high', 'urgent'];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [author, setAuthor] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.listUsers().then(r => setUsers(r.data.users || []));
    adminAPI.getDepartments().then(r => setDepartments(r.data.departments || []));
    adminAPI.getCategories().then(r => setCategories(r.data.categories || []));
  }, []);

  const runSearch = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await searchAPI.search(query, {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(author && { author }),
        ...(department && { department }),
        ...(category && { category }),
      });
      setResults(res.data.results || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get('q');
    if (initial) {
      setQ(initial);
      runSearch(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(q);
  };

  return (
    <div className="slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-surface-muted rounded-2xl flex items-center justify-center">
          <Search size={20} className="text-gray-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Search Memos</h1>
          <p className="text-sm text-gray-400">Find memos by subject, body, or number</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="card mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by subject, body, or memo number..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex-shrink-0">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="select-field">
              {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="select-field">
              {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All priorities'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Author</label>
            <select value={author} onChange={e => setAuthor(e.target.value)} className="select-field">
              <option value="">All authors</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} className="select-field">
              <option value="">All departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="select-field">
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">From date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">To date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
          </div>
        </div>
      </form>

      {error && <div className="text-red-500 text-sm mb-4 px-2">{error}</div>}

      {searched && (
        <div className="card">
          <p className="text-sm text-gray-400 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No memos matched your search.</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-2 pb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                <span>Number</span>
                <span>Subject</span>
                <span>Author</span>
                <span>Department</span>
                <span>Priority</span>
                <span>Status</span>
              </div>
              <ul className="space-y-1">
                {results.map((m) => (
                  <li key={m.id}>
                    <Link to={`/memos/${m.id}`} className="table-row grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4">
                      <span className="text-sm font-mono text-accent-dark font-medium self-center">{m.memoNumber}</span>
                      <div className="flex items-center gap-3 min-w-0 self-center">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(m.author?.name)}`}>
                          {m.author?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-charcoal truncate">{m.subject}</span>
                      </div>
                      <span className="text-sm text-gray-500 self-center hidden md:block">{m.author?.name || '—'}</span>
                      <span className="text-sm text-gray-500 self-center hidden md:block">{m.department?.name || '—'}</span>
                      <span className="text-sm capitalize text-gray-500 self-center hidden md:block">{m.priority}</span>
                      <span className={`self-center hidden md:inline-flex ${statusBadgeClass[m.status] || 'badge-neutral'}`}>
                        {statusLabel(m.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
