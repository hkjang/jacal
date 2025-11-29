import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

import bcrypt from 'bcrypt';

// Get all users (admin only) with pagination and search
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          settings: {
            select: {
              pop3Enabled: true,
              pop3Host: true,
              pop3Port: true,
              pop3User: true,
              pop3Password: true,
              pop3Tls: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, timezone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role || 'USER',
        isAdmin: role === 'ADMIN',
        timezone: timezone || 'UTC',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        timezone: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all events for a specific user (admin only)
router.get('/:userId/events', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
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
router.get('/:userId/tasks', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
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

// Update user (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
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

// Update user settings (admin only)
router.put('/:userId/settings', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { pop3Enabled, pop3Host, pop3Port, pop3User, pop3Password, pop3Tls } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        pop3Enabled,
        pop3Host,
        pop3Port,
        pop3User,
        pop3Password,
        pop3Tls,
      },
      create: {
        userId,
        pop3Enabled: pop3Enabled ?? false,
        pop3Host,
        pop3Port,
        pop3User,
        pop3Password,
        pop3Tls: pop3Tls ?? true,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
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

export default router;
