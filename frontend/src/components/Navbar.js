import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuthStore } from '../store/auth';
import { LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function Navbar() {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };
    return (_jsxs("div", { className: "bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsx("h1", { className: "text-xl font-bold", children: "Memo System" }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { className: "p-2 hover:bg-gray-100 rounded-lg", children: _jsx(Bell, { size: 20 }) }), _jsxs("div", { className: "flex items-center gap-2 pl-4 border-l", children: [_jsxs("div", { className: "text-right text-sm", children: [_jsx("p", { className: "font-medium", children: user?.name }), _jsx("p", { className: "text-gray-500", children: user?.email })] }), _jsx("button", { onClick: handleLogout, className: "p-2 hover:bg-gray-100 rounded-lg", children: _jsx(LogOut, { size: 20 }) })] })] })] }));
}
