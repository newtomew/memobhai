import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function PlatformRoute() {
  const { isLoggedIn, isPlatformAdmin } = useAuthStore();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (!isPlatformAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
