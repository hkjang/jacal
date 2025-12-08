import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get all notification webhooks
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const webhooks = await prisma.notificationWebhook.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { logs: true },
                },
            },
        });

        res.json(webhooks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notification webhooks' });
    }
});

// Get single notification webhook
router.get('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const webhook = await prisma.notificationWebhook.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { logs: true },
                },
            },
        });

        if (!webhook) {
            return res.status(404).json({ error: 'Notification webhook not found' });
        }

        res.json(webhook);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notification webhook' });
    }
});

// Create notification webhook
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { name, url, active, headers } = req.body;

        if (!name || !url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }

        const webhook = await prisma.notificationWebhook.create({
            data: {
                name,
                url,
                active: active !== undefined ? active : true,
                headers: headers || null,
            },
        });

        res.json(webhook);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create notification webhook' });
    }
});

// Update notification webhook
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, url, active, headers } = req.body;

        const webhook = await prisma.notificationWebhook.update({
            where: { id },
            data: {
                name,
                url,
                active,
                headers,
            },
        });

        res.json(webhook);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update notification webhook' });
    }
});

// Delete notification webhook
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.notificationWebhook.delete({
            where: { id },
        });

        res.json({ success: true, message: 'Notification webhook deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete notification webhook' });
    }
});

// Test notification webhook
router.post('/:id/test', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const webhook = await prisma.notificationWebhook.findUnique({
            where: { id },
        });

        if (!webhook) {
            return res.status(404).json({ error: 'Notification webhook not found' });
        }

        // Send actual test request
        const fetch = (await import('node-fetch')).default;

        const testPayload = {
            type: 'test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test notification from Jacal',
                eventTitle: 'Test Event',
                eventTime: new Date().toISOString(),
                userName: 'System Test',
            },
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add custom headers if configured
        if (webhook.headers && typeof webhook.headers === 'object') {
            Object.assign(headers, webhook.headers);
        }

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(testPayload),
        });

        if (response.ok) {
            res.json({ success: true, message: `Test notification sent successfully`, status: response.status });
        } else {
            const responseText = await response.text();
            res.status(400).json({
                success: false,
                message: `Webhook returned error: ${response.status}`,
                status: response.status,
                response: responseText.substring(0, 500),
            });
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to test notification webhook: ' + error.message });
    }
});

// Get webhook logs
router.get('/logs/all', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const webhookId = req.query.webhookId as string | undefined;
        const status = req.query.status as string | undefined;

        const where: any = {};
        if (webhookId) where.webhookId = webhookId;
        if (status) where.status = status;

        const [total, logs] = await Promise.all([
            prisma.notificationWebhookLog.count({ where }),
            prisma.notificationWebhookLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    webhook: {
                        select: {
                            id: true,
                            name: true,
                            url: true,
                        },
                    },
                },
            }),
        ]);

        res.json({
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
});

// Resend failed webhook
router.post('/logs/:id/resend', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const log = await prisma.notificationWebhookLog.findUnique({
            where: { id },
            include: {
                webhook: true,
            },
        });

        if (!log) {
            return res.status(404).json({ error: 'Webhook log not found' });
        }

        if (!log.webhook.active) {
            return res.status(400).json({ error: 'Webhook is not active' });
        }

        // Get the reminder details
        const reminder = await prisma.reminder.findUnique({
            where: { id: log.reminderId },
        });

        if (!reminder) {
            return res.status(404).json({ error: 'Associated reminder not found' });
        }

        // Fetch event/task details
        let entityTitle = 'Unknown';
        let entityUser = 'Unknown';

        if (reminder.entityType === 'event') {
            const event = await prisma.event.findUnique({
                where: { id: reminder.entityId },
                include: { user: { select: { name: true, email: true } } },
            });
            if (event) {
                entityTitle = event.title;
                entityUser = event.user.name || event.user.email;
            }
        } else if (reminder.entityType === 'task') {
            const task = await prisma.task.findUnique({
                where: { id: reminder.entityId },
                include: { user: { select: { name: true, email: true } } },
            });
            if (task) {
                entityTitle = task.title;
                entityUser = task.user.name || task.user.email;
            }
        }

        // Send webhook
        const fetch = (await import('node-fetch')).default;

        const payload = {
            type: 'reminder',
            timestamp: new Date().toISOString(),
            data: {
                reminderId: reminder.id,
                entityType: reminder.entityType,
                entityId: reminder.entityId,
                entityTitle,
                userName: entityUser,
                notifyAt: reminder.notifyAt.toISOString(),
                isResend: true,
            },
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (log.webhook.headers && typeof log.webhook.headers === 'object') {
            Object.assign(headers, log.webhook.headers);
        }

        try {
            const response = await fetch(log.webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();

            // Update log
            await prisma.notificationWebhookLog.update({
                where: { id },
                data: {
                    status: response.ok ? 'success' : 'failed',
                    statusCode: response.status,
                    response: response.ok ? null : responseText.substring(0, 1000),
                    sentAt: new Date(),
                },
            });

            if (response.ok) {
                res.json({ success: true, message: 'Webhook resent successfully' });
            } else {
                res.status(400).json({
                    success: false,
                    message: `Webhook returned error: ${response.status}`,
                    response: responseText.substring(0, 500),
                });
            }
        } catch (fetchError: any) {
            await prisma.notificationWebhookLog.update({
                where: { id },
                data: {
                    status: 'failed',
                    response: fetchError.message,
                    sentAt: new Date(),
                },
            });

            res.status(500).json({ error: 'Failed to resend webhook: ' + fetchError.message });
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to resend webhook: ' + error.message });
    }
});

export default router;
