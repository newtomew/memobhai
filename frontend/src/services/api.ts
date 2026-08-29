import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const REQUEST_TIMEOUT_MS = 28_000;

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/org-lookup'];

type AuthTaggedConfig = InternalAxiosRequestConfig & { _authToken?: string | null };

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT_MS,
});

function isPublicAuthRequest(url?: string) {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

// Add token to requests — skip public auth endpoints
api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url)) return config;
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    (config as AuthTaggedConfig)._authToken = token;
  }
  return config;
});

// Handle 401 responses — never hard-redirect during login/register
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url as string | undefined;
    if (status === 401 && !isPublicAuthRequest(requestUrl)) {
      const requestToken = (error.config as AuthTaggedConfig | undefined)?._authToken;
      const currentToken = useAuthStore.getState().token;
      // Ignore stale 401s from requests started before a newer login
      if (requestToken && currentToken && requestToken !== currentToken) {
        return Promise.reject(error);
      }

      const onAuthPage = /^\/(login|register|forgot-password|reset-password)(\/|$)/.test(
        window.location.pathname,
      );
      useAuthStore.getState().clearLocalAuth();
      if (!onAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth endpoints
export const authAPI = {
  register: (data: {
    signupType: 'new_org' | 'join_manager' | 'join_employee';
    organizationName?: string;
    organizationSlug?: string;
    orgSlug?: string;
    email: string;
    password: string;
    name: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  lookupOrg: (slug: string) => api.get('/auth/org-lookup', { params: { slug } }),

  logout: () => {
    useAuthStore.getState().clearAuth();
  },
};

export const delegationsAPI = {
  list: () => api.get('/delegations'),
  create: (data: { delegateId: string; startDate: string; endDate: string; reason?: string }) =>
    api.post('/delegations', data),
  cancel: (id: string) => api.delete(`/delegations?id=${id}`),
};

// Memos endpoints
export const memosAPI = {
  list: (type: 'inbox' | 'sent' = 'inbox', filters?: { priority?: string; status?: string; sort?: string }) =>
    api.get('/memos', { params: { type, ...filters } }),

  get: (id: string) => api.get(`/memos/${id}`),

  create: (data: any) => api.post('/memos', data),

  update: (id: string, data: any) => api.put(`/memos/${id}`, data),

  delete: (id: string) => api.delete(`/memos/${id}`),

  cancel: (id: string) => api.post(`/memos/${id}/cancel`),

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
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const attachmentsAPI = {
  upload: (memoId: string, file: File) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return Promise.reject(new Error('File must be 10 MB or smaller'));
    }
    if (!ALLOWED_ATTACHMENT_MIME.has(file.type)) {
      return Promise.reject(new Error('File type not allowed. Use PDF, images, Office docs, or plain text.'));
    }
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
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

  download: (attachmentId: string) =>
    api.get(`/attachments/download/${attachmentId}`),
};

// Notifications endpoints
export const notificationsAPI = {
  list: (sync = false) => api.get('/notifications', { params: sync ? { sync: '1' } : {} }),

  badge: () => api.get('/notifications', { params: { badge: '1' } }),

  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllRead: () => api.post('/notifications'),
};

// Admin endpoints
export const adminAPI = {
  getOrganization: () => api.get('/admin/organization'),

  createUser: (data: any) => api.post('/admin/users', data),

  listUsers: () => api.get('/admin/users'),

  updateUser: (id: string, data: any) => api.put(`/admin/users?id=${id}`, data),

  getDepartments: () => api.get('/admin/departments'),

  createDepartment: (data: any) => api.post('/admin/departments', data),

  getCategories: () => api.get('/admin/categories'),

  createCategory: (data: any) => api.post('/admin/categories', data),

  getDashboard: () => api.get('/admin/dashboard'),

  updateOrganization: (data: any) => api.put('/admin/organization', data),

  updateDepartment: (id: string, data: any) => api.put(`/admin/departments?id=${id}`, data),

  updateCategory: (id: string, data: any) => api.put(`/admin/categories?id=${id}`, data),

  getAuditLogs: () => api.get('/admin/audit-logs'),

  listTemplates: () => api.get('/admin/templates'),

  createTemplate: (data: any) => api.post('/admin/templates', data),

  updateTemplate: (id: string, data: any) => api.put(`/admin/templates?id=${id}`, data),

  deleteTemplate: (id: string) => api.delete(`/admin/templates?id=${id}`),

  getEmailConfig: () => api.get('/admin/email'),
  registerEmailDomain: () => api.post('/admin/email?action=register'),
  verifyEmailDomain: (domainId: string) => api.post('/admin/email?action=verify', { domainId }),
  sendTestEmail: (to: string) => api.post('/admin/email?action=test', { to }),
};

// Profile
export const profileAPI = {
  uploadAvatar: (fileData: string, mimeType: string) =>
    api.put('/profile', { action: 'avatar', fileData, mimeType }),

  requestOtp: (purpose: 'change_email' | 'change_password', data?: { newEmail?: string; newPassword?: string }) =>
    api.post('/profile', { action: 'request-otp', purpose, ...data }),

  verifyOtp: (purpose: 'change_email' | 'change_password', code: string) =>
    api.post('/profile', { action: 'verify-otp', purpose, code }),

  updateProfile: (data: { name?: string; designation?: string }) =>
    api.put('/profile', { action: 'profile', ...data }),
};

// Messages
export const messagesAPI = {
  list: () => api.get('/messages'),
  unreadCount: () => api.get('/messages', { params: { unread: '1' } }),
  thread: (peerId: string) => api.get('/messages', { params: { peerId } }),
  send: (recipientId: string, body: string) => api.post('/messages', { recipientId, body }),
};

// Join requests
export const joinRequestsAPI = {
  list: () => api.get('/join-requests'),
  approve: (requestId: string) => api.post('/join-requests', { action: 'approve', requestId }),
  reject: (requestId: string, reason?: string) =>
    api.post('/join-requests', { action: 'reject', requestId, reason }),
};

// Platform admin
export const platformAPI = {
  listOrganizations: () => api.get('/platform/organizations'),
  getOrganization: (orgId: string) => api.get('/platform/organizations', { params: { orgId } }),
  ban: (targetType: 'organization' | 'user' | 'memo', targetId: string) =>
    api.post('/platform/ban', { targetType, targetId, action: 'ban' }),
  unban: (targetType: 'organization' | 'user' | 'memo', targetId: string) =>
    api.post('/platform/ban', { targetType, targetId, action: 'unban' }),
};

// Memo versions
export const memoVersionsAPI = {
  list: (memoId: string) => api.get(`/memos/${memoId}/versions`),
};

// Search endpoints
export const searchAPI = {
  search: (q: string, filters?: any) =>
    api.get('/search', { params: { q, ...filters } }),
};

// Dashboard — single combined endpoint (replaces 2-3 separate calls)
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const billingAPI = {
  get: () => api.get('/billing'),
  initiate: (plan: string, cus_phone?: string) =>
    api.post('/billing?action=initiate', { plan, cus_phone }),
  confirm: (paymentId: string) =>
    api.post('/billing?action=confirm', { paymentId }),
};

export default api;
