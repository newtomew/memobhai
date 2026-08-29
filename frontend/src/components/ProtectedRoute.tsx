import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function ProtectedRoute() {
  const { isLoggedIn, isPending } = useAuthStore();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (isPending()) {
    return <Navigate to="/pending" replace />;
  }

  return <Outlet />;
}
