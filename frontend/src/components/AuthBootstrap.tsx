import { useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/auth';

const SESSION_KEY = 'memobhai_auth_refreshed';

/** Refreshes user role from server once per browser session (non-blocking). */
export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, user, organization, setAuth } = useAuthStore();

  useEffect(() => {
    if (!token || !user) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const id = window.setTimeout(() => {
      authAPI.me()
        .then((res) => {
          const fresh = res.data.user;
          const freshOrg = res.data.organization;
          if (fresh && organization) {
            setAuth(token, { ...user, ...fresh }, freshOrg || organization);
          }
          sessionStorage.setItem(SESSION_KEY, '1');
        })
        .catch(() => {});
    }, 500);
    return () => window.clearTimeout(id);
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
