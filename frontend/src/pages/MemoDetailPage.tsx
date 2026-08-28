import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { commentsAPI, memosAPI, workflowAPI, attachmentsAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import {
  ArrowLeft, Download, Upload, FileText, CheckCircle, XCircle,
  Clock, AlertCircle, X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { statusBadgeClass, statusLabel, priorityClass, avatarColor } from '../lib/statusColors';

export default function MemoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userId = user?.id;

  const [memo, setMemo] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!id) return;
    const res = await memosAPI.get(id);
    setMemo(res.data.memo);
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.error || 'Failed to load memo'));
  }, [id]);

  const pendingStep = memo?.workflowSteps?.find(
    (s: any) => s.status === 'pending' && s.userId === userId,
  );

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

  const exportPDF = () => {
    if (!memo) return;
    const doc = new jsPDF();
    let y = 20;

    const line = (text: string, indent = 0, bold = false) => {
      if (bold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');
      doc.setFontSize(bold ? 12 : 10);
      const lines = doc.splitTextToSize(text, 170 - indent);
      doc.text(lines, 20 + indent, y);
      y += lines.length * 6;
    };

    const spacer = (n = 4) => { y += n; };

    doc.setFillColor(28, 28, 30);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('MEMO', 20, 20);
    doc.setFontSize(10);
    doc.text(`Memo No: ${memo.memoNumber}`, 120, 20);
    doc.setTextColor(0, 0, 0);
    y = 40;

    line(`Subject: ${memo.subject}`, 0, true);
    spacer();
    line(`Author: ${memo.author?.name || '—'}`, 0);
    line(`Department: ${memo.department?.name || '—'}`, 0);
    line(`Category: ${memo.category?.name || '—'}`, 0);
    line(`Priority: ${memo.priority?.toUpperCase()}`, 0);
    line(`Status: ${memo.status?.replace(/_/g, ' ').toUpperCase()}`, 0);
    line(`Date: ${memo.createdAt ? new Date(memo.createdAt).toLocaleDateString() : '—'}`, 0);
    spacer(6);
    line('MEMO BODY', 0, true);
    spacer(2);
    line(memo.body || '', 0);
    spacer(6);

    if (memo.workflowSteps?.length > 0) {
      line('WORKFLOW', 0, true);
      spacer(2);
      memo.workflowSteps.forEach((step: any, i: number) => {
        line(`${i + 1}. ${step.user?.name || '—'} — ${step.status.replace(/_/g, ' ')}`, 4);
      });
      spacer(6);
    }

    if (memo.approvals?.length > 0) {
      line('APPROVAL HISTORY', 0, true);
      spacer(2);
      memo.approvals.forEach((a: any) => {
        line(`${a.user?.name || '—'} — ${a.action?.replace(/_/g, ' ')} — ${new Date(a.createdAt).toLocaleString()}`, 4);
        if (a.comment) line(`Comment: ${a.comment}`, 8);
      });
      spacer(6);
    }

    if (memo.comments?.length > 0) {
      line('COMMENTS', 0, true);
      spacer(2);
      memo.comments.forEach((c: any) => {
        line(`${c.author?.name || '—'}: ${c.text}`, 4);
      });
    }

    doc.save(`${memo.memoNumber}.pdf`);
  };

  if (!memo && !error) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Loading memo...</p>
    </div>
  );
  if (!memo) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <div className="slide-up max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
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
          <h1 className="text-2xl font-bold text-charcoal">{memo.subject}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {memo.author?.name} · {memo.department?.name} · {memo.category?.name || 'No category'}
            {memo.createdAt && ` · ${new Date(memo.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        <button onClick={exportPDF} className="btn-secondary text-sm">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 px-5 py-3 rounded-2xl mb-6 text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      <div className="card mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Memo Body</h2>
        <div className="whitespace-pre-wrap text-charcoal leading-relaxed">{memo.body}</div>
      </div>

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
                <div className="flex-1">
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
          <h2 className="text-lg font-bold text-charcoal mb-3">Your Action Required</h2>
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
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Attachments</h2>
          <label className="btn-secondary text-sm cursor-pointer py-1.5 px-3">
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
        {memo.attachments?.length === 0 && <p className="text-sm text-gray-400">No attachments.</p>}
        <ul className="space-y-2">
          {memo.attachments?.map((a: any) => (
            <li key={a.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <FileText size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">{a.fileName}</p>
                  <p className="text-xs text-gray-400">{(a.fileSize / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => handleDownload(a)} className="text-accent-dark hover:underline text-sm flex items-center gap-1">
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
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-charcoal">{c.author?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field flex-1"
            placeholder="Write a comment..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                e.preventDefault();
                runAction(async () => {
                  await commentsAPI.add({ memoId: memo.id, text: comment });
                  setComment('');
                });
              }
            }}
          />
          <button
            disabled={busy || !comment.trim()}
            onClick={() => runAction(async () => {
              await commentsAPI.add({ memoId: memo.id, text: comment });
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
