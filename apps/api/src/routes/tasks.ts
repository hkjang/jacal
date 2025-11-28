import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get all tasks for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { tags: true, reminders: true },
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
    const userId = (req as any).user.userId;
    const { title, description, dueAt, estimatedMinutes, priority } = req.body;

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null,
        estimatedMinutes,
        priority: priority || 0,
      },
    });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { title, description, dueAt, estimatedMinutes, priority, status } = req.body;

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
    });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
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

export default router;
