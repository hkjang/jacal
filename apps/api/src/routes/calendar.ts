import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { calendarService } from '../services/calendar';

const router = Router();

// Get all events (Personal + Team)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 1. Fetch personal events with recurring rules
    const personalEvents = await prisma.event.findMany({
      where: { userId },
      include: { 
        tags: true,
        recurringRule: true,
      },
    });

    // Fetch reminders for personal events
    const personalEventsWithReminders = await Promise.all(
      personalEvents.map(async (event) => {
        const reminders = await prisma.reminder.findMany({
          where: { entityType: 'event', entityId: event.id },
          orderBy: { notifyAt: 'asc' },
        });
        return { ...event, reminders };
      })
    );

    // 2. Fetch team events
    const teamEvents = await prisma.sharedEvent.findMany({
      where: {
        team: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 3. Combine and format
    const formattedPersonalEvents = personalEventsWithReminders.map(event => ({
      ...event,
      isTeamEvent: false,
    }));

    const formattedTeamEvents = teamEvents.map(event => ({
      ...event,
      isTeamEvent: true,
      eventType: 'TEAM', // Use a special type for frontend coloring
      // Map shared event fields to match Event interface if needed
    }));

    // Debug: Log events with recurring rules
    const eventsWithRecurring = formattedPersonalEvents.filter((e: any) => e.recurringRule);
    console.log('[Calendar API] Events with recurring rules:', eventsWithRecurring.length);
    if (eventsWithRecurring.length > 0) {
      console.log('[Calendar API] Recurring events:', eventsWithRecurring.map((e: any) => ({
        id: e.id,
        title: e.title,
        recurringRule: e.recurringRule
      })));
    }

    // Debug: Check actual JSON output
    const allEvents = [...formattedPersonalEvents, ...formattedTeamEvents];
    const jsonOutput = JSON.stringify(allEvents);
    const hasRecurringInJson = jsonOutput.includes('recurringRule');
    console.log('[Calendar API] JSON includes recurringRule:', hasRecurringInJson);
    if (!hasRecurringInJson && eventsWithRecurring.length > 0) {
      console.log('[Calendar API] WARNING: recurringRule not in JSON! Sample event:', JSON.stringify(formattedPersonalEvents[0], null, 2));
    }

    res.json(allEvents);
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Sync Google Calendar
router.post('/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await calendarService.syncGoogleCalendar(userId);
    res.json({ success: true, message: 'Calendar synced successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

export default router;
