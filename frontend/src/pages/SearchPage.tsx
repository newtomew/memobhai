import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { Search } from 'lucide-react';

const STATUSES = ['', 'draft', 'submitted', 'pending_review', 'pending_approval', 'changes_requested', 'rejected', 'approved', 'cancelled'];
const PRIORITIES = ['', 'normal', 'high', 'urgent'];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await searchAPI.search(q, {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      setResults(res.data.results || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    if (s === 'draft') return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Search className="text-gray-500" size={26} />
        <h1 className="text-3xl font-bold">Search Memos</h1>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <div className="flex gap-3">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by subject, body, or memo number..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={16} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p || 'All priorities'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {searched && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          {results.length === 0 ? (
            <p className="text-gray-500">No memos matched your search.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-4">Number</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Author</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <Link to={`/memos/${m.id}`} className="text-blue-600 hover:underline font-medium">
                        {m.memoNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{m.subject}</td>
                    <td className="py-3 pr-4">{m.author?.name || '—'}</td>
                    <td className="py-3 pr-4">{m.department?.name || '—'}</td>
                    <td className="py-3 pr-4 capitalize">{m.priority}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(m.status)}`}>
                        {m.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
