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

    // Fallback: detect action from original input if LLM didn't provide it
    const detectActionFromInput = (text: string): 'create' | 'update' | 'delete' => {
      const lowerText = text.toLowerCase();
      const deleteKeywords = ['삭제', '지워', '취소', '제거', 'delete', 'remove', 'cancel'];
      const updateKeywords = ['수정', '변경', '미뤄', '당겨', '바꿔', '옮겨', 'change', 'modify', 'reschedule', 'move', 'update'];

      if (deleteKeywords.some(k => lowerText.includes(k))) return 'delete';
      if (updateKeywords.some(k => lowerText.includes(k))) return 'update';
      return 'create';
    };

    const fallbackAction = detectActionFromInput(input);
    console.log(`[NLU Route] Fallback action detected from input: ${fallbackAction}`);

    // Create entities in database
    const created: any[] = [];

    for (const entity of entities) {
      // Use LLM's action if provided, otherwise use fallback from input keywords
      const action = entity.action || fallbackAction;
      console.log(`[NLU Route] Processing entity: type=${entity.type}, action=${action}, title="${entity.title}", searchTitle="${entity.searchTitle || 'N/A'}"`);

      if (entity.type === 'task') {
        if (action === 'delete') {
          // Find and delete task by title
          const searchTitle = entity.searchTitle || entity.title;
          const task = await prisma.task.findFirst({
            where: {
              userId,
              title: { contains: searchTitle, mode: 'insensitive' },
            },
          });
          if (task) {
            await prisma.reminder.deleteMany({
              where: { entityType: 'task', entityId: task.id },
            });
            await prisma.task.delete({ where: { id: task.id } });
            created.push({ type: 'task', action: 'deleted', data: task });
          } else {
            created.push({ type: 'task', action: 'not_found', searchTitle });
          }
        } else if (action === 'update') {
          // Find and update task by title
          const searchTitle = entity.searchTitle || entity.title;
          const task = await prisma.task.findFirst({
            where: {
              userId,
              title: { contains: searchTitle, mode: 'insensitive' },
            },
          });
          if (task) {
            const updated = await prisma.task.update({
              where: { id: task.id },
              data: {
                title: entity.title !== searchTitle ? entity.title : undefined,
                description: entity.description,
                dueAt: entity.dueAt ? new Date(entity.dueAt) : undefined,
                estimatedMinutes: entity.estimatedMinutes,
                priority: entity.priority,
              },
            });
            created.push({ type: 'task', action: 'updated', data: updated });
          } else {
            created.push({ type: 'task', action: 'not_found', searchTitle });
          }
        } else {
          // Create new task
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
          created.push({ type: 'task', action: 'created', data: task });

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
            created.push({ type: 'task', action: 'created', data: prepTask });
          }
        }
      } else if (entity.type === 'event') {
        if (action === 'delete') {
          // Find and delete event by title
          const searchTitle = entity.searchTitle || entity.title;
          const event = await prisma.event.findFirst({
            where: {
              userId,
              title: { contains: searchTitle, mode: 'insensitive' },
            },
          });
          console.log(`[NLU Route] Delete event search: searchTitle="${searchTitle}", found=${event ? event.id : 'null'}`);
          if (event) {
            // Delete reminders first
            await prisma.reminder.deleteMany({
              where: { entityType: 'event', entityId: event.id },
            });
            // Delete recurring rule
            await prisma.recurringRule.deleteMany({
              where: { eventId: event.id },
            });
            // Delete event
            await prisma.event.delete({ where: { id: event.id } });
            // Trigger webhook
            await triggerWebhook(userId, 'delete', { id: event.id, deleted: true });
            created.push({ type: 'event', action: 'deleted', data: event });
          } else {
            created.push({ type: 'event', action: 'not_found', searchTitle });
          }
        } else if (action === 'update') {
          // Find and update event by title
          const searchTitle = entity.searchTitle || entity.title;
          const event = await prisma.event.findFirst({
            where: {
              userId,
              title: { contains: searchTitle, mode: 'insensitive' },
            },
          });
          if (event) {
            const updated = await prisma.event.update({
              where: { id: event.id },
              data: {
                title: entity.title !== searchTitle ? entity.title : undefined,
                description: entity.description,
                startAt: entity.startAt ? new Date(entity.startAt) : undefined,
                endAt: entity.endAt ? new Date(entity.endAt) : undefined,
                location: entity.location,
              },
            });
            // Trigger webhook
            await triggerWebhook(userId, 'update', updated);
            created.push({ type: 'event', action: 'updated', data: updated });
          } else {
            created.push({ type: 'event', action: 'not_found', searchTitle });
          }
        } else {
          // Create new event
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
          created.push({ type: 'event', action: 'created', data: event });

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
            created.push({ type: 'task', action: 'created', data: prepTask });
          }
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
