import { create } from 'zustand';

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
  setAuth: (token: string, user: User, organization: Organization) => void;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: readStoredUser(),
  organization: readStoredOrganization(),

  setAuth: (token: string, user: User, organization: Organization) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('organization', JSON.stringify(organization));
    sessionStorage.removeItem('memobhai_auth_refreshed');
    set({ token, user, organization });
  },

  updateUser: (patch: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const user = { ...current, ...patch };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  clearLocalAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    sessionStorage.removeItem('memobhai_auth_refreshed');
    sessionStorage.removeItem('memobhai_just_logged_in');
    set({ token: null, user: null, organization: null });
  },

  clearAuth: () => {
    get().clearLocalAuth();
  },

  isLoggedIn: () => get().token !== null,

  isAdmin: () => get().user?.role === 'admin' && get().user?.status === 'active',

  isOrgAdmin: () => get().user?.role === 'admin',

  isPlatformAdmin: () => Boolean(get().user?.isPlatformAdmin),

  isPending: () =>
    get().user?.status === 'pending' || get().organization?.status === 'pending',
}));
