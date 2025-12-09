import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get or create AppSettings
async function getOrCreateAppSettings() {
  let settings = await prisma.appSettings.findFirst();
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {},
    });
  }
  return settings;
}

// Get database statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [
      userCount,
      eventCount,
      taskCount,
      habitCount,
      teamCount,
      habitLogCount,
      reminderCount,
      tagCount,
      settings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.task.count(),
      prisma.habit.count(),
      prisma.team.count(),
      prisma.habitLog.count(),
      prisma.reminder.count(),
      prisma.tag.count(),
      getOrCreateAppSettings(),
    ]);

    // Calculate approximate database size (this is a rough estimate)
    const totalRecords = userCount + eventCount + taskCount + habitCount + teamCount + habitLogCount + reminderCount + tagCount;
    const approximateSizeMB = (totalRecords * 1024) / 1024; // Very rough estimate

    // Parse connection limit from DATABASE_URL or use settings
    let activeConnectionLimit = settings.connectionLimit || 10;
    const dbUrl = process.env.DATABASE_URL || '';
    const connectionLimitMatch = dbUrl.match(/connection_limit=(\d+)/);
    if (connectionLimitMatch) {
      activeConnectionLimit = parseInt(connectionLimitMatch[1], 10);
    }

    res.json({
      type: dbUrl.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
      size: `${approximateSizeMB.toFixed(2)} MB`,
      tables: 16, // Updated table count
      records: totalRecords,
      tableStats: {
        users: userCount,
        events: eventCount,
        tasks: taskCount,
        habits: habitCount,
        teams: teamCount,
        habitLogs: habitLogCount,
        reminders: reminderCount,
        tags: tagCount,
      },
      poolConfig: {
        connectionLimit: activeConnectionLimit,
        configuredLimit: settings.connectionLimit,
        lastUpdated: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

// Update pool configuration
router.put('/pool-config', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { connectionLimit } = req.body;

    // Validate connection limit
    if (typeof connectionLimit !== 'number' || connectionLimit < 1 || connectionLimit > 100) {
      return res.status(400).json({ error: 'Connection limit must be between 1 and 100' });
    }

    // Get or create app settings
    let settings = await prisma.appSettings.findFirst();

    if (settings) {
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data: { connectionLimit },
      });
    } else {
      settings = await prisma.appSettings.create({
        data: { connectionLimit },
      });
    }

    res.json({
      success: true,
      connectionLimit: settings.connectionLimit,
      message: 'Pool configuration saved. Server restart required to apply changes.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update pool configuration' });
  }
});

export default router;

