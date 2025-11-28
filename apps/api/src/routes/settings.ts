import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { triggerWebhook } from '../services/webhook';

const router = Router();

// Get user settings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { ollamaEnabled, ollamaBaseUrl, ollamaModel } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ollamaEnabled,
        ollamaBaseUrl,
        ollamaModel,
      },
      update: {
        ollamaEnabled,
        ollamaBaseUrl,
        ollamaModel,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get webhook config
router.get('/webhook', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    let config = await prisma.webhookConfig.findUnique({
      where: { userId },
    });

    // Create default config if not exists
    if (!config) {
      config = await prisma.webhookConfig.create({
        data: { userId },
      });
    }

    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch webhook config' });
  }
});

// Update webhook config
router.put('/webhook', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { enabled, url, columnMapping } = req.body;

    const config = await prisma.webhookConfig.upsert({
      where: { userId },
      create: {
        userId,
        enabled,
        url,
        columnMapping,
      },
      update: {
        enabled,
        url,
        columnMapping,
      },
    });

    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update webhook config' });
  }
});

// Test webhook
router.post('/webhook/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const testEvent = {
      id: 'test-event-id',
      title: 'Test Event',
      description: 'This is a test event to verify webhook configuration',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 3600000).toISOString(),
      location: 'Test Location',
    };

    await triggerWebhook(userId, 'test', testEvent);

    res.json({ success: true, message: 'Test webhook triggered' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to trigger test webhook' });
  }
});

export default router;
