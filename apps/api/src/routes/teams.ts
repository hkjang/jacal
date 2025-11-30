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

// Update team
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, description } = req.body;

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

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check permission (Owner only)
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!member || member.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only team owner can delete the team' });
    }

    await prisma.team.delete({
      where: { id },
    });

    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
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

// Remove member from team
router.delete('/:id/members/:memberId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id, memberId } = req.params;

    // Check permission (Owner or Admin)
    const requester = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId,
        },
      },
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Cannot remove self (use leave endpoint if we implement it, or just delete team if owner)
    if (userId === memberId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Check target member existence
    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: memberId,
        },
      },
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Owner cannot be removed
    if (targetMember.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot remove team owner' });
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: id,
          userId: memberId,
        },
      },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
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

// Update shared event
router.put('/events/:eventId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { eventId } = req.params;
    const { title, description, startAt, endAt, location } = req.body;

    const event = await prisma.sharedEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check membership
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

    // Allow update if author or admin/owner
    if (event.authorId !== userId && member.role === 'MEMBER') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updatedEvent = await prisma.sharedEvent.update({
      where: { id: eventId },
      data: {
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

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update shared event error:', error);
    res.status(500).json({ error: 'Failed to update shared event' });
  }
});

// Delete shared event
router.delete('/events/:eventId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { eventId } = req.params;

    const event = await prisma.sharedEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check membership
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

    // Allow delete if author or admin/owner
    if (event.authorId !== userId && member.role === 'MEMBER') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.sharedEvent.delete({
      where: { id: eventId },
    });

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete shared event error:', error);
    res.status(500).json({ error: 'Failed to delete shared event' });
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
