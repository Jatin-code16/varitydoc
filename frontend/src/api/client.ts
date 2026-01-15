import axios from 'axios';
import type { AuthResponse, User, Document, DocumentVerificationResult, AuditLog, Alert } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    } catch {
      // Invalid auth data, ignore
    }
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const { data } = await api.post<AuthResponse>('/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },
  forgotPassword: async (username: string) => {
    const { data } = await api.post('/auth/forgot-password', { username });
    return data;
  },

  resetPassword: async (username: string, token: string, newPassword: string) => {
    const { data } = await api.post('/auth/reset-password', {
      username,
      token,
      new_password: newPassword,
    });
    return data;
  },
  register: async (username: string, email: string, password: string): Promise<User> => {
    const { data } = await api.post<User>('/register', { username, email, password });
    return data;
  },

  getCurrentUser: (): User | null => {
    const authData = localStorage.getItem('auth');
    if (!authData) return null;
    
    try {
      const parsed = JSON.parse(authData);
      return {
        username: parsed.username,
        email: parsed.email,
        role: parsed.role || 'guest',
      };
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('auth');
  },
};

export const documentAPI = {
  register: async (file: File, name: string, description?: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);

    const { data } = await api.post<Document>('/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  verify: async (file: File): Promise<DocumentVerificationResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data} = await api.post<DocumentVerificationResult>('/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  list: async (): Promise<Document[]> => {
    const { data } = await api.get<Document[]>('/documents');
    return data;
  },

  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },
};

export const auditAPI = {
  getLogs: async (): Promise<AuditLog[]> => {
    const { data } = await api.get<{ audit_logs: AuditLog[] }>('/audit-logs');
    return data.audit_logs || [];
  },
};

export const alertAPI = {
  getAll: async (): Promise<Alert[]> => {
    const { data } = await api.get<Alert[]>('/alerts');
    return data;
  },

  markAsRead: async (alertId: string): Promise<void> => {
    await api.post(`/alerts/${alertId}/read`);
  },
};

export const userAPI = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<{ users: User[] }>('/admin/users');
    return data.users || [];
  },

  updateRole: async (username: string, newRole: string): Promise<void> => {
    await api.put(`/admin/users/${username}/role`, { new_role: newRole });
  },

  deactivate: async (username: string): Promise<void> => {
    await api.post(`/admin/users/${username}/deactivate`);
  },
};

export default api;
