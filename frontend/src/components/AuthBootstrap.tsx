import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/auth';

const PUBLIC_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

/** Refreshes user role from server after first paint (non-blocking). Skipped on auth pages. */
export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, user, organization, setAuth } = useAuthStore();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!token || !user || PUBLIC_PATHS.has(pathname)) return;

    const id = window.setTimeout(() => {
      authAPI.me()
        .then((res) => {
          const fresh = res.data.user;
          const freshOrg = res.data.organization;
          if (fresh && organization) {
            setAuth(token, { ...user, ...fresh }, freshOrg || organization);
          }
        })
        .catch(() => {});
    }, 300);
    return () => window.clearTimeout(id);
  }, [pathname, token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
