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
  } else {
    // Fallback: try to get session from Supabase
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth endpoints
export const authAPI = {
  register: (data: {
    organizationName: string;
    organizationSlug: string;
    email: string;
    password: string;
    name: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  logout: () => {
    useAuthStore.getState().clearAuth();
  },
};

// Memos endpoints
export const memosAPI = {
  list: (type: 'inbox' | 'sent' = 'inbox') =>
    api.get(`/memos?type=${type}`),

  get: (id: string) => api.get(`/memos/${id}`),

  create: (data: any) => api.post('/memos', data),

  update: (id: string, data: any) => api.put(`/memos/${id}`, data),

  submit: (id: string, workflowUserIds: string[]) =>
    api.post(`/memos/${id}/submit`, { workflowUserIds }),

  exportPDF: (id: string) => api.get(`/memos/${id}/export-pdf`),
};

// Workflow endpoints
export const workflowAPI = {
  approve: (memoId: string, comment?: string) =>
    api.post(`/workflow/${memoId}/approve`, { comment }),

  reject: (memoId: string, comment: string) =>
    api.post(`/workflow/${memoId}/reject`, { comment }),

  requestChanges: (memoId: string, comment: string) =>
    api.post(`/workflow/${memoId}/request-changes`, { comment }),

  forward: (memoId: string) =>
    api.post(`/workflow/${memoId}/forward`),
};

// Comments endpoints
export const commentsAPI = {
  add: (data: any) => api.post('/comments', data),

  get: (memoId: string) => api.get(`/comments/${memoId}`),
};

// Attachments endpoints
export const attachmentsAPI = {
  upload: (memoId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/attachments/${memoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  download: (attachmentId: string) =>
    api.get(`/attachments/${attachmentId}`),
};

// Notifications endpoints
export const notificationsAPI = {
  list: () => api.get('/notifications'),

  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
};

// Admin endpoints
export const adminAPI = {
  getOrganization: () => api.get('/admin/organization'),

  createUser: (data: any) => api.post('/admin/users', data),

  listUsers: () => api.get('/admin/users'),

  updateUser: (id: string, data: any) => api.put(`/admin/users?id=${id}`, data),

  createDepartment: (data: any) => api.post('/admin/departments', data),

  getCategories: () => api.get('/admin/categories'),

  getDashboard: () => api.get('/admin/dashboard'),
};

// Search endpoints
export const searchAPI = {
  search: (q: string, filters?: any) =>
    api.get('/search', { params: { q, ...filters } }),
};

export default api;
