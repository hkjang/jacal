import axios from 'axios';
import { API_URL } from '../config';
import { Event } from './api';

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

export const calendarAPI = {
  getAllEvents: async (): Promise<Event[]> => {
    const res = await api.get('/api/calendar');
    return res.data;
  },

  syncCalendar: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/api/calendar/sync');
    return res.data;
  },
};
