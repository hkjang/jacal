import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { parseNaturalLanguage } from '../services/nlu';
import { triggerWebhook } from '../services/webhook';

const router = Router();

// Helper: detect action from input text
const detectActionFromInput = (text: string): 'create' | 'update' | 'delete' => {
  const lowerText = text.toLowerCase();
  const deleteKeywords = ['삭제', '지워', '취소', '제거', 'delete', 'remove', 'cancel'];
  const updateKeywords = ['수정', '변경', '미뤄', '당겨', '바꿔', '옮겨', 'change', 'modify', 'reschedule', 'move', 'update'];

  if (deleteKeywords.some(k => lowerText.includes(k))) return 'delete';
  if (updateKeywords.some(k => lowerText.includes(k))) return 'update';
  return 'create';
};

// Helper: find event by title with fallback word search
const findEventByTitle = async (userId: string, searchTitle: string) => {
  let event = await prisma.event.findFirst({
    where: {
      userId,
      title: { contains: searchTitle, mode: 'insensitive' },
    },
  });

  if (!event) {
    const words = searchTitle.split(/\s+/).filter((w: string) => w.length > 1);
    for (const word of words) {
      event = await prisma.event.findFirst({
        where: {
          userId,
          title: { contains: word, mode: 'insensitive' },
        },
      });
      if (event) break;
    }
  }

  return event;
};

// Helper: find task by title with fallback word search
const findTaskByTitle = async (userId: string, searchTitle: string) => {
  let task = await prisma.task.findFirst({
    where: {
      userId,
      title: { contains: searchTitle, mode: 'insensitive' },
    },
  });

  if (!task) {
    const words = searchTitle.split(/\s+/).filter((w: string) => w.length > 1);
    for (const word of words) {
      task = await prisma.task.findFirst({
        where: {
          userId,
          title: { contains: word, mode: 'insensitive' },
        },
      });
      if (task) break;
    }
  }

  return task;
};

// Helper: calculate update data for event
const calculateEventUpdateData = (entity: any, existingEvent: any) => {
  const updateData: any = {};

  if (entity.title && entity.title !== (entity.searchTitle || entity.title)) {
    updateData.title = entity.title;
  }
  if (entity.description !== undefined) {
    updateData.description = entity.description;
  }
  if (entity.startAt) {
    const newStartAt = new Date(entity.startAt);

    // If the new startAt is at midnight, preserve the original time
    if (newStartAt.getHours() === 0 && newStartAt.getMinutes() === 0 && newStartAt.getSeconds() === 0) {
      const origStart = new Date(existingEvent.startAt);
      newStartAt.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds());
    }

    updateData.startAt = newStartAt;

    // Calculate endAt based on original duration
    if (existingEvent.startAt && existingEvent.endAt) {
      const origStartAt = new Date(existingEvent.startAt);
      const origEndAt = new Date(existingEvent.endAt);
      const originalDuration = origEndAt.getTime() - origStartAt.getTime();
      updateData.endAt = new Date(newStartAt.getTime() + originalDuration);
    }
  }
  if (entity.endAt) {
    updateData.endAt = new Date(entity.endAt);
  }
  if (entity.location !== undefined) {
    updateData.location = entity.location;
  }

  return updateData;
};

