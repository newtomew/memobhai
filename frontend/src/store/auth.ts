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
  setAuth: (token: string, user: User, organization: Organization) => void;
  setSession: (session: Session | null) => void;
  updateUser: (patch: Partial<User>) => void;
  clearAuth: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
  isOrgAdmin: () => boolean;
  isPlatformAdmin: () => boolean;
  isPending: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  organization: localStorage.getItem('organization') ? JSON.parse(localStorage.getItem('organization')!) : null,
  session: null,

  setAuth: (token: string, user: User, organization: Organization) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('organization', JSON.stringify(organization));
    set({ token, user, organization });
  },

  updateUser: (patch: Partial<User>) => {
    const user = { ...get().user!, ...patch };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setSession: (session: Session | null) => {
    set({ session });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    sessionStorage.removeItem('memobhai_auth_refreshed');
    if (isSupabaseConfigured) {
      supabase.auth.signOut();
    }
    set({ token: null, user: null, organization: null, session: null });
  },

  isLoggedIn: () => get().token !== null,

  isAdmin: () => get().user?.role === 'admin' && get().user?.status === 'active',

  /** Org admin by role only — includes pending founders who can still purchase plans. */
  isOrgAdmin: () => get().user?.role === 'admin',

  isPlatformAdmin: () => Boolean(get().user?.isPlatformAdmin),

  isPending: () =>
    get().user?.status === 'pending' || get().organization?.status === 'pending',
}));

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.getState().setSession(session);
    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().clearAuth();
    }
  });
}
