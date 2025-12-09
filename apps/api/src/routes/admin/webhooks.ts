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

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Jacal',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    // Send actual HTTP request to webhook URL
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      res.json({
        success: true,
        message: `Test webhook sent successfully to ${webhook.url}`,
        status: response.status,
      });
    } else {
      const errorText = await response.text();
      res.status(400).json({
        success: false,
        error: `Webhook returned error: ${response.status} ${response.statusText}`,
        details: errorText.substring(0, 500),
      });
    }
  } catch (error: any) {
    console.error('Webhook test error:', error);
    res.status(500).json({
      error: 'Failed to test webhook',
      details: error.message || 'Network error or invalid URL',
    });
  }
});

export default router;
