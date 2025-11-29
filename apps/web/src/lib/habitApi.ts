import axios from 'axios';
import { Habit, HabitLog, HabitStats } from '../types/habit';
import { API_URL } from '../config';

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

export const habitAPI = {
  getAll: async (): Promise<Habit[]> => {
    const res = await api.get('/api/habits');
    return res.data;
  },

  create: async (data: Partial<Habit>): Promise<Habit> => {
    const res = await api.post('/api/habits', data);
    return res.data;
  },

  logCompletion: async (habitId: string, note?: string): Promise<HabitLog> => {
    const res = await api.post(`/api/habits/${habitId}/log`, { note });
    return res.data;
  },

  getStats: async (habitId: string): Promise<HabitStats> => {
    const res = await api.get(`/api/habits/${habitId}/stats`);
    return res.data;
  },

  delete: async (habitId: string): Promise<void> => {
    await api.delete(`/api/habits/${habitId}`);
  },
};
