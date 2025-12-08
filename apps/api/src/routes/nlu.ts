import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { parseNaturalLanguage } from '../services/nlu';
import { triggerWebhook } from '../services/webhook';

const router = Router();

// Parse natural language and create tasks/events
router.post('/parse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Get user timezone
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const timezone = user?.timezone || 'UTC';

    // Parse natural language with user-specific settings
    const entities = await parseNaturalLanguage(input, userId, timezone);

    // Create entities in database
    const created: any[] = [];

    for (const entity of entities) {
      if (entity.type === 'task') {
        const task = await prisma.task.create({
          data: {
            userId,
            title: entity.title,
            description: entity.description,
            dueAt: entity.dueAt ? new Date(entity.dueAt) : null,
            estimatedMinutes: entity.estimatedMinutes,
            priority: entity.priority || 0,
          },
        });
        created.push({ type: 'task', data: task });

        // Create preparation task if specified
        if (entity.preparationTask) {
          const prepTask = await prisma.task.create({
            data: {
              userId,
              title: entity.preparationTask.title,
              description: `Preparation for: ${entity.title}`,
              estimatedMinutes: entity.preparationTask.estimatedMinutes,
              priority: (entity.priority || 0) + 1,
            },
          });
          created.push({ type: 'task', data: prepTask });
        }
      } else if (entity.type === 'event') {
        // Calculate startAt and endAt with fallback for missing endAt
        const startAt = new Date(entity.startAt!);
        let endAt: Date;

        if (entity.endAt) {
          const parsedEndAt = new Date(entity.endAt);
          // Check if endAt is a valid date
          if (!isNaN(parsedEndAt.getTime())) {
            endAt = parsedEndAt;
          } else {
            // If endAt is invalid, default to startAt + 1 hour
            endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
          }
        } else {
          // If endAt is not provided, default to startAt + 1 hour
          endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
        }

        const event = await prisma.event.create({
          data: {
            userId,
            title: entity.title,
            description: entity.description,
            startAt,
            endAt,
            location: entity.location,
            sourceCalendar: 'manual',
          },
        });
        created.push({ type: 'event', data: event });

        // Trigger webhook if configured
        await triggerWebhook(userId, 'create', event);

        // Create preparation task if specified
        if (entity.preparationTask) {
          const prepTask = await prisma.task.create({
            data: {
              userId,
              title: entity.preparationTask.title,
              description: `Preparation for: ${entity.title}`,
              estimatedMinutes: entity.preparationTask.estimatedMinutes,
              dueAt: new Date(entity.startAt!), // Due before event starts
              priority: 3,
            },
          });
          created.push({ type: 'task', data: prepTask });
        }
      }
    }

    res.json({
      success: true,
      parsed: entities,
      created
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse input' });
  }
});

export default router;
