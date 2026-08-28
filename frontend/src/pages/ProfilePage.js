import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { User, Lock, Check } from 'lucide-react';
export default function ProfilePage() {
    const { user, organization } = useAuthStore();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const { error: err } = await supabase.auth.updateUser({ password: newPassword });
            if (err)
                throw err;
            setSuccess('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
        }
        catch (err) {
            setError(err.message || 'Failed to update password');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "max-w-2xl", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "My Profile" }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold", children: user?.name?.[0]?.toUpperCase() || _jsx(User, { size: 24 }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: user?.name }), _jsx("p", { className: "text-gray-500", children: user?.email }), _jsx("span", { className: `mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`, children: user?.role })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-3", children: [_jsx("p", { className: "text-gray-500 text-xs mb-0.5", children: "Organization" }), _jsx("p", { className: "font-medium", children: organization?.name || '—' })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-3", children: [_jsx("p", { className: "text-gray-500 text-xs mb-0.5", children: "Org Identifier" }), _jsx("p", { className: "font-medium", children: organization?.slug || '—' })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Lock, { size: 18, className: "text-gray-500" }), _jsx("h2", { className: "text-lg font-semibold", children: "Change Password" })] }), success && (_jsxs("div", { className: "flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4", children: [_jsx(Check, { size: 16 }), success] })), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4", children: error })), _jsxs("form", { onSubmit: handleChangePassword, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "New password" }), _jsx("input", { type: "password", value: newPassword, onChange: e => setNewPassword(e.target.value), placeholder: "Minimum 8 characters", className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Confirm new password" }), _jsx("input", { type: "password", value: confirmPassword, onChange: e => setConfirmPassword(e.target.value), placeholder: "Repeat your new password", className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsx("button", { type: "submit", disabled: saving || !newPassword, className: "px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: saving ? 'Saving...' : 'Update Password' })] })] })] }));
}
