import axios from 'axios';
import { Team, TeamMember, SharedEvent, Comment } from '../types/team';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const teamAPI = {
  getMyTeams: async (): Promise<Team[]> => {
    const res = await api.get('/api/teams');
    return res.data;
  },

  createTeam: async (data: { name: string; description?: string }): Promise<Team> => {
    const res = await api.post('/api/teams', data);
    return res.data;
  },

  addMember: async (teamId: string, email: string, role?: string): Promise<TeamMember> => {
    const res = await api.post(`/api/teams/${teamId}/members`, { email, role });
    return res.data;
  },

  getTeamEvents: async (teamId: string): Promise<SharedEvent[]> => {
    const res = await api.get(`/api/teams/${teamId}/events`);
    return res.data;
  },

  createEvent: async (teamId: string, data: any): Promise<SharedEvent> => {
    const res = await api.post(`/api/teams/${teamId}/events`, data);
    return res.data;
  },

  addComment: async (eventId: string, content: string): Promise<Comment> => {
    const res = await api.post(`/api/teams/events/${eventId}/comments`, { content });
    return res.data;
  },
};
