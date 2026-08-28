import axios from 'axios';
import { useAuthStore } from '../store/auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add token to requests
api.interceptors.request.use((config) => {
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/attachments/${memoId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    download: (attachmentId) => api.get(`/attachments/${attachmentId}`),
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
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    createDepartment: (data) => api.post('/admin/departments', data),
    getCategories: () => api.get('/admin/categories'),
    getDashboard: () => api.get('/admin/dashboard'),
};
// Search endpoints
export const searchAPI = {
    search: (q, filters) => api.get('/search', { params: { q, ...filters } }),
};
export default api;
