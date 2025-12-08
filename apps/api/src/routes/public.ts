import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Get public app configuration (no auth required)
router.get('/config', async (req: Request, res: Response) => {
    try {
        const settings = await prisma.appSettings.findFirst();

        res.json({
            allowRegistration: settings?.allowRegistration ?? true,
            siteName: settings?.siteName ?? 'Jacal',
        });
    } catch (error) {
        console.error('Failed to fetch public config:', error);
        // Default to allow registration if settings can't be fetched
        res.json({
            allowRegistration: true,
            siteName: 'Jacal',
        });
    }
});

export default router;
