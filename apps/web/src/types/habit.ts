export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: string;
  targetDays: number;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string;
  note?: string;
}

export interface HabitStats {
  totalLogs: number;
  streak: number;
  completionRate: number;
}
