export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isAdmin: boolean;
  timezone: string;
  createdAt: string;
  _count: {
    events: number;
    tasks: number;
  };
}

export interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalTasks: number;
  activeUsers: number;
}

export interface UpdateUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  timezone: string;
}
