import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get usage analytics (admin only)
router.get('/usage', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsersLast30Days, activeUsersLast7Days, totalEvents, totalTasks] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({
        where: {
          OR: [
            { events: { some: { createdAt: { gte: sevenDaysAgo } } } },
            { tasks: { some: { createdAt: { gte: sevenDaysAgo } } } },
          ],
        },
      }),
      prisma.event.count(),
      prisma.task.count(),
    ]);

    res.json({
      totalUsers,
      newUsersLast30Days,
      activeUsersLast7Days,
      totalEvents,
      totalTasks,
      userGrowthRate: totalUsers > 0 ? ((newUsersLast30Days / totalUsers) * 100).toFixed(1) : 0,
      activeUserRate: totalUsers > 0 ? ((activeUsersLast7Days / totalUsers) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
});

// Get performance metrics (admin only)
router.get('/performance', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const metrics = {
      avgResponseTime: '45ms', // Placeholder
      requestsPerMinute: Math.floor(Math.random() * 100) + 50,
      errorRate: '0.5%', // Placeholder
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Get feature adoption stats (admin only)
router.get('/adoption', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [totalUsers, usersWithEvents, usersWithTasks, usersWithHabits, teamsCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { events: { some: {} } } }),
      prisma.user.count({ where: { tasks: { some: {} } } }),
      prisma.user.count({ where: { habits: { some: {} } } }),
      prisma.team.count(),
    ]);

    res.json({
      calendar: {
        users: usersWithEvents,
        adoptionRate: totalUsers > 0 ? ((usersWithEvents / totalUsers) * 100).toFixed(1) : 0,
      },
      tasks: {
        users: usersWithTasks,
        adoptionRate: totalUsers > 0 ? ((usersWithTasks / totalUsers) * 100).toFixed(1) : 0,
      },
      habits: {
        users: usersWithHabits,
        adoptionRate: totalUsers > 0 ? ((usersWithHabits / totalUsers) * 100).toFixed(1) : 0,
      },
      teams: {
        count: teamsCount,
        avgMembersPerTeam: 0, // Would need additional query
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch adoption stats' });
  }
});

export default router;
