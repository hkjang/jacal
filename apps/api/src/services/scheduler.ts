import prisma from '../lib/prisma';

interface TimeSlot {
  start: Date;
  end: Date;
}

export class AutoScheduler {
  /**
   * Find available time slots in a day
   */
  async findAvailableSlots(userId: string, date: Date): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // Work day starts at 9 AM
    
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // Work day ends at 6 PM

    // Get all events for the day
    const events = await prisma.event.findMany({
      where: {
        userId,
        startAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: { startAt: 'asc' },
    });

    const availableSlots: TimeSlot[] = [];
    let currentTime = startOfDay;

    for (const event of events) {
      const eventStart = new Date(event.startAt);
      
      // If there's a gap before this event
      if (currentTime < eventStart) {
        const gap = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60); // minutes
        if (gap >= 30) { // Minimum 30-minute slot
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
          });
        }
      }
      
      currentTime = new Date(event.endAt);
    }

    // Check if there's time left at the end of the day
    if (currentTime < endOfDay) {
      availableSlots.push({
        start: new Date(currentTime),
        end: new Date(endOfDay),
      });
    }

    return availableSlots;
  }

  /**
   * Auto-schedule pending tasks into available calendar slots
   */
  async scheduleTasks(userId: string): Promise<any[]> {
    // Get pending tasks sorted by priority (high to low) and due date
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'pending',
        dueAt: {
          gte: new Date(), // Only future tasks
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueAt: 'asc' },
      ],
    });

    const scheduledEvents = [];
    const today = new Date();

    for (const task of tasks) {
      // Default to 1 hour if no estimate
      const durationMinutes = task.estimatedMinutes || 60;
      
      // Try to schedule in the next 7 days
      let scheduled = false;
      for (let dayOffset = 0; dayOffset < 7 && !scheduled; dayOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + dayOffset);
        
        const availableSlots = await this.findAvailableSlots(userId, checkDate);
        
        // Find a slot that fits the task duration
        for (const slot of availableSlots) {
          const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
          
          if (slotDuration >= durationMinutes) {
            // Schedule the task here
            const eventStart = slot.start;
            const eventEnd = new Date(slot.start.getTime() + durationMinutes * 60 * 1000);
            
            const event = await prisma.event.create({
              data: {
                userId,
                title: `📋 ${task.title}`,
                description: `Auto-scheduled task: ${task.description || ''}`,
                startAt: eventStart,
                endAt: eventEnd,
                sourceCalendar: 'auto-scheduled',
                externalId: task.id, // Link to task
              },
            });
            
            scheduledEvents.push(event);
            scheduled = true;
            break;
          }
        }
      }
    }

    return scheduledEvents;
  }

  /**
   * Find potential focus time blocks (2+ hours of uninterrupted time)
   */
  async findFocusBlocks(userId: string, weekStart: Date): Promise<TimeSlot[]> {
    const focusBlocks: TimeSlot[] = [];

    // Check each day of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + dayOffset);
      
      const availableSlots = await this.findAvailableSlots(userId, checkDate);
      
      // Find slots that are 2+ hours
      for (const slot of availableSlots) {
        const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60); // hours
        
        if (slotDuration >= 2) {
          focusBlocks.push(slot);
        }
      }
    }

    return focusBlocks;
  }

  /**
   * Protect focus time by creating "Focus Time" events
   */
  async protectFocusTime(userId: string): Promise<any[]> {
    const today = new Date();
    const focusBlocks = await this.findFocusBlocks(userId, today);
    
    const createdBlocks = [];

    for (const block of focusBlocks) {
      // Create a 2-hour focus time block
      const focusEnd = new Date(block.start.getTime() + 2 * 60 * 60 * 1000);
      
      const event = await prisma.event.create({
        data: {
          userId,
          title: '🎯 Focus Time',
          description: 'Protected time for deep work',
          startAt: block.start,
          endAt: focusEnd,
          sourceCalendar: 'focus-time',
        },
      });
      
      createdBlocks.push(event);
    }

    return createdBlocks;
  }
}

export const autoScheduler = new AutoScheduler();