// Parse natural language - returns confirmation request for delete/update
router.post('/parse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const timezone = user?.timezone || 'UTC';

    const entities = await parseNaturalLanguage(input, userId, timezone);
    const fallbackAction = detectActionFromInput(input);
    console.log(`[NLU Route] Fallback action detected: ${fallbackAction}`);

    const created: any[] = [];
    const pendingActions: any[] = [];

    for (const entity of entities) {
      const action = entity.action || fallbackAction;
      const searchTitle = entity.searchTitle || entity.title;
      console.log(`[NLU Route] Processing: type=${entity.type}, action=${action}, title="${entity.title}"`);

      if (entity.type === 'task') {
        if (action === 'delete') {
          const task = await findTaskByTitle(userId, searchTitle);
          if (task) {
            pendingActions.push({
              action: 'delete',
              type: 'task',
              targetId: task.id,
              targetTitle: task.title,
              message: `"${task.title}" 태스크를 삭제하시겠습니까?`,
            });
          } else {
            created.push({ type: 'task', action: 'not_found', searchTitle });
          }
        } else if (action === 'update') {
          const task = await findTaskByTitle(userId, searchTitle);
          if (task) {
            const changes: any = {};
            if (entity.title && entity.title !== searchTitle) changes.title = entity.title;
            if (entity.dueAt) changes.dueAt = entity.dueAt;
            if (entity.description !== undefined) changes.description = entity.description;

            pendingActions.push({
              action: 'update',
              type: 'task',
              targetId: task.id,
              targetTitle: task.title,
              changes,
              message: `"${task.title}" 태스크를 수정하시겠습니까?`,
            });
          } else {
            created.push({ type: 'task', action: 'not_found', searchTitle });
          }
        } else {
          // Create task immediately
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
        }
      } else if (entity.type === 'event') {
        if (action === 'delete') {
          const event = await findEventByTitle(userId, searchTitle);
          if (event) {
            pendingActions.push({
              action: 'delete',
              type: 'event',
              targetId: event.id,
              targetTitle: event.title,
              message: `"${event.title}" 일정을 삭제하시겠습니까?`,
            });
          } else {
            const allEvents = await prisma.event.findMany({
              where: { userId },
              select: { title: true },
              take: 10,
            });
            console.log(`[NLU Route] Event not found. Available:`, allEvents.map(e => e.title));
            created.push({ type: 'event', action: 'not_found', searchTitle });
          }
        } else if (action === 'update') {
          const event = await findEventByTitle(userId, searchTitle);
          if (event) {
            const changes = calculateEventUpdateData(entity, event);

            // Build readable message
            let changeDesc = '';
            if (changes.startAt) {
              const date = new Date(changes.startAt);
              changeDesc = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시`;
              if (changes.endAt) {
                const end = new Date(changes.endAt);
                changeDesc += ` ~ ${end.getHours()}시`;
              }
            }

            pendingActions.push({
              action: 'update',
              type: 'event',
              targetId: event.id,
              targetTitle: event.title,
              changes,
              message: changeDesc
                ? `"${event.title}" 일정을 ${changeDesc}(으)로 변경하시겠습니까?`
                : `"${event.title}" 일정을 수정하시겠습니까?`,
            });
          } else {
            const allEvents = await prisma.event.findMany({
              where: { userId },
              select: { title: true },
              take: 10,
            });
            console.log(`[NLU Route] Event not found. Available:`, allEvents.map(e => e.title));
            created.push({ type: 'event', action: 'not_found', searchTitle });
          }
        } else {
          // Create event immediately
          const startAt = new Date(entity.startAt!);
          let endAt: Date;

          if (entity.endAt) {
            const parsedEndAt = new Date(entity.endAt);
            endAt = !isNaN(parsedEndAt.getTime()) ? parsedEndAt : new Date(startAt.getTime() + 60 * 60 * 1000);
          } else {
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
          await triggerWebhook(userId, 'create', event, 'event');

          if (entity.preparationTask) {
            const prepTask = await prisma.task.create({
              data: {
                userId,
                title: entity.preparationTask.title,
                description: `Preparation for: ${entity.title}`,
                estimatedMinutes: entity.preparationTask.estimatedMinutes,
                dueAt: startAt,
                priority: 3,
              },
            });
            created.push({ type: 'task', action: 'created', data: prepTask });
          }
        }
      }
    }

    // If there are pending actions, return confirmation request
    if (pendingActions.length > 0) {
      return res.json({
        success: true,
        requiresConfirmation: true,
        pendingActions,
        parsed: entities,
        created,
      });
    }

    res.json({
      success: true,
      requiresConfirmation: false,
      parsed: entities,
      created,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse input' });
  }
});

// Confirm and execute pending actions
router.post('/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { pendingActions } = req.body;

    if (!pendingActions || !Array.isArray(pendingActions)) {
      return res.status(400).json({ error: 'Invalid pending actions' });
    }

    const results: any[] = [];

    for (const pending of pendingActions) {
      const { action, type, targetId, changes } = pending;

      if (type === 'task') {
        // Verify task belongs to user
        const task = await prisma.task.findFirst({
          where: { id: targetId, userId },
        });

        if (!task) {
          results.push({ type: 'task', action: 'not_found', targetId });
          continue;
        }

        if (action === 'delete') {
          await prisma.reminder.deleteMany({
            where: { entityType: 'task', entityId: task.id },
          });
          await prisma.task.delete({ where: { id: task.id } });
          results.push({ type: 'task', action: 'deleted', data: task });
        } else if (action === 'update') {
          const updated = await prisma.task.update({
            where: { id: task.id },
            data: changes,
          });
          results.push({ type: 'task', action: 'updated', data: updated });
        }
      } else if (type === 'event') {
        // Verify event belongs to user
        const event = await prisma.event.findFirst({
          where: { id: targetId, userId },
        });

        if (!event) {
          results.push({ type: 'event', action: 'not_found', targetId });
          continue;
        }

        if (action === 'delete') {
          await prisma.reminder.deleteMany({
            where: { entityType: 'event', entityId: event.id },
          });
          await prisma.recurringRule.deleteMany({
            where: { eventId: event.id },
          });
          await prisma.event.delete({ where: { id: event.id } });
          await triggerWebhook(userId, 'delete', { id: event.id, deleted: true }, 'event');
          results.push({ type: 'event', action: 'deleted', data: event });
        } else if (action === 'update') {
          const updated = await prisma.event.update({
            where: { id: event.id },
            data: changes,
          });
          await triggerWebhook(userId, 'update', updated, 'event');
          results.push({ type: 'event', action: 'updated', data: updated });
        }
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to confirm actions' });
  }
});

export default router;
