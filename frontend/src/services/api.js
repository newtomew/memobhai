import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add token to requests — uses Supabase session token
api.interceptors.request.use(async (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    else {
        // Fallback: try to get session from Supabase
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
            config.headers.Authorization = `Bearer ${data.session.access_token}`;
        }
    }
    return config;
});
// Handle 401 responses
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
// Auth endpoints
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (email, password) => api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
    logout: () => {
        useAuthStore.getState().clearAuth();
    },
};
// Memos endpoints
export const memosAPI = {
    list: (type = 'inbox') => api.get(`/memos?type=${type}`),
    get: (id) => api.get(`/memos/${id}`),
    create: (data) => api.post('/memos', data),
    update: (id, data) => api.put(`/memos/${id}`, data),
    submit: (id, workflowUserIds) => api.post(`/memos/${id}/submit`, { workflowUserIds }),
    exportPDF: (id) => api.get(`/memos/${id}/export-pdf`),
};
// Workflow endpoints
export const workflowAPI = {
    approve: (memoId, comment) => api.post(`/workflow/${memoId}/approve`, { comment }),
    reject: (memoId, comment) => api.post(`/workflow/${memoId}/reject`, { comment }),
    requestChanges: (memoId, comment) => api.post(`/workflow/${memoId}/request-changes`, { comment }),
    forward: (memoId) => api.post(`/workflow/${memoId}/forward`),
};
// Comments endpoints
export const commentsAPI = {
    add: (data) => api.post('/comments', data),
    get: (memoId) => api.get(`/comments/${memoId}`),
};
// Attachments endpoints
export const attachmentsAPI = {
    upload: (memoId, file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                api
                    .post(`/attachments/${memoId}`, {
                    fileName: file.name,
                    fileData: base64,
                    mimeType: file.type,
                })
                    .then(resolve)
                    .catch(reject);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    download: (attachmentId) => api.get(`/attachments/download/${attachmentId}`),
};
// Notifications endpoints
export const notificationsAPI = {
    list: () => api.get('/notifications'),
    markAsRead: (id) => api.post(`/notifications/${id}/read`),
};
// Admin endpoints
export const adminAPI = {
    getOrganization: () => api.get('/admin/organization'),
    createUser: (data) => api.post('/admin/users', data),
    listUsers: () => api.get('/admin/users'),
    updateUser: (id, data) => api.put(`/admin/users?id=${id}`, data),
    getDepartments: () => api.get('/admin/departments'),
    createDepartment: (data) => api.post('/admin/departments', data),
    getCategories: () => api.get('/admin/categories'),
    createCategory: (data) => api.post('/admin/categories', data),
    getDashboard: () => api.get('/admin/dashboard'),
};
// Profile / password change
export const profileAPI = {
    changePassword: (newPassword) => api.post('/auth/change-password', { newPassword }),
};
// Search endpoints
export const searchAPI = {
    search: (q, filters) => api.get('/search', { params: { q, ...filters } }),
};
export default api;
