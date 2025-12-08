import axios from 'axios';
import { User, Stats, UpdateUserData } from '../types/admin';
import { API_URL } from '../config';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPI = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<User>> => {
    const res = await api.get('/api/admin/users', { params });
    return res.data;
  },

  createUser: async (data: any): Promise<User> => {
    const res = await api.post('/api/admin/users', data);
    return res.data;
  },

  getStats: async (): Promise<Stats> => {
    const res = await api.get('/api/admin/stats');
    return res.data;
  },

  updateUser: async (data: UpdateUserData): Promise<void> => {
    await api.put(`/api/admin/users/${data.id}`, data);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/api/admin/users/${userId}`);
  },

  updateUserSettings: async (userId: string, settings: {
    ollamaEnabled?: boolean;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    pop3Enabled?: boolean;
    pop3Host?: string;
    pop3Port?: number;
    pop3User?: string;
    pop3Password?: string;
    pop3Tls?: boolean;
    savedLocations?: any;
  }): Promise<any> => {
    const res = await api.put(`/api/admin/users/${userId}/settings`, settings);
    return res.data;
  },

  getUserSettings: async (userId: string): Promise<any> => {
    const res = await api.get(`/api/admin/users/${userId}/settings`);
    return res.data;
  },

  deleteUserSettings: async (userId: string): Promise<any> => {
    const res = await api.delete(`/api/admin/users/${userId}/settings`);
    return res.data;
  },

  getUserWebhook: async (userId: string): Promise<any> => {
    const res = await api.get(`/api/admin/users/${userId}/webhook`);
    return res.data;
  },

  updateUserWebhook: async (userId: string, webhook: {
    enabled?: boolean;
    url?: string;
    columnMapping?: any;
  }): Promise<any> => {
    const res = await api.put(`/api/admin/users/${userId}/webhook`, webhook);
    return res.data;
  },

  deleteUserWebhook: async (userId: string): Promise<any> => {
    const res = await api.delete(`/api/admin/users/${userId}/webhook`);
    return res.data;
  },

  getUserIntegrations: async (userId: string): Promise<any[]> => {
    const res = await api.get(`/api/admin/users/${userId}/integrations`);
    return res.data;
  },

  deleteUserIntegration: async (userId: string, integrationId: string): Promise<any> => {
    const res = await api.delete(`/api/admin/users/${userId}/integrations/${integrationId}`);
    return res.data;
  },

  getSystemStats: async (): Promise<any> => {
    const res = await api.get('/api/admin/system-stats');
    return res.data;
  },

  getHabits: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/habits/all', { params });
    return res.data;
  },

  updateHabit: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/api/admin/habits/${id}`, data);
    return res.data;
  },

  deleteHabit: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/habits/${id}`);
    return res.data;
  },

  getTeams: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/teams/all', { params });
    return res.data;
  },

  getTasks: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/tasks/all', { params });
    return res.data;
  },

  updateTask: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/api/admin/tasks/${id}`, data);
    return res.data;
  },

  deleteTask: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/tasks/${id}`);
    return res.data;
  },

  getEvents: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/events/all', { params });
    return res.data;
  },

  updateEvent: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/api/admin/events/${id}`, data);
    return res.data;
  },

  deleteEvent: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/events/${id}`);
    return res.data;
  },

  getHealth: async (): Promise<any> => {
    const res = await api.get('/api/admin/health');
    return res.data;
  },

  getLogs: async (params?: { page?: number; limit?: number; search?: string; level?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/logs', { params });
    return res.data;
  },

  getUsageAnalytics: async (): Promise<any> => {
    const res = await api.get('/api/admin/analytics/usage');
    return res.data;
  },

  getPerformanceMetrics: async (): Promise<any> => {
    const res = await api.get('/api/admin/analytics/performance');
    return res.data;
  },

  getAdoptionStats: async (): Promise<any> => {
    const res = await api.get('/api/admin/analytics/adoption');
    return res.data;
  },

  // Database Management
  getDatabaseStats: async (): Promise<any> => {
    const res = await api.get('/api/admin/database/stats');
    return res.data;
  },

  // Backup Management
  getBackups: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/backups', { params });
    return res.data;
  },

  deleteBackup: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/backups/${id}`);
    return res.data;
  },

  createBackup: async (): Promise<any> => {
    const res = await api.post('/api/admin/backups/create');
    return res.data;
  },

  restoreBackup: async (id: string): Promise<any> => {
    const res = await api.post(`/api/admin/backups/${id}/restore`);
    return res.data;
  },

  // Settings Management
  getSettings: async (): Promise<any> => {
    const res = await api.get('/api/admin/settings');
    return res.data;
  },

  updateSettings: async (data: any): Promise<any> => {
    const res = await api.put('/api/admin/settings', data);
    return res.data;
  },

  // Webhook Management
  getWebhooks: async (): Promise<any[]> => {
    const res = await api.get('/api/admin/webhooks');
    return res.data;
  },

  createWebhook: async (data: any): Promise<any> => {
    const res = await api.post('/api/admin/webhooks', data);
    return res.data;
  },

  updateWebhook: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/api/admin/webhooks/${id}`, data);
    return res.data;
  },

  deleteWebhook: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/webhooks/${id}`);
    return res.data;
  },

  testWebhook: async (id: string): Promise<any> => {
    const res = await api.post(`/api/admin/webhooks/${id}/test`);
    return res.data;
  },

  // Integration Management
  getIntegrations: async (): Promise<any[]> => {
    const res = await api.get('/api/admin/integrations');
    return res.data;
  },

  createIntegration: async (data: any): Promise<any> => {
    const res = await api.post('/api/admin/integrations', data);
    return res.data;
  },

  updateIntegration: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/api/admin/integrations/${id}`, data);
    return res.data;
  },

  deleteIntegration: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/integrations/${id}`);
    return res.data;
  },

  // Email Management
  getEmailSettings: async (): Promise<any[]> => {
    const res = await api.get('/api/admin/email');
    return res.data;
  },

  createEmailSettings: async (data: any): Promise<any> => {
    const res = await api.post('/api/admin/email', data);
    return res.data;
  },

  updateEmailSettings: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/api/admin/email/${id}`, data);
    return res.data;
  },

  deleteEmailSettings: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/email/${id}`);
    return res.data;
  },

  sendTestEmail: async (): Promise<any> => {
    const res = await api.post('/api/admin/email/test');
    return res.data;
  },

  // Team Management
  getAllTeams: async (): Promise<any[]> => {
    const res = await api.get('/api/admin/teams');
    return res.data;
  },

  getTeamById: async (id: string): Promise<any> => {
    const res = await api.get(`/api/admin/teams/${id}`);
    return res.data;
  },

  createTeam: async (data: { name: string; description?: string; ownerId: string }): Promise<any> => {
    const res = await api.post('/api/admin/teams', data);
    return res.data;
  },

  updateTeam: async (id: string, data: { name?: string; description?: string }): Promise<any> => {
    const res = await api.put(`/api/admin/teams/${id}`, data);
    return res.data;
  },

  deleteTeam: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/teams/${id}`);
    return res.data;
  },

  addTeamMember: async (teamId: string, userId: string, role?: string): Promise<any> => {
    const res = await api.post(`/api/admin/teams/${teamId}/members`, { userId, role });
    return res.data;
  },

  removeTeamMember: async (teamId: string, userId: string): Promise<any> => {
    const res = await api.delete(`/api/admin/teams/${teamId}/members/${userId}`);
    return res.data;
  },

  updateTeamMemberRole: async (teamId: string, userId: string, role: string): Promise<any> => {
    const res = await api.put(`/api/admin/teams/${teamId}/members/${userId}`, { role });
    return res.data;
  },

  // Notification Webhook Management
  getNotificationWebhooks: async (): Promise<any[]> => {
    const res = await api.get('/api/admin/notification-webhooks');
    return res.data;
  },

  createNotificationWebhook: async (data: { name: string; url: string; active?: boolean; headers?: Record<string, string> }): Promise<any> => {
    const res = await api.post('/api/admin/notification-webhooks', data);
    return res.data;
  },

  updateNotificationWebhook: async (id: string, data: { name?: string; url?: string; active?: boolean; headers?: Record<string, string> }): Promise<any> => {
    const res = await api.put(`/api/admin/notification-webhooks/${id}`, data);
    return res.data;
  },

  deleteNotificationWebhook: async (id: string): Promise<any> => {
    const res = await api.delete(`/api/admin/notification-webhooks/${id}`);
    return res.data;
  },

  testNotificationWebhook: async (id: string): Promise<any> => {
    const res = await api.post(`/api/admin/notification-webhooks/${id}/test`);
    return res.data;
  },

  getNotificationWebhookLogs: async (params?: { page?: number; limit?: number; webhookId?: string; status?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/notification-webhooks/logs/all', { params });
    return res.data;
  },

  resendNotificationWebhook: async (logId: string): Promise<any> => {
    const res = await api.post(`/api/admin/notification-webhooks/logs/${logId}/resend`);
    return res.data;
  },

  // Reminders Management
  getReminders: async (params?: { page?: number; limit?: number; search?: string; entityType?: string; sent?: string }): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/admin/reminders', { params });
    return res.data;
  },

  getReminderStats: async (): Promise<any> => {
    const res = await api.get('/api/admin/reminders/stats');
    return res.data;
  },
};
