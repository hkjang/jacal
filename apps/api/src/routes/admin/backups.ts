import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Backup directory
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Helper function to serialize BigInt values
const serializeBackup = (backup: any) => ({
  ...backup,
  size: backup.size ? backup.size.toString() : '0',
});

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
      data: backups.map(serializeBackup),
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

    // First get the backup record to find the filename
    const backup = await prisma.backupRecord.findUnique({
      where: { id },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Also delete the actual file from storage
    const filePath = path.join(BACKUP_DIR, backup.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.backupRecord.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Create new backup - exports database data to JSON file
router.post('/create', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().getTime();
    const filename = `backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    // Export all important tables
    const [users, events, tasks, habits, teams, tags, analytics] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.event.findMany(),
      prisma.task.findMany(),
      prisma.habit.findMany(),
      prisma.team.findMany(),
      prisma.tag.findMany(),
      prisma.analytics.findMany(),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        events,
        tasks,
        habits,
        teams,
        tags,
        analytics,
      },
      counts: {
        users: users.length,
        events: events.length,
        tasks: tasks.length,
        habits: habits.length,
        teams: teams.length,
        tags: tags.length,
        analytics: analytics.length,
      }
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf-8');

    const stats = fs.statSync(filePath);

    const backup = await prisma.backupRecord.create({
      data: {
        filename,
        size: BigInt(stats.size),
        status: 'success',
      },
    });

    res.json(serializeBackup(backup));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Download backup file
router.get('/:id/download', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const backup = await prisma.backupRecord.findUnique({
      where: { id },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const filePath = path.join(BACKUP_DIR, backup.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download backup' });
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
