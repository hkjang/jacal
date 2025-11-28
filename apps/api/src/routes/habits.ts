import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get all habits for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { completedAt: 'desc' },
          take: 30, // Last 30 logs
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Create a new habit
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, frequency, targetDays, color, icon } = req.body;

    const habit = await prisma.habit.create({
      data: {
        userId,
        title,
        description,
        frequency: frequency || 'daily',
        targetDays: targetDays || 7,
        color,
        icon,
      },
    });

    res.json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Log habit completion
router.post('/:id/log', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { note } = req.body;

    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const log = await prisma.habitLog.create({
      data: {
        habitId: id,
        userId,
        note,
      },
    });

    res.json(log);
  } catch (error) {
    console.error('Log habit error:', error);
    res.status(500).json({ error: 'Failed to log habit' });
  }
});

// Get habit statistics
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId },
      include: {
        logs: {
          where: {
            completedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const totalLogs = habit.logs.length;
    const streak = calculateStreak(habit.logs);

    res.json({
      totalLogs,
      streak,
      completionRate: (totalLogs / 30) * 100,
    });
  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch habit statistics' });
  }
});

// Delete habit
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await prisma.habit.deleteMany({
      where: { id, userId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Helper function to calculate streak
function calculateStreak(logs: any[]): number {
  if (logs.length === 0) return 0;

  const sortedLogs = logs.sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const log of sortedLogs) {
    const logDate = new Date(log.completedAt);
    logDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

export default router;
