import { useEffect, useState } from 'react';
import { adminAPI, joinRequestsAPI } from '../../services/api';
import { Plus, Check, X } from 'lucide-react';

export function JoinRequestsTab({ title }: { title?: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    joinRequestsAPI.list().then((r) => setRequests(r.data.requests || [])).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handle = async (action: 'approve' | 'reject', id: string) => {
    setBusy(id);
    try {
      if (action === 'approve') await joinRequestsAPI.approve(id);
      else await joinRequestsAPI.reject(id);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;
  return (
    <div>
      <h2 className="text-lg font-bold text-charcoal mb-4">{title || 'Pending Join Requests'}</h2>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {requests.length === 0 ? <p className="text-gray-400 text-sm">No pending requests.</p> : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-charcoal">{r.name}</p>
                <p className="text-sm text-gray-400">{r.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {r.requestType === 'new_org' ? `New org: ${r.organizationName}` : r.organization?.name}
                  {' · '}{r.requestedRole === 'user' ? 'Employee' : 'Manager'}
                </p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy === r.id} onClick={() => handle('approve', r.id)} className="btn-primary bg-emerald-500 text-white text-sm py-2 px-3"><Check size={14} /> Approve</button>
                <button disabled={busy === r.id} onClick={() => handle('reject', r.id)} className="btn-secondary text-sm py-2 px-3 text-red-500"><X size={14} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', positions: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', positions: '' });
  const [loading, setLoading] = useState(true);

  const load = () => adminAPI.listTemplates().then((r) => setTemplates(r.data.templates || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminAPI.createTemplate({ name: form.name, description: form.description, positions: form.positions.split(',').map((s) => s.trim()).filter(Boolean) });
    setForm({ name: '', description: '', positions: '' });
    load();
  };

  const startEdit = (t: any) => {
    setEditId(t.id);
    setEditForm({ name: t.name, description: t.description || '', positions: (t.positions || []).join(', ') });
  };

  const saveEdit = async () => {
    if (!editId) return;
    await adminAPI.updateTemplate(editId, {
      name: editForm.name,
      description: editForm.description,
      positions: editForm.positions.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setEditId(null);
    load();
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-charcoal mb-4">Workflow Templates</h2>
      <form onSubmit={handleCreate} className="card mb-4 space-y-3">
        <input required placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
        <input required placeholder="Positions (comma-separated)" value={form.positions} onChange={(e) => setForm({ ...form, positions: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary text-sm">Add Template</button>
      </form>
      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="space-y-3">{templates.map((t) => (
          <div key={t.id} className="card">
            {editId === t.id ? (
              <div className="space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
                <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input-field" />
                <input value={editForm.positions} onChange={(e) => setEditForm({ ...editForm, positions: e.target.value })} className="input-field" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="btn-primary text-sm">Save</button>
                  <button onClick={() => setEditId(null)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-4">
                <div><p className="font-semibold">{t.name}</p><p className="text-xs text-gray-400">{t.positions.join(' → ')}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(t)} className="text-accent-dark text-xs">Edit</button>
                  <button onClick={() => adminAPI.deleteTemplate(t.id).then(load)} className="text-red-400 text-xs">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}</div>
      )}
    </div>
  );
}

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getAuditLogs().then((r) => setLogs(r.data.logs || [])).finally(() => setLoading(false)); }, []);
  return (
    <div>
      <h2 className="text-lg font-bold text-charcoal mb-4">Audit Log</h2>
      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">{logs.map((l) => (
          <div key={l.id} className="card py-3 px-4 text-sm">
            <span className="font-medium">{l.event}</span> <span className="text-gray-400">{l.description}</span>
            <span className="text-gray-300 text-xs ml-2">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}</div>
      )}
    </div>
  );
}

export function OrgSettingsTab() {
  const [org, setOrg] = useState<any>(null);
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  useEffect(() => {
    adminAPI.getOrganization().then((r) => { setOrg(r.data.organization); setName(r.data.organization.name); setContactEmail(r.data.organization.contactEmail || ''); });
  }, []);
  const save = async () => { await adminAPI.updateOrganization({ name, contactEmail }); alert('Saved'); };
  const uploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await adminAPI.updateOrganization({ logoData: (reader.result as string).split(',')[1], logoMimeType: file.type });
      adminAPI.getOrganization().then((r) => setOrg(r.data.organization));
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-bold text-charcoal mb-4">Organization Settings</h2>
      <div className="card space-y-4">
        {org?.logo && <img src={org.logo} alt="Logo" className="h-16 object-contain" />}
        <label className="btn-secondary text-sm cursor-pointer inline-block">Upload Logo<input type="file" accept="image/*" className="hidden" onChange={uploadLogo} /></label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Organization name" />
        <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input-field" placeholder="Contact email" />
        <button onClick={save} className="btn-primary">Save</button>
      </div>
    </div>
  );
}
