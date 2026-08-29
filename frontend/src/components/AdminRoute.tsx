import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function AdminRoute() {
  const { isLoggedIn, isAdmin, isPlatformAdmin } = useAuthStore();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin() && !isPlatformAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
