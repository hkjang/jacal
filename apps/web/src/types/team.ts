export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: TeamMember[];
  _count?: {
    events: number;
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SharedEvent {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  location?: string;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  comments?: Comment[];
}

export interface Comment {
  id: string;
  sharedEventId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}
