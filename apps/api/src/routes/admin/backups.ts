import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get all backups with pagination
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [backups, total] = await Promise.all([
      prisma.backupRecord.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.backupRecord.count(),
    ]);

    res.json({
      data: backups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Delete backup
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.backupRecord.delete({
      where: { id },
    });

    // In production, also delete the actual file from storage

    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Create new backup
router.post('/create', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    // In production, this would trigger pg_dump or backup service
    const backup = await prisma.backupRecord.create({
      data: {
        filename: `backup_${new Date().getTime()}.sql`,
        size: BigInt(Math.floor(Math.random() * 50000000)), // Mock size
        status: 'success',
      },
    });

    res.json(backup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Restore backup
router.post('/:id/restore', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const backup = await prisma.backupRecord.findUnique({
      where: { id },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // In production, this would trigger restore process
    res.json({ success: true, message: 'Backup restore initiated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

export default router;
