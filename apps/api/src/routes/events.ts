import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { triggerWebhook } from '../services/webhook';

const router = Router();

// Get all events for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const events = await prisma.event.findMany({
      where: { userId },
      include: { tags: true, reminders: true },
      orderBy: { startAt: 'asc' },
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, startAt, endAt, location } = req.body;

    const event = await prisma.event.create({
      data: {
        userId,
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        location,
        sourceCalendar: 'manual',
      },
    });

    // Trigger webhook if configured
    await triggerWebhook(userId, event);

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { title, description, startAt, endAt, location } = req.body;

    const event = await prisma.event.update({
      where: { id, userId },
      data: {
        title,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        location,
      },
    });

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    await prisma.event.delete({
      where: { id, userId },
    });

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
