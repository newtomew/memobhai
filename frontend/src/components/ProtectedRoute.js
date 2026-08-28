import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
export default function ProtectedRoute() {
    const { isLoggedIn } = useAuthStore();
    if (!isLoggedIn()) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(Outlet, {});
}
