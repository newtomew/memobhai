import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { LogOut, Bell, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
export default function Navbar() {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const ref = useRef(null);
    const load = () => {
        notificationsAPI.list().then(r => setNotifications(r.data.notifications || [])).catch(() => { });
    };
    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    const unread = notifications.filter(n => !n.read).length;
    const markRead = async (id) => {
        await notificationsAPI.markAsRead(id).catch(() => { });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };
    return (_jsxs("div", { className: "bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsx("h1", { className: "text-lg font-bold text-gray-800", children: "Memo Management System" }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", ref: ref, children: [_jsxs("button", { onClick: () => setShowNotifs(v => !v), className: "relative p-2 hover:bg-gray-100 rounded-lg", children: [_jsx(Bell, { size: 20 }), unread > 0 && (_jsx("span", { className: "absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center", children: unread > 9 ? '9+' : unread }))] }), showNotifs && (_jsxs("div", { className: "absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center px-4 py-3 border-b", children: [_jsx("p", { className: "font-semibold text-sm", children: "Notifications" }), unread > 0 && (_jsxs("span", { className: "text-xs text-blue-600", children: [unread, " unread"] }))] }), notifications.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500 px-4 py-6 text-center", children: "No notifications" })) : (_jsx("ul", { children: notifications.map(n => (_jsxs("li", { onClick: () => markRead(n.id), className: `px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`, children: [_jsx("p", { className: "text-sm", children: n.message }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: new Date(n.createdAt).toLocaleString() })] }, n.id))) }))] }))] }), _jsxs(Link, { to: "/profile", className: "flex items-center gap-2 pl-3 border-l hover:bg-gray-50 rounded-lg px-3 py-1.5", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold", children: user?.name?.[0]?.toUpperCase() || _jsx(User, { size: 14 }) }), _jsxs("div", { className: "text-right text-sm hidden sm:block", children: [_jsx("p", { className: "font-medium leading-tight", children: user?.name }), _jsx("p", { className: "text-gray-400 text-xs", children: user?.role })] })] }), _jsx("button", { onClick: handleLogout, className: "p-2 hover:bg-gray-100 rounded-lg text-gray-500", title: "Logout", children: _jsx(LogOut, { size: 18 }) })] })] }));
}
