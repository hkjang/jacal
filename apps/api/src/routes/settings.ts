import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { triggerWebhook } from '../services/webhook';
import { AutoRegisterService } from '../services/auto-register';

const router = Router();

// Get user settings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
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
    const userId = req.user!.userId;
    const { ollamaEnabled, ollamaBaseUrl, ollamaModel } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ollamaEnabled,
        ollamaBaseUrl,
        ollamaModel,
        pop3Enabled: req.body.pop3Enabled,
        pop3Host: req.body.pop3Host,
        pop3Port: req.body.pop3Port ? parseInt(req.body.pop3Port) : undefined,
        pop3User: req.body.pop3User,
        pop3Password: req.body.pop3Password,
      },
      update: {
        ollamaEnabled,
        ollamaBaseUrl,
        ollamaModel,
        pop3Enabled: req.body.pop3Enabled,
        pop3Host: req.body.pop3Host,
        pop3Port: req.body.pop3Port ? parseInt(req.body.pop3Port) : undefined,
        pop3User: req.body.pop3User,
        pop3Password: req.body.pop3Password,
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
    const userId = req.user!.userId;
    
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
    const userId = req.user!.userId;
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
    const userId = req.user!.userId;
    
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

// Test POP3 connection
router.post('/email/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { host, port, user, password } = req.body;
    
    // Dynamically import EmailService to avoid circular dependency issues if any
    const { EmailService } = await import('../services/email');
    
    const emailService = new EmailService({
      host,
      port: parseInt(port),
      user,
      password,
      tls: true,
    });

    // Try to fetch 1 email to verify connection
    await emailService.fetchEmails(1);

    res.json({ success: true, message: 'Connection successful' });
  } catch (error: any) {
    console.error('POP3 Test Error:', error);
    res.status(400).json({ error: 'Connection failed: ' + error.message });
  }
});

// Add POST /email/sync route
router.post('/email/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!settings || !settings.pop3Enabled) {
      return res.status(400).json({ error: 'Email integration not enabled or settings not found' });
    }

    const autoRegisterService = new AutoRegisterService();
    await autoRegisterService.processUserEmails(settings);

    res.json({ success: true, message: 'Sync triggered' });
  } catch (error: any) {
    console.error('Manual email sync failed:', error);
    res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

export default router;
