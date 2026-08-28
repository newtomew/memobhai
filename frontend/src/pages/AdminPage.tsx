import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Plus, Settings } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'users' | 'departments' | 'categories' | 'reports';

export default function AdminPage() {
  const { isAdmin } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');

  if (!isAdmin()) {
    return (
      <div className="bg-red-50 text-red-500 px-5 py-4 rounded-3xl text-sm">
        You do not have admin access.
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-charcoal rounded-2xl flex items-center justify-center">
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Administration</h1>
          <p className="text-sm text-gray-400">Manage users, departments, and settings</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['users', 'departments', 'categories', 'reports'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-5 py-2 text-sm font-medium capitalize rounded-full transition',
              tab === t ? 'bg-charcoal text-white' : 'bg-white text-gray-500 hover:bg-surface-muted shadow-card',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'departments' && <DepartmentsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', designation: '', departmentId: '', role: 'user' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.listUsers(), adminAPI.getDepartments()])
      .then(([uRes, dRes]) => {
        setUsers(uRes.data.users || []);
        setDepartments(dRes.data.departments || []);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminAPI.createUser(form);
      setForm({ name: '', email: '', password: '', designation: '', departmentId: '', role: 'user' });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      await adminAPI.updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' });
      load();
    } catch {
      setError('Failed to update user');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-charcoal">Users ({users.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-accent/5">
          <input required placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
          <input required type="password" placeholder="Password (min 8)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" />
          <input placeholder="Designation" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} className="input-field" />
          <select required value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="select-field">
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="select-field">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Creating...' : 'Create User'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-muted">
              <tr>
                {['Name', 'Email', 'Department', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 font-medium text-gray-400 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-muted/50 transition">
                  <td className="px-5 py-3.5 font-medium text-charcoal">{u.name}</td>
                  <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.department?.name || '—'}</td>
                  <td className="px-5 py-3.5 capitalize text-gray-500">{u.role}</td>
                  <td className="px-5 py-3.5">
                    <span className={u.status === 'active' ? 'badge-success' : 'badge-error'}>{u.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStatus(u)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${u.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DepartmentsTab() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    adminAPI.getDepartments()
      .then(r => setDepartments(r.data.departments || []))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminAPI.createDepartment({ name, description });
      setName('');
      setDescription('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-charcoal mb-4">Departments</h2>
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      <form onSubmit={handleCreate} className="card mb-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Department name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Finance" className="input-field" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="input-field" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary text-sm flex-shrink-0">
          <Plus size={16} /> {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-muted">
              <tr>
                {['Name', 'Description', 'Users', 'Memos', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 font-medium text-gray-400 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-surface-muted/50 transition">
                  <td className="px-5 py-3.5 font-medium text-charcoal">{d.name}</td>
                  <td className="px-5 py-3.5 text-gray-400">{d.description || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500">{d._count?.users ?? 0}</td>
                  <td className="px-5 py-3.5 text-gray-500">{d._count?.memos ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <span className={d.status === 'active' ? 'badge-success' : 'badge-error'}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    adminAPI.getCategories()
      .then(r => setCategories(r.data.categories || []))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminAPI.createCategory({ name, description });
      setName('');
      setDescription('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-charcoal mb-4">Memo Categories</h2>
      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      <form onSubmit={handleCreate} className="card mb-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Category name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Financial" className="input-field" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="input-field" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary text-sm flex-shrink-0">
          <Plus size={16} /> {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="card !p-4">
              <p className="font-semibold text-charcoal">{c.name}</p>
              {c.description && <p className="text-sm text-gray-400 mt-1">{c.description}</p>}
              <span className={`mt-3 inline-block ${c.status === 'active' ? 'badge-success' : 'badge-error'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setStats(r.data.stats))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, dark: true },
    { label: 'Departments', value: stats?.departments ?? 0, dark: false },
    { label: 'Total Memos', value: stats?.totalMemos ?? 0, dark: false },
    { label: 'Pending', value: stats?.pendingMemos ?? 0, dark: true },
    { label: 'Approved', value: stats?.approvedMemos ?? 0, dark: false },
    { label: 'Rejected', value: stats?.rejectedMemos ?? 0, dark: true },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-charcoal mb-4">Organization Reports</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={c.dark ? 'stat-card-dark' : 'stat-card-light'}>
            <p className="text-sm opacity-70 mb-1">{c.label}</p>
            <p className="text-4xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
