import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { triggerWebhook } from '../services/webhook';

const router = Router();

// Helper function to get reminders for an event
const getRemindersForEvent = async (eventId: string) => {
  return prisma.reminder.findMany({
    where: { entityType: 'event', entityId: eventId },
    orderBy: { notifyAt: 'asc' },
  });
};

// Helper function to get recurring rule for an event
const getRecurringRuleForEvent = async (eventId: string) => {
  return prisma.recurringRule.findUnique({
    where: { eventId },
  });
};

// Get all events for current user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const events = await prisma.event.findMany({
      where: { userId },
      include: { 
        tags: true,
        recurringRule: true,
      },
      orderBy: { startAt: 'asc' },
    });

    // Fetch reminders for each event
    const eventsWithReminders = await Promise.all(
      events.map(async (event) => {
        const reminders = await getRemindersForEvent(event.id);
        return { ...event, reminders };
      })
    );

    res.json(eventsWithReminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: { 
        id,
        ...(req.user!.isAdmin ? {} : { userId }),
      },
      include: { 
        tags: true,
        recurringRule: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const reminders = await getRemindersForEvent(event.id);
    res.json({ ...event, reminders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, startAt, endAt, location, reminders, eventType, isAllDay, isFocusTime, recurringRule } = req.body;

    const event = await prisma.event.create({
      data: {
        userId,
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        location,
        ...(eventType && { eventType }),
        ...(isAllDay !== undefined && { isAllDay }),
        ...(isFocusTime !== undefined && { isFocusTime }),
        sourceCalendar: 'manual',
      },
      include: { tags: true },
    });

    // Create recurring rule if provided
    if (recurringRule && recurringRule.rruleText) {
      await prisma.recurringRule.create({
        data: {
          eventId: event.id,
          rruleText: recurringRule.rruleText,
        },
      });
    }

    // Create reminders if provided
    let createdReminders: any[] = [];
    if (reminders && reminders.length > 0) {
      createdReminders = await Promise.all(
        reminders.map((r: any) =>
          prisma.reminder.create({
            data: {
              entityType: 'event',
              entityId: event.id,
              notifyAt: new Date(r.notifyAt),
              channel: r.channel || 'push',
              sent: false,
            },
          })
        )
      );
    }

    // Fetch the created recurring rule
    const createdRecurringRule = recurringRule?.rruleText 
      ? await getRecurringRuleForEvent(event.id)
      : null;

    // Trigger webhook if configured
    await triggerWebhook(userId, 'create', event);

    res.json({ 
      ...event, 
      reminders: createdReminders,
      recurringRule: createdRecurringRule,
    });
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
    const { title, description, startAt, endAt, location, reminders, eventType, isAllDay, isFocusTime, recurringRule } = req.body;

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
        ...(eventType && { eventType }),
        ...(isAllDay !== undefined && { isAllDay }),
        ...(isFocusTime !== undefined && { isFocusTime }),
      },
      include: { tags: true },
    });

    // Update recurring rule
    if (recurringRule !== undefined) {
      // Delete existing recurring rule
      await prisma.recurringRule.deleteMany({
        where: { eventId: id },
      });

      // Create new recurring rule if provided
      if (recurringRule && recurringRule.rruleText) {
        await prisma.recurringRule.create({
          data: {
            eventId: event.id,
            rruleText: recurringRule.rruleText,
          },
        });
      }
    }

    // Update reminders
    let updatedReminders: any[] = [];
    if (reminders !== undefined) {
      // Delete existing reminders for this event
      await prisma.reminder.deleteMany({
        where: { entityType: 'event', entityId: id },
      });

      // Create new reminders
      if (reminders && reminders.length > 0) {
        updatedReminders = await Promise.all(
          reminders.map((r: any) =>
            prisma.reminder.create({
              data: {
                entityType: 'event',
                entityId: event.id,
                notifyAt: new Date(r.notifyAt),
                channel: r.channel || 'push',
                sent: false,
              },
            })
          )
        );
      }
    } else {
      // If reminders not in request, fetch existing ones
      updatedReminders = await getRemindersForEvent(event.id);
    }

    // Fetch updated recurring rule
    const updatedRecurringRule = await getRecurringRuleForEvent(event.id);

    // Trigger webhook
    await triggerWebhook(userId, 'update', event);

    res.json({ 
      ...event, 
      reminders: updatedReminders,
      recurringRule: updatedRecurringRule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Duplicate event
router.post('/:id/duplicate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Fetch the original event
    const originalEvent = await prisma.event.findFirst({
      where: { 
        id,
        ...(req.user!.isAdmin ? {} : { userId }),
      },
      include: { 
        tags: true,
        recurringRule: true,
      },
    });

    if (!originalEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get reminders
    const originalReminders = await getRemindersForEvent(originalEvent.id);

    // Create duplicated event
    const duplicatedEvent = await prisma.event.create({
      data: {
        userId,
        title: `${originalEvent.title} (복사)`,
        description: originalEvent.description,
        startAt: originalEvent.startAt,
        endAt: originalEvent.endAt,
        location: originalEvent.location,
        eventType: originalEvent.eventType,
        isAllDay: originalEvent.isAllDay,
        isFocusTime: originalEvent.isFocusTime,
        sourceCalendar: 'manual',
      },
      include: { tags: true },
    });

    // Duplicate recurring rule if exists
    if (originalEvent.recurringRule) {
      await prisma.recurringRule.create({
        data: {
          eventId: duplicatedEvent.id,
          rruleText: originalEvent.recurringRule.rruleText,
        },
      });
    }

    // Duplicate reminders
    let createdReminders: any[] = [];
    if (originalReminders.length > 0) {
      // Adjust reminder times based on the time difference
      createdReminders = await Promise.all(
        originalReminders.map((r) =>
          prisma.reminder.create({
            data: {
              entityType: 'event',
              entityId: duplicatedEvent.id,
              notifyAt: r.notifyAt,
              channel: r.channel,
              sent: false,
            },
          })
        )
      );
    }

    const duplicatedRecurringRule = await getRecurringRuleForEvent(duplicatedEvent.id);

    res.json({ 
      ...duplicatedEvent, 
      reminders: createdReminders,
      recurringRule: duplicatedRecurringRule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to duplicate event' });
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

    // Delete reminders first (no cascade in polymorphic relation)
    await prisma.reminder.deleteMany({
      where: { entityType: 'event', entityId: id },
    });

    // Delete recurring rule (has cascade, but let's be explicit)
    await prisma.recurringRule.deleteMany({
      where: { eventId: id },
    });

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
