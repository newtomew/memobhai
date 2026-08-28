import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authAPI } from '../services/api';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authAPI.login(email, password);
            const { token, user, organization } = response.data;
            setAuth(token, user, organization);
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-md p-8", children: [_jsx("h1", { className: "text-3xl font-bold text-center mb-8", children: "Memo System" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "you@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "Your password" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50", children: loading ? 'Logging in...' : 'Login' })] }), _jsxs("p", { className: "text-center text-gray-600 mt-6", children: ["Don't have an account?", ' ', _jsx(Link, { to: "/register", className: "text-blue-600 hover:underline", children: "Register" })] })] }) }));
}
