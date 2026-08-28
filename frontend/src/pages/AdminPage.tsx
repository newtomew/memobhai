import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Plus } from 'lucide-react';

type Tab = 'users' | 'departments' | 'categories' | 'reports';

export default function AdminPage() {
  const { isAdmin } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');

  if (!isAdmin()) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        You do not have admin access.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Administration</h1>

      <div className="flex gap-2 border-b mb-6">
        {(['users', 'departments', 'categories', 'reports'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium capitalize border-b-2 transition ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
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
        <h2 className="text-xl font-semibold">Users ({users.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
          <input required placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          <input required type="password" placeholder="Password (min 8)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Designation" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          <select required value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">{u.department?.name || '—'}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(u)}
                      className={`text-xs px-3 py-1 rounded ${u.status === 'active' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
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
      <h2 className="text-xl font-semibold mb-4">Departments</h2>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Department name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Finance" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
          <Plus size={16} /> {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 font-medium text-gray-600">Users</th>
                <th className="px-4 py-3 font-medium text-gray-600">Memos</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.description || '—'}</td>
                  <td className="px-4 py-3">{d._count?.users ?? 0}</td>
                  <td className="px-4 py-3">{d._count?.memos ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {d.status}
                    </span>
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
      <h2 className="text-xl font-semibold mb-4">Memo Categories</h2>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Category name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Financial" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
          <Plus size={16} /> {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow p-4">
              <p className="font-medium">{c.name}</p>
              {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
              <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {c.status}
              </span>
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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'Departments', value: stats?.departments ?? 0, color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Memos', value: stats?.totalMemos ?? 0, color: 'bg-gray-50 text-gray-700' },
    { label: 'Pending', value: stats?.pendingMemos ?? 0, color: 'bg-amber-50 text-amber-700' },
    { label: 'Approved', value: stats?.approvedMemos ?? 0, color: 'bg-green-50 text-green-700' },
    { label: 'Rejected', value: stats?.rejectedMemos ?? 0, color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Organization Reports</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-lg p-6 ${c.color}`}>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="text-4xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
