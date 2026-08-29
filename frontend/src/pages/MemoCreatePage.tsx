import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, memosAPI, attachmentsAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { X, Plus, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import { lazy, Suspense } from 'react';

const RichTextEditor = lazy(() => import('../components/RichTextEditor'));

type Step = 'details' | 'workflow';

export default function MemoCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('details');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [workflowUsers, setWorkflowUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminAPI.getDepartments(), adminAPI.getCategories(), adminAPI.listUsers(), adminAPI.listTemplates()])
      .then(([deptRes, catRes, usersRes, tplRes]) => {
        setDepartments(deptRes.data.departments || []);
        setCategories(catRes.data.categories || []);
        setOrgUsers(usersRes.data.users || []);
        setTemplates(tplRes.data.templates || []);
      })
      .catch(() => setError('Failed to load form data'));
  }, []);

  const availableUsers = orgUsers.filter(
    (u) => u.id !== user?.id && !workflowUsers.find((w) => w.id === u.id),
  );

  const addWorkflowUser = () => {
    const found = orgUsers.find((u) => u.id === selectedUserId);
    if (found) { setWorkflowUsers((prev) => [...prev, found]); setSelectedUserId(''); }
  };

  const removeWorkflowUser = (id: string) => {
    setWorkflowUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl?.positions?.length) return;
    const matched: any[] = [];
    for (const roleLabel of tpl.positions as string[]) {
      const match = orgUsers.find(
        (u) =>
          u.id !== user?.id &&
          !matched.find((m) => m.id === u.id) &&
          (u.designation?.toLowerCase().includes(roleLabel.toLowerCase()) ||
            u.role === 'admin' ||
            u.name.toLowerCase().includes(roleLabel.toLowerCase().split(' ')[0])),
      );
      if (match) matched.push(match);
    }
    if (matched.length > 0) setWorkflowUsers(matched);
  };

  const saveDraft = async () => {
    if (!subject.trim() || !body.trim() || !departmentId) {
      setError('Subject, body, and department are required');
      return null;
    }
    setError('');
    setLoading(true);
    try {
      let id = draftId;
      if (!id) {
        const res = await memosAPI.create({ subject, body, priority, departmentId, categoryId: categoryId || undefined });
        id = res.data.memo.id;
        setDraftId(id);
      } else {
        await memosAPI.update(id, { subject, body, priority });
      }
      for (const file of files) {
        await attachmentsAPI.upload(id!, file);
      }
      setFiles([]);
      return id;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save draft');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const id = await saveDraft();
    if (id) navigate('/my-memos');
  };

  const handleContinue = async () => {
    const id = await saveDraft();
    if (id) setStep('workflow');
  };

  const handleSubmit = async () => {
    if (workflowUsers.length === 0) { setError('Add at least one workflow participant'); return; }
    setLoading(true);
    setError('');
    try {
      await memosAPI.submit(draftId!, workflowUsers.map((u) => u.id));
      navigate(`/memos/${draftId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit memo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slide-up max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-charcoal">Create Memo</h1>
      </div>

      {/* Steps */}
      <div className="flex gap-4 mb-6">
        {(['details', 'workflow'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-sm font-bold ${
              step === s ? 'bg-accent text-charcoal' : draftId ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-muted text-gray-400'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm ${step === s ? 'font-semibold text-charcoal' : 'text-gray-400'}`}>
              {s === 'details' ? 'Memo Details' : 'Workflow'}
            </span>
            {i < 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 px-5 py-3 rounded-2xl mb-6 text-sm">{error}</div>
      )}

      {step === 'details' && (
        <div className="card space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Department *</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="select-field">
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="select-field">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Priority *</label>
            <div className="flex gap-3">
              {['normal', 'high', 'urgent'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition ${
                    priority === p
                      ? p === 'urgent' ? 'bg-red-500 text-white' : p === 'high' ? 'bg-orange-400 text-white' : 'bg-accent text-charcoal'
                      : 'bg-surface-muted text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Subject *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder="Brief subject of the memo" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Body *</label>
            <Suspense fallback={<div className="input-field h-48 animate-pulse bg-surface-muted rounded-3xl" />}>
              <RichTextEditor value={body} onChange={setBody} placeholder="Write the memo content here..." />
            </Suspense>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Attachments</label>
            <label className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-accent/50 w-fit transition">
              <Upload size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">Attach files</span>
              <input type="file" multiple className="hidden" onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-500 bg-surface-muted px-4 py-2 rounded-2xl w-fit">
                    <span>{f.name}</span>
                    <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                    <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X size={14} className="text-red-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button disabled={loading} onClick={handleSaveDraft} className="btn-secondary">Save as Draft</button>
            <button disabled={loading} onClick={handleContinue} className="btn-primary">
              Continue to Workflow <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 'workflow' && (
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-bold text-charcoal mb-1">Define Approval Workflow</h2>
            <p className="text-sm text-gray-400">Add participants in order. The memo moves sequentially through each person.</p>
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Workflow Template (optional)</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="select-field"
              >
                <option value="">Custom workflow</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.positions?.length || 0} steps)</option>
                ))}
              </select>
              {selectedTemplateId && (
                <p className="text-xs text-gray-400 mt-1">
                  Template roles: {(templates.find((t) => t.id === selectedTemplateId)?.positions || []).join(' → ')}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="select-field flex-1">
              <option value="">Select a participant...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.department?.name || 'No dept'} ({u.role})</option>
              ))}
            </select>
            <button onClick={addWorkflowUser} disabled={!selectedUserId} className="btn-primary">
              <Plus size={16} /> Add
            </button>
          </div>

          {workflowUsers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">Workflow sequence:</p>
              <ol className="space-y-2">
                {workflowUsers.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 p-4 bg-surface-muted rounded-3xl">
                    <span className="w-7 h-7 bg-charcoal text-white rounded-xl flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-charcoal">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.department?.name}</p>
                    </div>
                    <button onClick={() => removeWorkflowUser(u.id)} className="text-gray-400 hover:text-red-500 transition">
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep('details')} className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
            <button disabled={loading || workflowUsers.length === 0} onClick={handleSubmit} className="btn-dark">
              {loading ? 'Submitting...' : 'Submit Memo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
