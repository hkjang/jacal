import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get system statistics (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalTasks,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.task.count(),
      prisma.user.count({
        where: {
          events: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalEvents,
      totalTasks,
      activeUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get system health statistics (admin only)
router.get('/system-stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const os = require('os');
    
    const stats = {
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Get system health status (admin only)
router.get('/health', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const healthChecks = {
      database: 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = 'healthy';
    } catch (error) {
      healthChecks.database = 'unhealthy';
    }

    res.json(healthChecks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch health status' });
  }
});

// Get server logs (admin only) with pagination and search
router.get('/logs', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const level = req.query.level as string;
    
    // In a real application, you would read from a log file or logging service
    // For now, generate mock data based on parameters
    
    let logs = [];
    const totalLogs = 1000; // Mock total
    
    // Generate deterministic mock logs
    for (let i = 0; i < totalLogs; i++) {
      const timestamp = new Date(Date.now() - i * 60000).toISOString();
      let logLevel = 'info';
      let message = 'Server operation successful';
      
      if (i % 10 === 0) {
        logLevel = 'warn';
        message = 'High memory usage detected';
      } else if (i % 25 === 0) {
        logLevel = 'error';
        message = 'Database connection timeout';
      } else if (i % 5 === 0) {
        message = 'User login successful';
      }

      logs.push({ id: i.toString(), timestamp, level: logLevel, message });
    }

    // Filter logs
    if (search) {
      logs = logs.filter(log => log.message.toLowerCase().includes(search.toLowerCase()));
    }
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    res.json({
      data: paginatedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
