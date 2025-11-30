import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { calendarService } from '../services/calendar';

const router = Router();

// Get all events (Personal + Team)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 1. Fetch personal events
    const personalEvents = await prisma.event.findMany({
      where: { userId },
      include: { tags: true },
    });

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
    const formattedPersonalEvents = personalEvents.map(event => ({
      ...event,
      isTeamEvent: false,
    }));

    const formattedTeamEvents = teamEvents.map(event => ({
      ...event,
      isTeamEvent: true,
      eventType: 'TEAM', // Use a special type for frontend coloring
      // Map shared event fields to match Event interface if needed
    }));

    res.json([...formattedPersonalEvents, ...formattedTeamEvents]);
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
