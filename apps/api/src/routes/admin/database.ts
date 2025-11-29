import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get database statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [
      userCount,
      eventCount,
      taskCount,
      habitCount,
      teamCount,
      habitLogCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.task.count(),
      prisma.habit.count(),
      prisma.team.count(),
      prisma.habitLog.count(),
    ]);

    // Calculate approximate database size (this is a rough estimate)
    const totalRecords = userCount + eventCount + taskCount + habitCount + teamCount + habitLogCount;
    const approximateSizeMB = (totalRecords * 1024) / 1024; // Very rough estimate

    res.json({
      type: 'PostgreSQL',
      size: `${approximateSizeMB.toFixed(2)} MB`,
      tables: 12,
      records: totalRecords,
      tableStats: {
        users: userCount,
        events: eventCount,
        tasks: taskCount,
        habits: habitCount,
        teams: teamCount,
        habitLogs: habitLogCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

export default router;
