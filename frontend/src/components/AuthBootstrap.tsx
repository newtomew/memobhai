import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/auth';

const SESSION_KEY = 'memobhai_auth_refreshed';
const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

/** Refreshes user role from server once per browser session (non-blocking). */
export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { token, user, organization, setAuth } = useAuthStore();
  const started = useRef(false);

  useEffect(() => {
    if (!token || !user) return;
    if (AUTH_PATHS.has(location.pathname)) return;
    if (sessionStorage.getItem('memobhai_just_logged_in')) {
      sessionStorage.removeItem('memobhai_just_logged_in');
      sessionStorage.setItem(SESSION_KEY, '1');
      return;
    }
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (started.current) return;
    started.current = true;

    const id = window.setTimeout(() => {
      authAPI.me()
        .then((res) => {
          const fresh = res.data.user;
          const freshOrg = res.data.organization;
          const current = useAuthStore.getState();
          if (!fresh || !current.token || current.user?.id !== user.id) return;
          if (
            fresh.role === current.user?.role &&
            fresh.status === current.user?.status &&
            fresh.isPlatformAdmin === current.user?.isPlatformAdmin &&
            freshOrg?.status === current.organization?.status
          ) {
            sessionStorage.setItem(SESSION_KEY, '1');
            return;
          }
          setAuth(current.token, { ...current.user!, ...fresh }, freshOrg || organization);
          sessionStorage.setItem(SESSION_KEY, '1');
        })
        .catch(() => {
          started.current = false;
        });
    }, 800);

    return () => window.clearTimeout(id);
  }, [token, user?.id, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
