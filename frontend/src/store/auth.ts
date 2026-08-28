import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  organization: Organization | null;
  session: Session | null;
  setAuth: (token: string, user: User, organization: Organization) => void;
  setSession: (session: Session | null) => void;
  clearAuth: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
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

  setSession: (session: Session | null) => {
    set({ session });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    supabase.auth.signOut();
    set({ token: null, user: null, organization: null, session: null });
  },

  isLoggedIn: () => {
    return get().token !== null;
  },

  isAdmin: () => {
    return get().user?.role === 'admin';
  },
}));

// Listen to Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session);
  if (event === 'SIGNED_OUT') {
    useAuthStore.getState().clearAuth();
  }
});
