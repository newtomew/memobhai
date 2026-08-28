import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { memosAPI } from '../services/api';
export default function InboxPage() {
    const [memos, setMemos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        memosAPI
            .list('inbox')
            .then((res) => setMemos(res.data.memos || []))
            .catch((err) => setError(err.response?.data?.error || 'Failed to load inbox'))
            .finally(() => setLoading(false));
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Inbox" }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [loading && _jsx("p", { className: "text-gray-500", children: "Loading..." }), error && _jsx("p", { className: "text-red-600", children: error }), !loading && !error && memos.length === 0 && (_jsx("p", { className: "text-gray-500", children: "No memos awaiting your action" })), memos.length > 0 && (_jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-sm text-gray-500", children: [_jsx("th", { className: "py-2", children: "Number" }), _jsx("th", { className: "py-2", children: "Subject" }), _jsx("th", { className: "py-2", children: "From" }), _jsx("th", { className: "py-2", children: "Priority" }), _jsx("th", { className: "py-2", children: "Status" })] }) }), _jsx("tbody", { children: memos.map((memo) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "py-3", children: _jsx(Link, { to: `/memos/${memo.id}`, className: "text-blue-600 hover:underline", children: memo.memoNumber }) }), _jsx("td", { children: memo.subject }), _jsx("td", { children: memo.author?.name || '—' }), _jsx("td", { className: "capitalize", children: memo.priority }), _jsx("td", { className: "capitalize", children: memo.status.replaceAll('_', ' ') })] }, memo.id))) })] }))] })] }));
}
