import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { Search } from 'lucide-react';
const STATUSES = ['', 'draft', 'submitted', 'pending_review', 'pending_approval', 'changes_requested', 'rejected', 'approved', 'cancelled'];
const PRIORITIES = ['', 'normal', 'high', 'urgent'];
export default function SearchPage() {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await searchAPI.search(q, {
                ...(status && { status }),
                ...(priority && { priority }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });
            setResults(res.data.results || []);
            setSearched(true);
        }
        catch (err) {
            setError(err.response?.data?.error || 'Search failed');
        }
        finally {
            setLoading(false);
        }
    };
    const statusColor = (s) => {
        if (s === 'approved')
            return 'bg-green-100 text-green-700';
        if (s === 'rejected')
            return 'bg-red-100 text-red-700';
        if (s === 'draft')
            return 'bg-gray-100 text-gray-600';
        return 'bg-blue-100 text-blue-700';
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-8", children: [_jsx(Search, { className: "text-gray-500", size: 26 }), _jsx("h1", { className: "text-3xl font-bold", children: "Search Memos" })] }), _jsxs("form", { onSubmit: handleSearch, className: "bg-white rounded-lg shadow p-6 mb-6 space-y-4", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("input", { value: q, onChange: e => setQ(e.target.value), placeholder: "Search by subject, body, or memo number...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg" }), _jsxs("button", { type: "submit", disabled: loading, className: "flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: [_jsx(Search, { size: 16 }), loading ? 'Searching...' : 'Search'] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "Status" }), _jsx("select", { value: status, onChange: e => setStatus(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm", children: STATUSES.map(s => _jsx("option", { value: s, children: s ? s.replace(/_/g, ' ') : 'All statuses' }, s)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "Priority" }), _jsx("select", { value: priority, onChange: e => setPriority(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm", children: PRIORITIES.map(p => _jsx("option", { value: p, children: p || 'All priorities' }, p)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "From date" }), _jsx("input", { type: "date", value: startDate, onChange: e => setStartDate(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "To date" }), _jsx("input", { type: "date", value: endDate, onChange: e => setEndDate(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm" })] })] })] }), error && _jsx("div", { className: "text-red-600 mb-4", children: error }), searched && (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("p", { className: "text-sm text-gray-500 mb-4", children: [results.length, " result", results.length !== 1 ? 's' : '', " found"] }), results.length === 0 ? (_jsx("p", { className: "text-gray-500", children: "No memos matched your search." })) : (_jsxs("table", { className: "w-full text-sm text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-gray-500", children: [_jsx("th", { className: "py-2 pr-4", children: "Number" }), _jsx("th", { className: "py-2 pr-4", children: "Subject" }), _jsx("th", { className: "py-2 pr-4", children: "Author" }), _jsx("th", { className: "py-2 pr-4", children: "Department" }), _jsx("th", { className: "py-2 pr-4", children: "Priority" }), _jsx("th", { className: "py-2", children: "Status" })] }) }), _jsx("tbody", { children: results.map((m) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "py-3 pr-4", children: _jsx(Link, { to: `/memos/${m.id}`, className: "text-blue-600 hover:underline font-medium", children: m.memoNumber }) }), _jsx("td", { className: "py-3 pr-4", children: m.subject }), _jsx("td", { className: "py-3 pr-4", children: m.author?.name || '—' }), _jsx("td", { className: "py-3 pr-4", children: m.department?.name || '—' }), _jsx("td", { className: "py-3 pr-4 capitalize", children: m.priority }), _jsx("td", { className: "py-3", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(m.status)}`, children: m.status.replace(/_/g, ' ') }) })] }, m.id))) })] }))] }))] }));
}
