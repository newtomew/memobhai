import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
export default function Layout() {
    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex-1 flex flex-col", children: [_jsx(Navbar, {}), _jsx("main", { className: "flex-1 overflow-auto p-8", children: _jsx(Outlet, {}) })] })] }));
}
