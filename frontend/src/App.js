import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import MyMemosPage from './pages/MyMemosPage';
import MemoDetailPage from './pages/MemoDetailPage';
import MemoCreatePage from './pages/MemoCreatePage';
import AdminPage from './pages/AdminPage';
import CompletedMemosPage from './pages/CompletedMemosPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
export default function App() {
    const { token } = useAuthStore();
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { element: _jsx(Layout, {}), children: [_jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/inbox", element: _jsx(InboxPage, {}) }), _jsx(Route, { path: "/my-memos", element: _jsx(MyMemosPage, {}) }), _jsx(Route, { path: "/completed", element: _jsx(CompletedMemosPage, {}) }), _jsx(Route, { path: "/search", element: _jsx(SearchPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "/memos/create", element: _jsx(MemoCreatePage, {}) }), _jsx(Route, { path: "/memos/:id", element: _jsx(MemoDetailPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminPage, {}) })] }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: token ? '/dashboard' : '/login' }) })] }) }));
}
