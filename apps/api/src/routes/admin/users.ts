import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

import bcrypt from 'bcrypt';

// Get all users (admin only) with pagination and search
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isAdmin: true,
          timezone: true,
          createdAt: true,
          settings: {
            select: {
              id: true,
              ollamaEnabled: true,
              ollamaBaseUrl: true,
              ollamaModel: true,
              pop3Enabled: true,
              pop3Host: true,
              pop3Port: true,
              pop3User: true,
              pop3Password: true,
              pop3Tls: true,
              savedLocations: true,
            }
          },
          webhookConfig: {
            select: {
              id: true,
              enabled: true,
              url: true,
              columnMapping: true,
            }
          },
          _count: {
            select: {
              events: true,
              tasks: true,
              connectedAccounts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, timezone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role || 'USER',
        isAdmin: role === 'ADMIN',
        timezone: timezone || 'UTC',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        timezone: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all events for a specific user (admin only)
router.get('/:userId/events', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { startAt: 'asc' },
    });
    
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

// Get all tasks for a specific user (admin only)
router.get('/:userId/tasks', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user tasks' });
  }
});

// Update user (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        timezone,
        isAdmin: role === 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        timezone: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user settings (admin only)
router.get('/:userId/settings', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Update user settings (admin only)
router.put('/:userId/settings', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { 
      ollamaEnabled, 
      ollamaBaseUrl, 
      ollamaModel,
      pop3Enabled, 
      pop3Host, 
      pop3Port, 
      pop3User, 
      pop3Password, 
      pop3Tls,
      savedLocations 
    } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update data object
    const updateData: any = {};
    if (ollamaEnabled !== undefined) updateData.ollamaEnabled = ollamaEnabled;
    if (ollamaBaseUrl !== undefined) updateData.ollamaBaseUrl = ollamaBaseUrl;
    if (ollamaModel !== undefined) updateData.ollamaModel = ollamaModel;
    if (pop3Enabled !== undefined) updateData.pop3Enabled = pop3Enabled;
    if (pop3Host !== undefined) updateData.pop3Host = pop3Host;
    if (pop3Port !== undefined) updateData.pop3Port = pop3Port;
    if (pop3User !== undefined) updateData.pop3User = pop3User;
    if (pop3Password !== undefined) updateData.pop3Password = pop3Password;
    if (pop3Tls !== undefined) updateData.pop3Tls = pop3Tls;
    if (savedLocations !== undefined) updateData.savedLocations = savedLocations;

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ollamaEnabled: ollamaEnabled ?? false,
        ollamaBaseUrl,
        ollamaModel,
        pop3Enabled: pop3Enabled ?? false,
        pop3Host,
        pop3Port,
        pop3User,
        pop3Password,
        pop3Tls: pop3Tls ?? true,
        savedLocations,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Delete user settings (admin only)
router.delete('/:userId/settings', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete settings if they exist
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings) {
      await prisma.userSettings.delete({ where: { userId } });
    }

    res.json({ success: true, message: 'User settings deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user settings' });
  }
});

// Get user webhook config (admin only)
router.get('/:userId/webhook', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const webhookConfig = await prisma.webhookConfig.findUnique({
      where: { userId },
    });

    res.json(webhookConfig);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch webhook config' });
  }
});

// Update user webhook config (admin only)
router.put('/:userId/webhook', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { enabled, url, columnMapping } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update data object
    const updateData: any = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (url !== undefined) updateData.url = url;
    if (columnMapping !== undefined) updateData.columnMapping = columnMapping;

    // Update or create webhook config
    const webhookConfig = await prisma.webhookConfig.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        enabled: enabled ?? false,
        url,
        columnMapping,
      },
    });

    res.json(webhookConfig);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update webhook config' });
  }
});

// Delete user webhook config (admin only)
router.delete('/:userId/webhook', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete webhook config if it exists
    const webhookConfig = await prisma.webhookConfig.findUnique({ where: { userId } });
    if (webhookConfig) {
      await prisma.webhookConfig.delete({ where: { userId } });
    }

    res.json({ success: true, message: 'Webhook config deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete webhook config' });
  }
});

// Get user integrations (connected accounts) (admin only)
router.get('/:userId/integrations', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const connectedAccounts = await prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerId: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(connectedAccounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch connected accounts' });
  }
});

// Delete user integration (connected account) (admin only)
router.delete('/:userId/integrations/:integrationId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, integrationId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if connected account belongs to user
    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: {
        id: integrationId,
        userId,
      },
    });

    if (!connectedAccount) {
      return res.status(404).json({ error: 'Connected account not found' });
    }

    await prisma.connectedAccount.delete({ where: { id: integrationId } });

    res.json({ success: true, message: 'Connected account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete connected account' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
