import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';
import { CheckCircle } from 'lucide-react';
export default function CompletedMemosPage() {
    const [memos, setMemos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        memosAPI
            .list('sent')
            .then((res) => {
            const all = res.data.memos || [];
            setMemos(all.filter((m) => ['approved', 'rejected', 'cancelled'].includes(m.status)));
        })
            .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
            .finally(() => setLoading(false));
    }, []);
    const statusColor = (s) => {
        if (s === 'approved')
            return 'bg-green-100 text-green-700';
        if (s === 'rejected')
            return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-8", children: [_jsx(CheckCircle, { className: "text-green-500", size: 28 }), _jsx("h1", { className: "text-3xl font-bold", children: "Completed Memos" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [loading && _jsx("p", { className: "text-gray-500", children: "Loading..." }), error && _jsx("p", { className: "text-red-600", children: error }), !loading && !error && memos.length === 0 && (_jsx("p", { className: "text-gray-500", children: "No completed memos yet." })), memos.length > 0 && (_jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-gray-500", children: [_jsx("th", { className: "py-2 pr-4", children: "Number" }), _jsx("th", { className: "py-2 pr-4", children: "Subject" }), _jsx("th", { className: "py-2 pr-4", children: "Department" }), _jsx("th", { className: "py-2 pr-4", children: "Priority" }), _jsx("th", { className: "py-2 pr-4", children: "Status" }), _jsx("th", { className: "py-2", children: "Date" })] }) }), _jsx("tbody", { children: memos.map((memo) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "py-3 pr-4", children: _jsx(Link, { to: `/memos/${memo.id}`, className: "text-blue-600 hover:underline font-medium", children: memo.memoNumber }) }), _jsx("td", { className: "py-3 pr-4", children: memo.subject }), _jsx("td", { className: "py-3 pr-4", children: memo.department?.name || '—' }), _jsx("td", { className: "py-3 pr-4 capitalize", children: memo.priority }), _jsx("td", { className: "py-3 pr-4", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(memo.status)}`, children: memo.status }) }), _jsx("td", { className: "py-3 text-gray-500", children: memo.createdAt ? new Date(memo.createdAt).toLocaleDateString() : '—' })] }, memo.id))) })] }))] })] }));
}
