import { create } from 'zustand';
import { supabase } from '../lib/supabase';
export const useAuthStore = create((set, get) => ({
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    organization: localStorage.getItem('organization') ? JSON.parse(localStorage.getItem('organization')) : null,
    session: null,
    setAuth: (token, user, organization) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('organization', JSON.stringify(organization));
        set({ token, user, organization });
    },
    setSession: (session) => {
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
