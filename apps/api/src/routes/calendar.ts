import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { calendarService } from '../services/calendar';

const router = Router();

// Sync Google Calendar
router.post('/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await calendarService.syncGoogleCalendar(userId);
    res.json({ success: true, message: 'Calendar synced successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

export default router;
