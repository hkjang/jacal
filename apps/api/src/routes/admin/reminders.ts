import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

const router = Router();

// Helper function for pagination
const getPaginationParams = (req: Request) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

// Get all reminders (admin only) with webhook logs
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const entityType = req.query.entityType as string | undefined;
        const sentStatus = req.query.sent as string | undefined;

        // Build where clause
        const where: Prisma.ReminderWhereInput = {};

        if (entityType) {
            where.entityType = entityType;
        }

        if (sentStatus !== undefined) {
            where.sent = sentStatus === 'true';
        }

        const [total, reminders] = await Promise.all([
            prisma.reminder.count({ where }),
            prisma.reminder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { notifyAt: 'desc' },
            }),
        ]);

        // Fetch entity details and webhook logs for each reminder
        const remindersWithDetails = await Promise.all(
            reminders.map(async (reminder) => {
                let entity: any = null;
                let user: any = null;

                if (reminder.entityType === 'event') {
                    const event = await prisma.event.findUnique({
                        where: { id: reminder.entityId },
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    });
                    if (event) {
                        entity = {
                            id: event.id,
                            title: event.title,
                            startAt: event.startAt,
                            endAt: event.endAt,
                        };
                        user = event.user;
                    }
                } else if (reminder.entityType === 'task') {
                    const task = await prisma.task.findUnique({
                        where: { id: reminder.entityId },
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    });
                    if (task) {
                        entity = {
                            id: task.id,
                            title: task.title,
                            dueAt: task.dueAt,
                        };
                        user = task.user;
                    }
                }

                // Get webhook logs for this reminder
                const webhookLogs = await prisma.notificationWebhookLog.findMany({
                    where: { reminderId: reminder.id },
                    include: {
                        webhook: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                return {
                    ...reminder,
                    entity,
                    user,
                    webhookLogs,
                };
            })
        );

        // Filter by search if provided (search in entity title or user name/email)
        let filteredReminders = remindersWithDetails;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredReminders = remindersWithDetails.filter((r) => {
                const titleMatch = r.entity?.title?.toLowerCase().includes(searchLower);
                const userNameMatch = r.user?.name?.toLowerCase().includes(searchLower);
                const userEmailMatch = r.user?.email?.toLowerCase().includes(searchLower);
                return titleMatch || userNameMatch || userEmailMatch;
            });
        }

        res.json({
            data: filteredReminders,
            meta: {
                total: search ? filteredReminders.length : total,
                page,
                limit,
                totalPages: Math.ceil((search ? filteredReminders.length : total) / limit),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Get reminder statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const now = new Date();

        const [
            totalReminders,
            sentReminders,
            pendingReminders,
            overdueReminders,
            totalWebhookLogs,
            successfulWebhooks,
            failedWebhooks,
        ] = await Promise.all([
            prisma.reminder.count(),
            prisma.reminder.count({ where: { sent: true } }),
            prisma.reminder.count({ where: { sent: false, notifyAt: { gt: now } } }),
            prisma.reminder.count({ where: { sent: false, notifyAt: { lte: now } } }),
            prisma.notificationWebhookLog.count(),
            prisma.notificationWebhookLog.count({ where: { status: 'success' } }),
            prisma.notificationWebhookLog.count({ where: { status: 'failed' } }),
        ]);

        res.json({
            reminders: {
                total: totalReminders,
                sent: sentReminders,
                pending: pendingReminders,
                overdue: overdueReminders,
            },
            webhooks: {
                total: totalWebhookLogs,
                successful: successfulWebhooks,
                failed: failedWebhooks,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reminder statistics' });
    }
});

export default router;
