import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { adminAPI, memosAPI } from '../services/api';
export default function DashboardPage() {
    const { user } = useAuthStore();
    const { isAdmin } = useAuthStore();
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
    });
    const [recent, setRecent] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        const load = async () => {
            try {
                const [inboxRes, sentRes] = await Promise.all([
                    memosAPI.list('inbox'),
                    memosAPI.list('sent'),
                ]);
                const inbox = inboxRes.data.memos || [];
                const sent = sentRes.data.memos || [];
                const all = [...inbox, ...sent];
                setStats({
                    pending: inbox.length,
                    inProgress: sent.filter((m) => ['submitted', 'pending_review', 'pending_approval'].includes(m.status)).length,
                    completed: sent.filter((m) => m.status === 'approved').length,
                    rejected: sent.filter((m) => m.status === 'rejected').length,
                });
                setRecent(all.slice(0, 8));
                if (isAdmin()) {
                    const dash = await adminAPI.getDashboard();
                    const s = dash.data.stats || {};
                    setStats((prev) => ({
                        pending: s.pendingMemos ?? prev.pending,
                        inProgress: prev.inProgress,
                        completed: s.approvedMemos ?? prev.completed,
                        rejected: s.rejectedMemos ?? prev.rejected,
                    }));
                }
            }
            catch (err) {
                setError(err.response?.data?.error || 'Failed to load dashboard');
            }
        };
        load();
    }, [isAdmin]);
    return (_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold mb-8", children: ["Welcome, ", user?.name, "!"] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-8", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("p", { className: "text-gray-600 text-sm", children: "Pending Approvals" }), _jsx("p", { className: "text-3xl font-bold", children: stats.pending })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("p", { className: "text-gray-600 text-sm", children: "In Progress" }), _jsx("p", { className: "text-3xl font-bold", children: stats.inProgress })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("p", { className: "text-gray-600 text-sm", children: "Completed" }), _jsx("p", { className: "text-3xl font-bold", children: stats.completed })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("p", { className: "text-gray-600 text-sm", children: "Rejected" }), _jsx("p", { className: "text-3xl font-bold", children: stats.rejected })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Recent Activity" }), recent.length === 0 ? (_jsx("p", { className: "text-gray-500", children: "No recent activity" })) : (_jsx("ul", { className: "divide-y", children: recent.map((memo) => (_jsxs("li", { className: "py-3", children: [_jsxs(Link, { to: `/memos/${memo.id}`, className: "text-blue-600 hover:underline font-medium", children: [memo.memoNumber, ": ", memo.subject] }), _jsx("p", { className: "text-sm text-gray-500 capitalize", children: memo.status.replaceAll('_', ' ') })] }, memo.id))) }))] })] }));
}
