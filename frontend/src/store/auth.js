import { create } from 'zustand';
export const useAuthStore = create((set, get) => ({
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    organization: localStorage.getItem('organization') ? JSON.parse(localStorage.getItem('organization')) : null,
    setAuth: (token, user, organization) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('organization', JSON.stringify(organization));
        set({ token, user, organization });
    },
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        set({ token: null, user: null, organization: null });
    },
    isLoggedIn: () => {
        return get().token !== null;
    },
    isAdmin: () => {
        return get().user?.role === 'admin';
    },
}));
