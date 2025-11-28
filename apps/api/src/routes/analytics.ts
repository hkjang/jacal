import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Analytics, Habit } from '@prisma/client';

const router = Router();

// Get analytics dashboard data
router.get('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { period = 'week' } = req.query; // week or month
    
    const daysCount = period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    
    // Get analytics for the period
    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    // Calculate aggregates
    // Calculate aggregates
    const totalFocusMinutes = analytics.reduce((sum: number, a: Analytics) => sum + a.focusMinutes, 0);
    const totalMeetingMinutes = analytics.reduce((sum: number, a: Analytics) => sum + a.meetingMinutes, 0);
    const totalTasksCompleted = analytics.reduce((sum: number, a: Analytics) => sum + a.tasksCompleted, 0);
    const totalTasksPlanned = analytics.reduce((sum: number, a: Analytics) => sum + a.tasksPlanned, 0);
    const avgProductivityScore = analytics.length > 0
      ? analytics.reduce((sum: number, a: Analytics) => sum + a.productivityScore, 0) / analytics.length
      : 0;
    
    // Get current tasks
    const pendingTasks = await prisma.task.count({
      where: { userId, status: 'pending' },
    });
    
    const completedTasks = await prisma.task.count({
      where: { userId, status: 'completed' },
    });
    
    res.json({
      period,
      summary: {
        totalFocusMinutes,
        totalMeetingMinutes,
        totalTasksCompleted,
        totalTasksPlanned,
        completionRate: totalTasksPlanned > 0 ? (totalTasksCompleted / totalTasksPlanned) * 100 : 0,
        avgProductivityScore,
        pendingTasks,
        completedTasks,
      },
      daily: analytics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get productivity trends
router.get('/trends', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
    
    // Calculate trends
    const trends = {
      focusTime: analytics.map(a => ({ date: a.date, value: a.focusMinutes })),
      meetingTime: analytics.map(a => ({ date: a.date, value: a.meetingMinutes })),
      tasksCompleted: analytics.map(a => ({ date: a.date, value: a.tasksCompleted })),
      productivityScore: analytics.map(a => ({ date: a.date, value: a.productivityScore })),
    };
    
    res.json(trends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Calculate and update daily analytics (can be called by cron)
router.post('/calculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count completed tasks today
    const tasksCompleted = await prisma.task.count({
      where: {
        userId,
        status: 'completed',
        updatedAt: { gte: today },
      },
    });
    
    // Count total planned tasks
    const tasksPlanned = await prisma.task.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });
    
    // Get events for today
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const events = await prisma.event.findMany({
      where: {
        userId,
        startAt: {
          gte: today,
          lte: endOfDay,
        },
      },
    });
    
    // Calculate focus time vs meeting time
    let focusMinutes = 0;
    let meetingMinutes = 0;
    
    for (const event of events) {
      const duration = (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / (1000 * 60);
      
      if (event.sourceCalendar === 'focus-time' || event.sourceCalendar === 'auto-scheduled') {
        focusMinutes += duration;
      } else {
        meetingMinutes += duration;
      }
    }
    
    // Calculate productivity score (simple formula)
    const completionRate = tasksPlanned > 0 ? tasksCompleted / tasksPlanned : 0;
    const focusRatio = (focusMinutes + meetingMinutes) > 0 ? focusMinutes / (focusMinutes + meetingMinutes) : 0;
    const productivityScore = (completionRate * 0.6 + focusRatio * 0.4) * 100;
    
    // Upsert analytics
    const analytics = await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        focusMinutes: Math.round(focusMinutes),
        meetingMinutes: Math.round(meetingMinutes),
        tasksCompleted,
        tasksPlanned,
        eventsAttended: events.length,
        productivityScore,
      },
      update: {
        focusMinutes: Math.round(focusMinutes),
        meetingMinutes: Math.round(meetingMinutes),
        tasksCompleted,
        tasksPlanned,
        eventsAttended: events.length,
        productivityScore,
      },
    });
    
    res.json(analytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
});

// Get habit statistics
router.get('/habits', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { period = 'week' } = req.query;
    
    const daysCount = period === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          where: {
            completedAt: { gte: startDate },
          },
        },
      },
    });
    
    const habitStats = habits.map((habit: Habit & { logs: any[] }) => {
      const totalLogs = habit.logs.length;
      const completionRate = (totalLogs / daysCount) * 100;
      
      return {
        id: habit.id,
        title: habit.title,
        totalLogs,
        completionRate,
        color: habit.color,
      };
    });
    
    res.json(habitStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch habit analytics' });
  }
});

export default router;
