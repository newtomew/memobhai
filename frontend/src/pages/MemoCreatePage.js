import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function MemoCreatePage() {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Create Memo" }), _jsx("div", { className: "bg-white rounded-lg shadow p-6 max-w-4xl", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Subject" }), _jsx("input", { type: "text", value: subject, onChange: (e) => setSubject(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg", placeholder: "Memo subject" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Content" }), _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg h-64", placeholder: "Memo content" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { className: "px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300", children: "Save as Draft" }), _jsx("button", { className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Continue to Workflow" })] })] }) })] }));
}
