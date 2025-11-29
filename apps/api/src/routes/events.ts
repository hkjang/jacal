import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { triggerWebhook } from '../services/webhook';

const router = Router();

// Get all events for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const events = await prisma.event.findMany({
      where: { userId },
      include: { tags: true },
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
    const userId = req.user!.userId;
    const { title, description, startAt, endAt, location, reminders } = req.body;

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
      include: { tags: true },
    });

    // Create reminders separately if provided
    if (reminders && reminders.length > 0) {
      await Promise.all(
        reminders.map((r: any) =>
          prisma.reminder.create({
            data: {
              entityType: 'event',
              entityId: event.id,
              notifyAt: new Date(r.notifyAt),
              channel: r.channel || 'email',
              sent: false,
            },
          })
        )
      );
    }

    // Trigger webhook if configured
    await triggerWebhook(userId, 'create', event);

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, startAt, endAt, location, reminders } = req.body;

    // Check if event exists and belongs to user (or user is admin)
    const where: any = { id };
    if (!req.user!.isAdmin) {
      where.userId = userId;
    }

    const existingEvent = await prisma.event.findFirst({
      where,
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        location,
      },
      include: { tags: true },
    });

    // Update reminders separately if provided
    if (reminders !== undefined) {
      // Delete existing reminders for this event
      await prisma.reminder.deleteMany({
        where: { entityType: 'event', entityId: id },
      });

      // Create new reminders
      if (reminders && reminders.length > 0) {
        await Promise.all(
          reminders.map((r: any) =>
            prisma.reminder.create({
              data: {
                entityType: 'event',
                entityId: event.id,
                notifyAt: new Date(r.notifyAt),
                channel: r.channel || 'email',
                sent: false,
              },
            })
          )
        );
      }
    }

    res.json(event);

    // Trigger webhook
    await triggerWebhook(userId, 'update', event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if event exists and belongs to user (or user is admin)
    const where: any = { id };
    if (!req.user!.isAdmin) {
      where.userId = userId;
    }

    const existingEvent = await prisma.event.findFirst({
      where,
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({ message: 'Event deleted' });

    // Trigger webhook (send id and deleted flag)
    await triggerWebhook(userId, 'delete', { id, deleted: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
