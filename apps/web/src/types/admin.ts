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
    connectedAccounts: number;
  };
  settings?: {
    id: string;
    ollamaEnabled: boolean;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    pop3Enabled: boolean;
    pop3Host?: string;
    pop3Port?: number;
    pop3User?: string;
    pop3Password?: string;
    pop3Tls?: boolean;
    savedLocations?: any;
  };
  webhookConfig?: {
    id: string;
    enabled: boolean;
    url?: string;
    columnMapping?: any;
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
