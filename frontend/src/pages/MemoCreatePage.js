import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, memosAPI, attachmentsAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { X, Plus, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
export default function MemoCreatePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    // Form state
    const [step, setStep] = useState('details');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState('normal');
    const [departmentId, setDepartmentId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [files, setFiles] = useState([]);
    // Workflow state
    const [orgUsers, setOrgUsers] = useState([]);
    const [workflowUsers, setWorkflowUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    // Reference data
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [draftId, setDraftId] = useState(null);
    useEffect(() => {
        Promise.all([adminAPI.getDepartments(), adminAPI.getCategories(), adminAPI.listUsers()])
            .then(([deptRes, catRes, usersRes]) => {
            setDepartments(deptRes.data.departments || []);
            setCategories(catRes.data.categories || []);
            setOrgUsers(usersRes.data.users || []);
        })
            .catch(() => setError('Failed to load form data'));
    }, []);
    const availableUsers = orgUsers.filter((u) => u.id !== user?.id && !workflowUsers.find((w) => w.id === u.id));
    const addWorkflowUser = () => {
        const found = orgUsers.find((u) => u.id === selectedUserId);
        if (found) {
            setWorkflowUsers((prev) => [...prev, found]);
            setSelectedUserId('');
        }
    };
    const removeWorkflowUser = (id) => {
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
            }
            else {
                await memosAPI.update(id, { subject, body, priority });
            }
            // Upload attachments
            for (const file of files) {
                await attachmentsAPI.upload(id, file);
            }
            setFiles([]);
            return id;
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to save draft');
            return null;
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveDraft = async () => {
        const id = await saveDraft();
        if (id)
            navigate('/my-memos');
    };
    const handleContinue = async () => {
        const id = await saveDraft();
        if (id)
            setStep('workflow');
    };
    const handleSubmit = async () => {
        if (workflowUsers.length === 0) {
            setError('Add at least one workflow participant');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await memosAPI.submit(draftId, workflowUsers.map((u) => u.id));
            navigate(`/memos/${draftId}`);
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to submit memo');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center gap-4 mb-8", children: [_jsx("button", { onClick: () => navigate(-1), className: "text-gray-500 hover:text-gray-700", children: _jsx(ArrowLeft, { size: 20 }) }), _jsx("h1", { className: "text-3xl font-bold", children: "Create Memo" })] }), _jsx("div", { className: "flex gap-4 mb-8", children: ['details', 'workflow'].map((s, i) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? 'bg-blue-600 text-white' : draftId ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`, children: i + 1 }), _jsx("span", { className: `text-sm ${step === s ? 'font-semibold' : 'text-gray-500'}`, children: s === 'details' ? 'Memo Details' : 'Workflow' }), i < 1 && _jsx("div", { className: "w-12 h-px bg-gray-300 mx-2" })] }, s))) }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6", children: error })), step === 'details' && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Department *" }), _jsxs("select", { value: departmentId, onChange: (e) => setDepartmentId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "Select department" }), departments.map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Category" }), _jsxs("select", { value: categoryId, onChange: (e) => setCategoryId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "Select category" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Priority *" }), _jsx("div", { className: "flex gap-3", children: ['normal', 'high', 'urgent'].map((p) => (_jsx("button", { onClick: () => setPriority(p), className: `px-4 py-2 rounded-lg text-sm font-medium capitalize border ${priority === p
                                        ? p === 'urgent'
                                            ? 'bg-red-600 text-white border-red-600'
                                            : p === 'high'
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`, children: p }, p))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Subject *" }), _jsx("input", { type: "text", value: subject, onChange: (e) => setSubject(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "Brief subject of the memo" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Body *" }), _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg h-64 resize-none", placeholder: "Write the memo content here..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Attachments" }), _jsxs("label", { className: "flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 w-fit", children: [_jsx(Upload, { size: 16, className: "text-gray-400" }), _jsx("span", { className: "text-sm text-gray-500", children: "Attach files" }), _jsx("input", { type: "file", multiple: true, className: "hidden", onChange: (e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]) })] }), files.length > 0 && (_jsx("ul", { className: "mt-2 space-y-1", children: files.map((f, i) => (_jsxs("li", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx("span", { children: f.name }), _jsxs("span", { className: "text-gray-400", children: ["(", (f.size / 1024).toFixed(1), " KB)"] }), _jsx("button", { onClick: () => setFiles((prev) => prev.filter((_, idx) => idx !== i)), children: _jsx(X, { size: 14, className: "text-red-400" }) })] }, i))) }))] }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx("button", { disabled: loading, onClick: handleSaveDraft, className: "px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50", children: "Save as Draft" }), _jsxs("button", { disabled: loading, onClick: handleContinue, className: "flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: ["Continue to Workflow ", _jsx(ArrowRight, { size: 16 })] })] })] })), step === 'workflow' && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-1", children: "Define Approval Workflow" }), _jsx("p", { className: "text-sm text-gray-500", children: "Add participants in order. The memo will move sequentially through each person." })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: selectedUserId, onChange: (e) => setSelectedUserId(e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "Select a participant..." }), availableUsers.map((u) => (_jsxs("option", { value: u.id, children: [u.name, " \u2014 ", u.department?.name || 'No dept', " (", u.role, ")"] }, u.id)))] }), _jsxs("button", { onClick: addWorkflowUser, disabled: !selectedUserId, className: "flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: [_jsx(Plus, { size: 16 }), " Add"] })] }), workflowUsers.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-2", children: "Workflow sequence:" }), _jsx("ol", { className: "space-y-2", children: workflowUsers.map((u, i) => (_jsxs("li", { className: "flex items-center gap-3 p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold", children: i + 1 }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: u.name }), _jsx("p", { className: "text-xs text-gray-500", children: u.department?.name })] }), _jsx("button", { onClick: () => removeWorkflowUser(u.id), className: "text-gray-400 hover:text-red-500", children: _jsx(X, { size: 16 }) })] }, u.id))) })] })), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsxs("button", { onClick: () => setStep('details'), className: "flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200", children: [_jsx(ArrowLeft, { size: 16 }), " Back"] }), _jsx("button", { disabled: loading || workflowUsers.length === 0, onClick: handleSubmit, className: "px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50", children: loading ? 'Submitting...' : 'Submit Memo' })] })] }))] }));
}
