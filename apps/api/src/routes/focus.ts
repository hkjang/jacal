import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { autoScheduler } from '../services/scheduler';

const router = Router();

// Get suggested focus time blocks
router.get('/suggestions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const weekStart = new Date();
    
    const focusBlocks = await autoScheduler.findFocusBlocks(userId, weekStart);
    
    res.json({ 
      blocks: focusBlocks.map(block => ({
        start: block.start.toISOString(),
        end: block.end.toISOString(),
        duration: (block.end.getTime() - block.start.getTime()) / (1000 * 60 * 60), // hours
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to find focus time suggestions' });
  }
});

// Protect focus time by creating events
router.post('/protect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const createdBlocks = await autoScheduler.protectFocusTime(userId);
    
    res.json({ 
      success: true,
      protected: createdBlocks.length,
      blocks: createdBlocks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to protect focus time' });
  }
});

export default router;
