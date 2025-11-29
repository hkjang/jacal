import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get all tasks for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, dueAt, estimatedMinutes, priority, reminders } = req.body;

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null,
        estimatedMinutes,
        priority: priority || 0,
      },
      include: { tags: true },
    });

    // Create reminders separately if provided
    if (reminders && reminders.length > 0) {
      await Promise.all(
        reminders.map((r: any) =>
          prisma.reminder.create({
            data: {
              entityType: 'task',
              entityId: task.id,
              notifyAt: new Date(r.notifyAt),
              channel: r.channel || 'email',
              sent: false,
            },
          })
        )
      );
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, dueAt, estimatedMinutes, priority, status, reminders } = req.body;

    const task = await prisma.task.update({
      where: { id, userId },
      data: {
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null,
        estimatedMinutes,
        priority,
        status,
      },
      include: { tags: true },
    });

    // Update reminders separately if provided
    if (reminders !== undefined) {
      // Delete existing reminders for this task
      await prisma.reminder.deleteMany({
        where: { entityType: 'task', entityId: id },
      });

      // Create new reminders
      if (reminders && reminders.length > 0) {
        await Promise.all(
          reminders.map((r: any) =>
            prisma.reminder.create({
              data: {
                entityType: 'task',
                entityId: task.id,
                notifyAt: new Date(r.notifyAt),
                channel: r.channel || 'email',
                sent: false,
              },
            })
          )
        );
      }
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await prisma.task.delete({
      where: { id, userId },
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Auto-schedule pending tasks
router.post('/auto-schedule', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { autoScheduler } = await import('../services/scheduler');
    
    const scheduledEvents = await autoScheduler.scheduleTasks(userId);
    
    res.json({ 
      success: true, 
      scheduled: scheduledEvents.length,
      events: scheduledEvents 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to auto-schedule tasks' });
  }
});

export default router;
