import axios from 'axios';
import { User, Stats, UpdateUserData } from '../types/admin';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

export const adminAPI = {
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/admin/users');
    return res.data;
  },

  getStats: async (): Promise<Stats> => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  updateUser: async (data: UpdateUserData): Promise<void> => {
    await api.put(`/admin/users/${data.id}`, data);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },
};
