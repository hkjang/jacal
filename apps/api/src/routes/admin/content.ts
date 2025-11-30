import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

// Helper for pagination
const getPaginationParams = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Get all events from all users (admin only)
router.get('/events/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Prisma.EventWhereInput = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    } : {};

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { startAt: 'desc' },
      }),
    ]);
    
    res.json({
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all events' });
  }
});

// Update event (admin only)
router.put('/events/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startAt, endAt, location, eventType } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        location,
        eventType,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/events/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get all habits from all users (admin only)
router.get('/habits/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Prisma.HabitWhereInput = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    } : {};

    const [total, habits] = await Promise.all([
      prisma.habit.count({ where }),
      prisma.habit.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { logs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: habits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all habits' });
  }
});

// Update habit (admin only)
router.put('/habits/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, frequency, targetDays, color, icon } = req.body;

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        title,
        description,
        frequency,
        targetDays,
        color,
        icon,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    res.json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit (admin only)
router.delete('/habits/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.habit.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Get all teams (admin only)
router.get('/teams/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Prisma.TeamWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [total, teams] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        skip,
        take: limit,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: { events: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: teams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all teams' });
  }
});

// Get all tasks from all users (admin only)
router.get('/tasks/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const search = req.query.search as string;

    const where: Prisma.TaskWhereInput = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    } : {};

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all tasks' });
  }
});

// Update task (admin only)
router.put('/tasks/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueAt, estimatedMinutes } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        estimatedMinutes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task (admin only)
router.delete('/tasks/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
