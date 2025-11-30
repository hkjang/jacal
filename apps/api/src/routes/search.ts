import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { q } = req.query;

    console.log(`Search request: userId=${userId}, q=${q}`);
    for (let i = 0; i < (q as string).length; i++) {
      console.log(`Char ${i}: ${(q as string).charCodeAt(i).toString(16)}`);
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const query = q as string;
    const isWildcard = query === '*';

    const [tasks, events, habits, totalTasks, totalEvents, totalHabits] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          ...(isWildcard ? {} : {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: 5,
      }),
      prisma.event.findMany({
        where: {
          userId,
          ...(isWildcard ? {} : {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: 5,
      }),
      prisma.habit.findMany({
        where: {
          userId,
          ...(isWildcard ? {} : {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
        take: 5,
      }),
      prisma.task.count({ where: { userId } }),
      prisma.event.count({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
    ]);

    console.log(`Search results: tasks=${tasks.length}, events=${events.length}, habits=${habits.length}`);
    console.log(`Total items for user: tasks=${totalTasks}, events=${totalEvents}, habits=${totalHabits}`);

    res.json({ 
      tasks, 
      events, 
      habits,
      debug: {
        userId,
        query,
        total: {
          tasks: totalTasks,
          events: totalEvents,
          habits: totalHabits
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

export default router;
