import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get app settings
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = await prisma.appSettings.findFirst();
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update app settings
router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      siteName,
      siteUrl,
      defaultLanguage,
      timezone,
      allowRegistration,
      requireEmailVerification,
      maxUploadSizeMB,
    } = req.body;

    let settings = await prisma.appSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.appSettings.create({
        data: {
          siteName,
          siteUrl,
          defaultLanguage,
          timezone,
          allowRegistration,
          requireEmailVerification,
          maxUploadSizeMB,
        },
      });
    } else {
      // Update existing
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data: {
          siteName,
          siteUrl,
          defaultLanguage,
          timezone,
          allowRegistration,
          requireEmailVerification,
          maxUploadSizeMB,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
