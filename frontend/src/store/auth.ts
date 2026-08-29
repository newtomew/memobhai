import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  avatarUrl?: string | null;
  designation?: string | null;
  isPlatformAdmin?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status?: string;
  logo?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  organization: Organization | null;
  session: Session | null;
  setAuth: (token: string, user: User, organization: Organization, refreshToken?: string | null) => void;
  setSession: (session: Session | null) => void;
  updateUser: (patch: Partial<User>) => void;
  clearLocalAuth: () => void;
  clearAuth: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
  isOrgAdmin: () => boolean;
  isPlatformAdmin: () => boolean;
  isPending: () => boolean;
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStoredOrganization(): Organization | null {
  try {
    const raw = localStorage.getItem('organization');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** True while an intentional sign-out is in flight — ignore late SIGNED_OUT events. */
let signingOut = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: readStoredUser(),
  organization: readStoredOrganization(),
  session: null,

  setAuth: (token: string, user: User, organization: Organization, refreshToken?: string | null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('organization', JSON.stringify(organization));
    sessionStorage.removeItem('memobhai_auth_refreshed');
    set({ token, user, organization });

    if (isSupabaseConfigured && refreshToken) {
      void supabase.auth.setSession({ access_token: token, refresh_token: refreshToken }).catch(() => {});
    }
  },

  updateUser: (patch: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const user = { ...current, ...patch };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setSession: (session: Session | null) => {
    set({ session });
  },

  /** Clear local session only — no Supabase signOut (safe during login). */
  clearLocalAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    sessionStorage.removeItem('memobhai_auth_refreshed');
    set({ token: null, user: null, organization: null, session: null });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    sessionStorage.removeItem('memobhai_auth_refreshed');
    set({ token: null, user: null, organization: null, session: null });

    if (isSupabaseConfigured) {
      signingOut = true;
      void supabase.auth.signOut().finally(() => {
        signingOut = false;
      });
    }
  },

  isLoggedIn: () => get().token !== null,

  isAdmin: () => get().user?.role === 'admin' && get().user?.status === 'active',

  isOrgAdmin: () => get().user?.role === 'admin',

  isPlatformAdmin: () => Boolean(get().user?.isPlatformAdmin),

  isPending: () =>
    get().user?.status === 'pending' || get().organization?.status === 'pending',
}));

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.getState().setSession(session);
    if (event === 'SIGNED_OUT' && !signingOut && !useAuthStore.getState().token) {
      useAuthStore.getState().clearLocalAuth();
    }
  });
}
