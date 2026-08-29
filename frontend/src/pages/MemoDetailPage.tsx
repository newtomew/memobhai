import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { commentsAPI, memosAPI, workflowAPI, attachmentsAPI, memoVersionsAPI, adminAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import {
  ArrowLeft, Download, Upload, FileText, CheckCircle, XCircle,
  Clock, AlertCircle, X, History, Edit3, Send, Ban, Plus,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { statusBadgeClass, statusLabel, priorityClass, avatarColor } from '../lib/statusColors';

const RichTextEditor = lazy(() => import('../components/RichTextEditor'));

const CANCELLABLE = ['draft', 'submitted', 'pending_review', 'pending_approval', 'changes_requested'];

function renderBodyHtml(body?: string) {
  if (!body) return '';
  return body.includes('<') ? body : body.replace(/\n/g, '<br/>');
}

export default function MemoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, organization, isAdmin, isPlatformAdmin } = useAuthStore();
  const userId = user?.id;

  const [memo, setMemo] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showResubmit, setShowResubmit] = useState(false);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [workflowUsers, setWorkflowUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const canViewVersions = isAdmin() || isPlatformAdmin() || memo?.authorId === userId;

  const load = async () => {
    if (!id) return;
    const res = await memosAPI.get(id);
    setMemo(res.data.memo);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.error || 'Failed to load memo'));
  }, [id]);

  useEffect(() => {
    if (!id || !canViewVersions) return;
    memoVersionsAPI.list(id).then((res) => setVersions(res.data.versions || [])).catch(() => {});
  }, [id, canViewVersions]);

  useEffect(() => {
    if (searchParams.get('versions') === '1') setShowVersions(true);
  }, [searchParams]);

  const pendingStep = memo?.canActOnWorkflow
    ? memo?.workflowSteps?.find((s: any) => s.status === 'pending')
    : memo?.workflowSteps?.find((s: any) => s.status === 'pending' && s.userId === userId);

  const isAuthor = memo?.authorId === userId;
  const canDeleteDraft = memo?.status === 'draft' && (isAuthor || isAdmin());
  const canEditChanges = memo?.status === 'changes_requested' && isAuthor;
  const canCancel = memo && CANCELLABLE.includes(memo.status) && (isAuthor || isAdmin() || isPlatformAdmin());

  const loadOrgUsers = async () => {
    try {
      const res = await adminAPI.listUsers();
      setOrgUsers(res.data.users || []);
    } catch {
      setError('Failed to load organization users for workflow');
    }
  };

  const startEdit = () => {
    setEditSubject(memo.subject);
    setEditBody(memo.body || '');
    setEditing(true);
    setShowResubmit(false);
  };

  const startResubmit = async () => {
    await loadOrgUsers();
    setWorkflowUsers([]);
    setShowResubmit(true);
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      await memosAPI.update(id, { subject: editSubject, body: editBody });
      setEditing(false);
      await load();
      if (canViewVersions) {
        const res = await memoVersionsAPI.list(id);
        setVersions(res.data.versions || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const addWorkflowUser = () => {
    const found = orgUsers.find((u) => u.id === selectedUserId);
    if (found && !workflowUsers.find((w) => w.id === found.id)) {
      setWorkflowUsers((prev) => [...prev, found]);
      setSelectedUserId('');
    }
  };

  const handleResubmit = async () => {
    if (!id || workflowUsers.length === 0) {
      setError('Add at least one workflow approver before resubmitting');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await memosAPI.submit(id, workflowUsers.map((u) => u.id));
      setShowResubmit(false);
      setWorkflowUsers([]);
      await load();
      if (canViewVersions) {
        const res = await memoVersionsAPI.list(id);
        setVersions(res.data.versions || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Resubmit failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !window.confirm('Cancel this memo? It will no longer proceed through the workflow.')) return;
    setBusy(true);
    try {
      await memosAPI.cancel(id);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!id || !window.confirm('Delete this draft permanently?')) return;
    setBusy(true);
    try {
      await memosAPI.delete(id);
      navigate('/my-memos');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const commentTypeLabel: Record<string, string> = {
    general: 'Comment',
    approval: 'Approval',
    rejection: 'Rejection',
    changes_requested: 'Changes Requested',
  };

  const commentTypeClass: Record<string, string> = {
    general: 'badge-neutral',
    approval: 'badge-success',
    rejection: 'badge-error',
    changes_requested: 'badge-warning',
  };

  const approvalActionLabel: Record<string, string> = {
    approve: 'Approved',
    reject: 'Rejected',
    request_changes: 'Requested Changes',
    forward: 'Forwarded',
  };

  const runAction = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      setActionComment('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      await attachmentsAPI.upload(id, file);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      const res = await attachmentsAPI.download(attachment.id);
      const signedUrl = res.data.url;
      if (signedUrl) window.open(signedUrl, '_blank');
    } catch {
      setError('Failed to download file');
    }
  };

  const exportPDF = async () => {
    if (!memo) return;
    const { exportMemoPdf } = await import('../lib/memoPdf');
    await exportMemoPdf(
      {
        ...memo,
        organization: memo.organization || { name: organization?.name, logo: organization?.logo },
      },
      organization?.name,
    );
  };

  const availableUsers = orgUsers.filter(
    (u) => u.id !== userId && !workflowUsers.find((w) => w.id === u.id),
  );

  if (!memo && !error) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Loading memo...</p>
    </div>
  );
  if (!memo) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <div className="slide-up max-w-4xl mx-auto px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button onClick={() => navigate(-1)} className="btn-ghost p-1">
              <ArrowLeft size={18} />
            </button>
            <span className="text-sm text-gray-400 font-mono">{memo.memoNumber}</span>
            <span className={statusBadgeClass[memo.status] || 'badge-neutral'}>{statusLabel(memo.status)}</span>
            <span className={`text-xs capitalize ${priorityClass[memo.priority] || ''}`}>
              {memo.priority === 'urgent' && <AlertCircle size={12} className="inline mr-1" />}
              {memo.priority}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal break-words">{memo.subject}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {memo.author?.name} · {memo.department?.name} · {memo.category?.name || 'No category'}
            {memo.createdAt && ` · ${new Date(memo.createdAt).toLocaleDateString()}`}
            {memo.organization?.name && isPlatformAdmin() && ` · ${memo.organization.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {canEditChanges && !editing && !showResubmit && (
            <>
              <button onClick={startEdit} className="btn-secondary text-sm">
                <Edit3 size={16} /> Edit Memo
              </button>
              <button onClick={startResubmit} className="btn-primary text-sm">
                <Send size={16} /> Resubmit
              </button>
            </>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={busy} className="btn-secondary text-sm text-red-500 border-red-200">
              <Ban size={16} /> Cancel Memo
            </button>
          )}
          {canDeleteDraft && (
            <button onClick={handleDeleteDraft} disabled={busy} className="btn-secondary text-sm text-red-500 border-red-200">
              <X size={16} /> Delete Draft
            </button>
          )}
          <button onClick={exportPDF} className="btn-secondary text-sm">
            <Download size={16} /> Download Official PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 px-5 py-3 rounded-2xl mb-6 text-sm flex justify-between items-center gap-3">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {canEditChanges && memo.status === 'changes_requested' && !editing && !showResubmit && (
        <div className="card mb-4 border-l-4 border-amber-400 bg-amber-50/50">
          <h2 className="text-sm font-semibold text-amber-800 mb-1">Changes Requested</h2>
          <p className="text-sm text-amber-700">
            Edit the memo to address feedback, then resubmit with an updated approval workflow.
          </p>
        </div>
      )}

      {editing && (
        <div className="card mb-4 border-l-4 border-accent">
          <h2 className="text-lg font-bold text-charcoal mb-3">Edit Memo</h2>
          <input
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
            className="input-field mb-3"
            placeholder="Subject"
          />
          <Suspense fallback={<div className="h-32 bg-surface-muted rounded-2xl animate-pulse" />}>
            <RichTextEditor value={editBody} onChange={setEditBody} />
          </Suspense>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveEdit} disabled={busy} className="btn-primary text-sm">Save Changes</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showResubmit && (
        <div className="card mb-4 border-l-4 border-emerald-400">
          <h2 className="text-lg font-bold text-charcoal mb-1">Resubmit for Approval</h2>
          <p className="text-sm text-gray-400 mb-4">Select approvers in order. The memo will re-enter the workflow.</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="input-field flex-1">
              <option value="">Select approver...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}{u.designation ? ` — ${u.designation}` : ''}</option>
              ))}
            </select>
            <button type="button" onClick={addWorkflowUser} disabled={!selectedUserId} className="btn-secondary text-sm">
              <Plus size={14} /> Add
            </button>
          </div>
          {workflowUsers.length > 0 && (
            <ol className="space-y-2 mb-4">
              {workflowUsers.map((u, i) => (
                <li key={u.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-2xl text-sm">
                  <span>{i + 1}. {u.name}{u.designation ? ` (${u.designation})` : ''}</span>
                  <button onClick={() => setWorkflowUsers((prev) => prev.filter((w) => w.id !== u.id))} className="text-red-400 text-xs">Remove</button>
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2">
            <button onClick={handleResubmit} disabled={busy || workflowUsers.length === 0} className="btn-primary text-sm">
              <Send size={14} /> Resubmit Memo
            </button>
            <button onClick={() => setShowResubmit(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="card mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Memo Body</h2>
          <div
            className="prose prose-sm max-w-none text-charcoal leading-relaxed prose-table:border-collapse prose-td:border prose-td:border-gray-200 prose-th:border prose-th:border-gray-200 prose-th:bg-gray-50 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1"
            dangerouslySetInnerHTML={{ __html: renderBodyHtml(memo.body) }}
          />
        </div>
      )}

      {canViewVersions && versions.length > 0 && (
        <div className="card mb-4">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-2 text-sm font-semibold text-charcoal w-full"
          >
            <History size={16} /> Version History ({versions.length})
          </button>
          {showVersions && (
            <div className="mt-4 space-y-2">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                  className="w-full text-left p-3 bg-surface-muted rounded-2xl hover:bg-accent/10 transition"
                >
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Version {v.versionNumber}</span>
                    <span className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-1">{v.subject}</p>
                  {selectedVersion?.id === v.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold mb-2">{v.subject}</p>
                      <div
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: renderBodyHtml(v.body) }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {memo.approvals?.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Approval History</h2>
          <div className="space-y-3">
            {memo.approvals.map((a: any) => (
              <div key={a.id} className="flex gap-3 p-3 bg-surface-muted rounded-2xl">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm flex-shrink-0 ${
                  a.action === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                  a.action === 'reject' ? 'bg-red-100 text-red-500' :
                  a.action === 'request_changes' ? 'bg-amber-100 text-amber-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {a.action === 'approve' ? <CheckCircle size={16} /> :
                   a.action === 'reject' ? <XCircle size={16} /> :
                   a.action === 'request_changes' ? <AlertCircle size={16} /> :
                   <Clock size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-sm text-charcoal">{a.user?.name || '—'}</span>
                    <span className="text-xs text-gray-400">{approvalActionLabel[a.action] || a.action}</span>
                    <span className="text-xs text-gray-300">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  {a.comment && <p className="text-sm text-gray-600 mt-1">{a.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {memo.workflowSteps?.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Workflow</h2>
          <div className="flex flex-col gap-3">
            {memo.workflowSteps.map((step: any, i: number) => (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-surface-muted rounded-2xl">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm flex-shrink-0 ${
                  step.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  step.status === 'rejected' ? 'bg-red-100 text-red-500' :
                  step.status === 'pending' ? 'bg-accent/20 text-accent-dark' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.status === 'approved' ? <CheckCircle size={16} /> :
                   step.status === 'rejected' ? <XCircle size={16} /> :
                   step.status === 'pending' ? <Clock size={16} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-charcoal">{step.user?.name || '—'}</span>
                  <span className="text-xs text-gray-400 ml-2 capitalize">{step.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingStep && (
        <div className="card mb-4 border-l-4 border-accent">
          <h2 className="text-lg font-bold text-charcoal mb-1">Your Action Required</h2>
          {memo.canActOnWorkflow && pendingStep.userId !== userId && (
            <p className="text-xs text-accent-dark mb-3">Acting as delegate for {pendingStep.user?.name}</p>
          )}
          <textarea
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            className="input-field mb-3"
            rows={3}
            placeholder="Comment (required for Reject / Request Changes)"
          />
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => runAction(() => workflowAPI.approve(memo.id, actionComment))} className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white">
              <CheckCircle size={14} /> Approve
            </button>
            <button disabled={busy || !actionComment.trim()} onClick={() => runAction(() => workflowAPI.reject(memo.id, actionComment))} className="btn-primary bg-red-500 hover:bg-red-600 text-white">
              <XCircle size={14} /> Reject
            </button>
            <button disabled={busy || !actionComment.trim()} onClick={() => runAction(() => workflowAPI.requestChanges(memo.id, actionComment))} className="btn-secondary">
              Request Changes
            </button>
            <button disabled={busy} onClick={() => runAction(() => workflowAPI.forward(memo.id))} className="btn-dark">
              Forward / Complete Review
            </button>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Attachments</h2>
          <label className="btn-secondary text-sm cursor-pointer py-1.5 px-3">
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-gray-400 mb-2">Max 10 MB · PDF, Word, Excel, images, text</p>
        {memo.attachments?.length === 0 && <p className="text-sm text-gray-400">No attachments.</p>}
        <ul className="space-y-2">
          {memo.attachments?.map((a: any) => (
            <li key={a.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-2xl gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{a.fileName}</p>
                  <p className="text-xs text-gray-400">{(a.fileSize / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => handleDownload(a)} className="text-accent-dark hover:underline text-sm flex items-center gap-1 shrink-0">
                <Download size={14} /> Download
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Comments</h2>
        <ul className="space-y-4 mb-4">
          {(memo.comments || []).map((c: any) => (
            <li key={c.id} className="flex gap-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(c.author?.name)}`}>
                {c.author?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-sm font-medium text-charcoal">{c.author?.name}</p>
                  {c.type && c.type !== 'general' && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${commentTypeClass[c.type] || 'badge-neutral'}`}>
                      {commentTypeLabel[c.type] || c.type}
                    </span>
                  )}
                  <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field flex-1"
            placeholder="Write a comment..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                e.preventDefault();
                runAction(async () => {
                  await commentsAPI.add({ memoId: memo.id, text: comment, type: 'general' });
                  setComment('');
                });
              }
            }}
          />
          <button
            disabled={busy || !comment.trim()}
            onClick={() => runAction(async () => {
              await commentsAPI.add({ memoId: memo.id, text: comment, type: 'general' });
              setComment('');
            })}
            className="btn-primary"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
