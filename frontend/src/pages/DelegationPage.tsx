import { useEffect, useState } from 'react';
import { delegationsAPI, adminAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { UserCheck } from 'lucide-react';

export default function DelegationPage() {
  const { user } = useAuthStore();
  const [delegations, setDelegations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ delegateId: '', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([delegationsAPI.list(), adminAPI.listUsers()])
      .then(([d, u]) => {
        setDelegations(d.data.delegations || []);
        setUsers((u.data.users || []).filter((x: any) => x.id !== user?.id));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await delegationsAPI.create(form);
      setForm({ delegateId: '', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create delegation');
    }
  };

  const handleCancel = async (id: string) => {
    await delegationsAPI.cancel(id);
    load();
  };

  return (
    <div className="slide-up max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
          <UserCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Approval Delegation</h1>
          <p className="text-sm text-gray-400">Delegate your approval authority during absence</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}

      <form onSubmit={handleCreate} className="card mb-6 space-y-3">
        <h2 className="font-bold text-charcoal">New Delegation</h2>
        <select required value={form.delegateId} onChange={(e) => setForm({ ...form, delegateId: e.target.value })} className="select-field">
          <option value="">Select delegate</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
          <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
        </div>
        <input placeholder="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary">Create Delegation</button>
      </form>

      <div className="card">
        <h2 className="font-bold text-charcoal mb-4">Active Delegations</h2>
        {loading ? <p className="text-gray-400 text-sm">Loading...</p> : delegations.length === 0 ? (
          <p className="text-gray-400 text-sm">No active delegations.</p>
        ) : (
          <ul className="space-y-3">
            {delegations.map((d) => (
              <li key={d.id} className="flex justify-between items-center p-3 bg-surface-muted rounded-2xl text-sm">
                <div>
                  <p className="font-medium">{d.delegatingUser?.name} → {d.delegate?.name}</p>
                  <p className="text-gray-400 text-xs">{new Date(d.startDate).toLocaleDateString()} – {new Date(d.endDate).toLocaleDateString()}</p>
                </div>
                {d.delegatingUserId === user?.id && (
                  <button onClick={() => handleCancel(d.id)} className="text-red-500 text-xs">Cancel</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
