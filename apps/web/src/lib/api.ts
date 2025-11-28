import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  location?: string;
  sourceCalendar?: string;
  createdAt: string;
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
};
