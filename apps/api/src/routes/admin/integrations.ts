import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get all integrations
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(integrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Create integration
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, provider, apiKey, config, active } = req.body;

    const integration = await prisma.integration.create({
      data: {
        name,
        provider,
        apiKey, // In production, encrypt this
        config: config || {},
        active: active !== undefined ? active : true,
      },
    });

    res.json(integration);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// Update integration
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, provider, apiKey, config, active } = req.body;

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        name,
        provider,
        apiKey, // In production, encrypt this
        config,
        active,
      },
    });

    res.json(integration);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// Delete integration
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.integration.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Integration deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});

export default router;
