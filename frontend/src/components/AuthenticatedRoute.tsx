import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

/** Logged-in only — allows pending users (for checkout before approval). */
export default function AuthenticatedRoute() {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
}
