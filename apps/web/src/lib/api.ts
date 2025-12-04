import axios from 'axios';

import { API_URL } from '../config';

const API_BASE_URL = `${API_URL}/api`;

export interface User {
  id: string;
  email: string;
  name: string;
  timezone?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueAt?: string;
  estimatedMinutes?: number;
  priority: number;
  status: string;
  createdAt: string;
  reminders?: Reminder[];
}

export interface Reminder {
  id: string;
  notifyAt: string;
  channel: string;
  sent: boolean;
}

export type EventType = 'WORK' | 'PERSONAL' | 'MEETING' | 'APPOINTMENT' | 'OTHER';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  location?: string;
  eventType?: EventType;
  isAllDay?: boolean;
  isFocusTime?: boolean;
  recurringRule?: RecurringRule;
  sourceCalendar?: string;
  createdAt: string;
  reminders?: Reminder[];
}

export interface RecurringRule {
  id: string;
  entityType: string;
  entityId: string;
  rruleText: string;
}

// Axios instance with auth token
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (email: string, name: string, password: string) => {
    const { data } = await api.post('/auth/register', { email, name, password });
    return data;
  },
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Task API
export const taskAPI = {
  getAll: async (): Promise<Task[]> => {
    const { data } = await api.get('/tasks');
    return data;
  },
  create: async (task: Partial<Task>): Promise<Task> => {
    const { data } = await api.post('/tasks', task);
    return data;
  },
  update: async (id: string, task: Partial<Task>): Promise<Task> => {
    const { data } = await api.put(`/tasks/${id}`, task);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

// Event API
export const eventAPI = {
  getAll: async (): Promise<Event[]> => {
    const { data } = await api.get('/events');
    return data;
  },
  getById: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/events/${id}`);
    return data;
  },
  create: async (event: Partial<Event>): Promise<Event> => {
    const { data } = await api.post('/events', event);
    return data;
  },
  update: async (id: string, event: Partial<Event>): Promise<Event> => {
    const { data } = await api.put(`/events/${id}`, event);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
  duplicate: async (id: string): Promise<Event> => {
    const { data } = await api.post(`/events/${id}/duplicate`);
    return data;
  },
};

// NLU API
export const nluAPI = {
  parse: async (input: string) => {
    const { data } = await api.post('/nlu/parse', { input });
    return data;
  },
};

export interface UserSettings {
  id: string;
  userId: string;
  ollamaEnabled: boolean;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  pop3Enabled: boolean;
  pop3Host?: string;
  pop3Port?: number;
  pop3User?: string;
  pop3Password?: string;
  pop3Tls?: boolean;
  savedLocations?: string[];
}

export interface WebhookConfig {
  id: string;
  userId: string;
  enabled: boolean;
  url?: string;
  columnMapping?: Record<string, string>;
}

// Settings API
export const settingsAPI = {
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await api.get('/settings');
    return data;
  },
  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const { data } = await api.put('/settings', settings);
    return data;
  },
  getWebhookConfig: async (): Promise<WebhookConfig> => {
    const { data } = await api.get('/settings/webhook');
    return data;
  },
  updateWebhookConfig: async (config: Partial<WebhookConfig>): Promise<WebhookConfig> => {
    const { data } = await api.put('/settings/webhook', config);
    return data;
  },
  testWebhook: async (): Promise<void> => {
    await api.post('/settings/webhook/test');
  },
  testEmailConnection: async (config: { host: string; port: number; user: string; password: string; tls: boolean }): Promise<void> => {
    await api.post('/settings/email/test', config);
  },
  syncEmail: async (): Promise<void> => {
    await api.post('/settings/email/sync');
  },
};

// Calendar API
export const calendarAPI = {
  getAuthUrl: async (): Promise<{ url: string }> => {
    const { data } = await api.get('/auth/google/url');
    return data;
  },
  sync: async (): Promise<void> => {
    await api.post('/calendar/sync');
  },
};

// Scheduler API
export const schedulerAPI = {
  autoSchedule: async (): Promise<{ success: boolean; scheduled: number; events: Event[] }> => {
    const { data } = await api.post('/tasks/auto-schedule');
    return data;
  },
};

// Focus Time API
export const focusAPI = {
  getSuggestions: async (): Promise<{ blocks: any[] }> => {
    const { data } = await api.get('/focus/suggestions');
    return data;
  },
  protect: async (): Promise<{ success: boolean; protected: number; blocks: Event[] }> => {
    const { data } = await api.post('/focus/protect');
    return data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (period: 'week' | 'month' = 'week'): Promise<any> => {
    const { data } = await api.get(`/analytics/dashboard?period=${period}`);
    return data;
  },
  getTrends: async (): Promise<any> => {
    const { data } = await api.get('/analytics/trends');
    return data;
  },
  calculate: async (): Promise<any> => {
    const { data } = await api.post('/analytics/calculate');
    return data;
  },
  getHabitStats: async (period: 'week' | 'month' = 'week'): Promise<any> => {
    const { data } = await api.get(`/analytics/habits?period=${period}`);
    return data;
  },
};

// Search API
export const searchAPI = {
  search: async (query: string): Promise<{ tasks: Task[]; events: Event[]; habits: any[] }> => {
    const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return data;
  },
};
