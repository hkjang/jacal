import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Admin middleware
const adminMiddleware = async (req: Request, res: Response, next: any) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true, isAdmin: true },
    });
    
    if (!user || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        timezone: true,
        createdAt: true,
        _count: {
          select: {
            events: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all events for a specific user (admin only)
router.get('/users/:userId/events', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { startAt: 'asc' },
    });
    
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

// Get all tasks for a specific user (admin only)
router.get('/users/:userId/tasks', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user tasks' });
  }
});

// Get all events from all users (admin only)
router.get('/events/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });
    
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all events' });
  }
});

// Update user (admin only)
router.put('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        timezone,
        isAdmin: role === 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        timezone: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system statistics (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalTasks,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.task.count(),
      prisma.user.count({
        where: {
          events: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalEvents,
      totalTasks,
      activeUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
