import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get my teams
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { events: true },
        },
      },
    });

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a new team
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Add member to team
router.post('/:id/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    // Check permission (Owner or Admin)
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const newMember = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: userToAdd.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(newMember);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Get team events
router.get('/:id/events', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check membership
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const events = await prisma.sharedEvent.findMany({
      where: { teamId: id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Get team events error:', error);
    res.status(500).json({ error: 'Failed to fetch team events' });
  }
});

// Create shared event
router.post('/:id/events', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, startAt, endAt, location } = req.body;

    // Check membership
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const event = await prisma.sharedEvent.create({
      data: {
        teamId: id,
        authorId: userId,
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        location,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(event);
  } catch (error) {
    console.error('Create shared event error:', error);
    res.status(500).json({ error: 'Failed to create shared event' });
  }
});

// Add comment to shared event
router.post('/events/:eventId/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { eventId } = req.params;
    const { content } = req.body;

    // Verify access to event's team
    const event = await prisma.sharedEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: event.teamId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        sharedEventId: eventId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
