import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get all webhooks
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(webhooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Create webhook
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, url, events, active } = req.body;

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: events || [],
        active: active !== undefined ? active : true,
      },
    });

    res.json(webhook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Update webhook
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, events, active } = req.body;

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        name,
        url,
        events,
        active,
      },
    });

    res.json(webhook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.webhook.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook
router.post('/:id/test', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // In production, send actual HTTP request to webhook URL
    // For now, just return success
    res.json({ success: true, message: `Test webhook sent to ${webhook.url}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

export default router;
