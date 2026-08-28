import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { commentsAPI, memosAPI, workflowAPI, attachmentsAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { ArrowLeft, Download, Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, X, } from 'lucide-react';
import jsPDF from 'jspdf';
const statusColor = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    pending_approval: 'bg-orange-100 text-orange-700',
    changes_requested: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
};
const priorityColor = {
    normal: 'text-gray-500',
    high: 'text-orange-500',
    urgent: 'text-red-600 font-semibold',
};
export default function MemoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?.id;
    const [memo, setMemo] = useState(null);
    const [comment, setComment] = useState('');
    const [actionComment, setActionComment] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const load = async () => {
        if (!id)
            return;
        const res = await memosAPI.get(id);
        setMemo(res.data.memo);
    };
    useEffect(() => {
        load().catch((err) => setError(err.response?.data?.error || 'Failed to load memo'));
    }, [id]);
    const pendingStep = memo?.workflowSteps?.find((s) => s.status === 'pending' && s.userId === userId);
    const runAction = async (fn) => {
        setBusy(true);
        setError('');
        try {
            await fn();
            await load();
            setActionComment('');
        }
        catch (err) {
            setError(err.response?.data?.error || 'Action failed');
        }
        finally {
            setBusy(false);
        }
    };
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !id)
            return;
        setUploading(true);
        try {
            await attachmentsAPI.upload(id, file);
            await load();
        }
        catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        }
        finally {
            setUploading(false);
        }
    };
    const handleDownload = async (attachment) => {
        try {
            const res = await attachmentsAPI.download(attachment.id);
            const signedUrl = res.data.url;
            if (signedUrl) {
                window.open(signedUrl, '_blank');
            }
        }
        catch {
            setError('Failed to download file');
        }
    };
    const exportPDF = () => {
        if (!memo)
            return;
        const doc = new jsPDF();
        let y = 20;
        const line = (text, indent = 0, bold = false) => {
            if (bold)
                doc.setFont('helvetica', 'bold');
            else
                doc.setFont('helvetica', 'normal');
            doc.setFontSize(bold ? 12 : 10);
            const lines = doc.splitTextToSize(text, 170 - indent);
            doc.text(lines, 20 + indent, y);
            y += lines.length * 6;
        };
        const spacer = (n = 4) => { y += n; };
        // Header
        doc.setFillColor(37, 99, 235);
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
        // Workflow
        if (memo.workflowSteps?.length > 0) {
            line('WORKFLOW', 0, true);
            spacer(2);
            memo.workflowSteps.forEach((step, i) => {
                line(`${i + 1}. ${step.user?.name || '—'} — ${step.status.replace(/_/g, ' ')}`, 4);
            });
            spacer(6);
        }
        // Approvals
        if (memo.approvals?.length > 0) {
            line('APPROVAL HISTORY', 0, true);
            spacer(2);
            memo.approvals.forEach((a) => {
                line(`${a.user?.name || '—'} — ${a.action?.replace(/_/g, ' ')} — ${new Date(a.createdAt).toLocaleString()}`, 4);
                if (a.comment)
                    line(`Comment: ${a.comment}`, 8);
            });
            spacer(6);
        }
        // Comments
        if (memo.comments?.length > 0) {
            line('COMMENTS', 0, true);
            spacer(2);
            memo.comments.forEach((c) => {
                line(`${c.author?.name || '—'}: ${c.text}`, 4);
            });
        }
        doc.save(`${memo.memoNumber}.pdf`);
    };
    if (!memo && !error)
        return (_jsx("div", { className: "flex items-center justify-center h-48", children: _jsx("p", { className: "text-gray-400", children: "Loading memo..." }) }));
    if (!memo)
        return _jsx("p", { className: "text-red-600", children: error });
    const isAuthor = memo.authorId === userId;
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-start mb-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("button", { onClick: () => navigate(-1), className: "text-gray-400 hover:text-gray-600", children: _jsx(ArrowLeft, { size: 18 }) }), _jsx("span", { className: "text-sm text-gray-500 font-mono", children: memo.memoNumber }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[memo.status] || 'bg-gray-100 text-gray-600'}`, children: memo.status.replace(/_/g, ' ') }), _jsxs("span", { className: `text-xs font-medium capitalize ${priorityColor[memo.priority] || ''}`, children: [memo.priority === 'urgent' && _jsx(AlertCircle, { size: 12, className: "inline mr-1" }), memo.priority] })] }), _jsx("h1", { className: "text-2xl font-bold", children: memo.subject }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [memo.author?.name, " \u00B7 ", memo.department?.name, " \u00B7 ", memo.category?.name || 'No category', memo.createdAt && ` · ${new Date(memo.createdAt).toLocaleDateString()}`] })] }), _jsxs("button", { onClick: exportPDF, className: "flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50", children: [_jsx(Download, { size: 16 }), "Export PDF"] })] }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6 flex justify-between", children: [error, _jsx("button", { onClick: () => setError(''), children: _jsx(X, { size: 16 }) })] })), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3", children: "Memo Body" }), _jsx("div", { className: "whitespace-pre-wrap text-gray-800 leading-relaxed", children: memo.body })] }), memo.workflowSteps?.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4", children: "Workflow" }), _jsx("div", { className: "flex flex-col gap-2", children: memo.workflowSteps.map((step, i) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${step.status === 'approved' ? 'bg-green-100 text-green-600' :
                                        step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                            step.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-100 text-gray-400'}`, children: step.status === 'approved' ? _jsx(CheckCircle, { size: 16 }) :
                                        step.status === 'rejected' ? _jsx(XCircle, { size: 16 }) :
                                            step.status === 'pending' ? _jsx(Clock, { size: 16 }) : i + 1 }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "font-medium text-sm", children: step.user?.name || '—' }), _jsx("span", { className: "text-xs text-gray-400 ml-2 capitalize", children: step.status.replace(/_/g, ' ') })] })] }, step.id))) })] })), pendingStep && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-4 border-l-4 border-blue-500", children: [_jsx("h2", { className: "text-lg font-bold mb-3", children: "Your Action Required" }), _jsx("textarea", { value: actionComment, onChange: (e) => setActionComment(e.target.value), className: "w-full px-3 py-2 border rounded-lg mb-3 text-sm", rows: 3, placeholder: "Comment (required for Reject / Request Changes)" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { disabled: busy, onClick: () => runAction(() => workflowAPI.approve(memo.id, actionComment)), className: "flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-green-700", children: [_jsx(CheckCircle, { size: 14 }), " Approve"] }), _jsxs("button", { disabled: busy || !actionComment.trim(), onClick: () => runAction(() => workflowAPI.reject(memo.id, actionComment)), className: "flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-red-700", children: [_jsx(XCircle, { size: 14 }), " Reject"] }), _jsx("button", { disabled: busy || !actionComment.trim(), onClick: () => runAction(() => workflowAPI.requestChanges(memo.id, actionComment)), className: "px-4 py-2 bg-amber-500 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-amber-600", children: "Request Changes" }), _jsx("button", { disabled: busy, onClick: () => runAction(() => workflowAPI.forward(memo.id)), className: "px-4 py-2 bg-gray-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700", children: "Forward / Complete Review" })] })] })), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide", children: "Attachments" }), _jsxs("label", { className: "flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg cursor-pointer hover:bg-gray-50", children: [_jsx(Upload, { size: 14 }), uploading ? 'Uploading...' : 'Upload', _jsx("input", { type: "file", className: "hidden", onChange: handleFileUpload, disabled: uploading })] })] }), memo.attachments?.length === 0 && _jsx("p", { className: "text-sm text-gray-400", children: "No attachments." }), _jsx("ul", { className: "space-y-2", children: memo.attachments?.map((a) => (_jsxs("li", { className: "flex items-center justify-between p-2 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { size: 16, className: "text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: a.fileName }), _jsxs("p", { className: "text-xs text-gray-400", children: [(a.fileSize / 1024).toFixed(1), " KB"] })] })] }), _jsxs("button", { onClick: () => handleDownload(a), className: "text-blue-600 hover:underline text-sm flex items-center gap-1", children: [_jsx(Download, { size: 14 }), " Download"] })] }, a.id))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4", children: "Comments" }), _jsx("ul", { className: "space-y-3 mb-4", children: (memo.comments || []).map((c) => (_jsxs("li", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold flex-shrink-0", children: c.author?.name?.[0]?.toUpperCase() || '?' }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx("p", { className: "text-sm font-medium", children: c.author?.name }), _jsx("p", { className: "text-xs text-gray-400", children: new Date(c.createdAt).toLocaleString() })] }), _jsx("p", { className: "text-sm text-gray-700 mt-0.5", children: c.text })] })] }, c.id))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: comment, onChange: (e) => setComment(e.target.value), className: "flex-1 px-3 py-2 border rounded-lg text-sm", placeholder: "Write a comment...", onKeyDown: (e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                                        e.preventDefault();
                                        runAction(async () => {
                                            await commentsAPI.add({ memoId: memo.id, text: comment });
                                            setComment('');
                                        });
                                    }
                                } }), _jsx("button", { disabled: busy || !comment.trim(), onClick: () => runAction(async () => {
                                    await commentsAPI.add({ memoId: memo.id, text: comment });
                                    setComment('');
                                }), className: "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700", children: "Post" })] })] })] }));
}
