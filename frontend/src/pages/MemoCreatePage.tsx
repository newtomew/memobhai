import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, memosAPI, attachmentsAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { X, Plus, Upload, ArrowLeft, ArrowRight } from 'lucide-react';

type Step = 'details' | 'workflow';

export default function MemoCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Form state
  const [step, setStep] = useState<Step>('details');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Workflow state
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [workflowUsers, setWorkflowUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Reference data
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminAPI.getDepartments(), adminAPI.getCategories(), adminAPI.listUsers()])
      .then(([deptRes, catRes, usersRes]) => {
        setDepartments(deptRes.data.departments || []);
        setCategories(catRes.data.categories || []);
        setOrgUsers(usersRes.data.users || []);
      })
      .catch(() => setError('Failed to load form data'));
  }, []);

  const availableUsers = orgUsers.filter(
    (u) => u.id !== user?.id && !workflowUsers.find((w) => w.id === u.id),
  );

  const addWorkflowUser = () => {
    const found = orgUsers.find((u) => u.id === selectedUserId);
    if (found) {
      setWorkflowUsers((prev) => [...prev, found]);
      setSelectedUserId('');
    }
  };

  const removeWorkflowUser = (id: string) => {
    setWorkflowUsers((prev) => prev.filter((u) => u.id !== id));
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
      // Upload attachments
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
    if (workflowUsers.length === 0) {
      setError('Add at least one workflow participant');
      return;
    }
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Create Memo</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-4 mb-8">
        {(['details', 'workflow'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-blue-600 text-white' : draftId ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${step === s ? 'font-semibold' : 'text-gray-500'}`}>
              {s === 'details' ? 'Memo Details' : 'Workflow'}
            </span>
            {i < 1 && <div className="w-12 h-px bg-gray-300 mx-2" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {step === 'details' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority *</label>
            <div className="flex gap-3">
              {['normal', 'high', 'urgent'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-red-600 text-white border-red-600'
                        : p === 'high'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Brief subject of the memo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-64 resize-none"
              placeholder="Write the memo content here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attachments</label>
            <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 w-fit">
              <Upload size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">Attach files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
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
            <button
              disabled={loading}
              onClick={handleSaveDraft}
              className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              disabled={loading}
              onClick={handleContinue}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continue to Workflow <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 'workflow' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Define Approval Workflow</h2>
            <p className="text-sm text-gray-500">
              Add participants in order. The memo will move sequentially through each person.
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a participant...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.department?.name || 'No dept'} ({u.role})
                </option>
              ))}
            </select>
            <button
              onClick={addWorkflowUser}
              disabled={!selectedUserId}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {workflowUsers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Workflow sequence:</p>
              <ol className="space-y-2">
                {workflowUsers.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.department?.name}</p>
                    </div>
                    <button
                      onClick={() => removeWorkflowUser(u.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('details')}
              className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              disabled={loading || workflowUsers.length === 0}
              onClick={handleSubmit}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Memo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
