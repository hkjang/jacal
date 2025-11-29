import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Admin middleware
export const adminMiddleware = async (req: Request, res: Response, next: any) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true, isAdmin: true },
    });
    
    if (!user || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization failed' });
  }
};
