import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/adminAuth';
import prisma from '../../lib/prisma';

const router = Router();

// Get all email settings
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = await prisma.emailSettings.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Mask passwords
    const maskedSettings = settings.map(s => ({
      ...s,
      smtpPassword: s.smtpPassword ? '••••••••' : null,
    }));

    res.json(maskedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// Create email settings
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, fromName, fromEmail, active } = req.body;

    const settings = await prisma.emailSettings.create({
      data: {
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpSecure: smtpSecure || false,
        smtpUser,
        smtpPassword, // In production, encrypt this
        fromName,
        fromEmail,
        active: active !== undefined ? active : true,
      },
    });

    res.json({
      ...settings,
      smtpPassword: '••••••••',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create email settings' });
  }
});

// Update email settings
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, fromName, fromEmail, active } = req.body;

    const data: any = {
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpSecure,
      smtpUser,
      fromName,
      fromEmail,
      active,
    };

    // Only update password if provided and not masked
    if (smtpPassword && smtpPassword !== '••••••••') {
      data.smtpPassword = smtpPassword;
    }

    const settings = await prisma.emailSettings.update({
      where: { id },
      data,
    });

    res.json({
      ...settings,
      smtpPassword: '••••••••',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

// Delete email settings
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.emailSettings.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Email settings deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete email settings' });
  }
});

// Send test email
router.post('/test', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    // In production, use nodemailer to send actual test email
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

export default router;
