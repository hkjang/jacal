import axios from 'axios';
import { Team, TeamMember, SharedEvent, Comment } from '../types/team';
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

  updateTeam: async (id: string, data: { name: string; description?: string }): Promise<Team> => {
    const res = await api.put(`/api/teams/${id}`, data);
    return res.data;
  },

  deleteTeam: async (id: string): Promise<void> => {
    await api.delete(`/api/teams/${id}`);
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(`/api/teams/${teamId}/members/${userId}`);
  },

  updateEvent: async (eventId: string, data: any): Promise<SharedEvent> => {
    const res = await api.put(`/api/teams/events/${eventId}`, data);
    return res.data;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/api/teams/events/${eventId}`);
  },
};
