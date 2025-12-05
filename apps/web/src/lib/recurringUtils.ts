import { RRule } from 'rrule';
import { Event } from './api';

/**
 * Expands recurring events into individual instances within a date range
 * @param events - Array of events (some may have recurringRule)
 * @param rangeStart - Start of the date range to generate instances for
 * @param rangeEnd - End of the date range to generate instances for
 * @returns Array of events with recurring events expanded into instances
 */
export const expandRecurringEvents = (
  events: Event[],
  rangeStart: Date,
  rangeEnd: Date
): Event[] => {
  const expandedEvents: Event[] = [];

  for (const event of events) {
    if (event.recurringRule && event.recurringRule.rruleText) {
      // This is a recurring event - generate instances
      try {
        const originalStart = new Date(event.startAt);
        const originalEnd = new Date(event.endAt);
        const duration = originalEnd.getTime() - originalStart.getTime();

        // Parse the RRULE
        // We need to add DTSTART to the rule for proper date generation
        let rruleText = event.recurringRule.rruleText;
        
        // Create the RRule with the event's start date
        const rule = new RRule({
          ...RRule.parseString(rruleText),
          dtstart: originalStart,
        });

        // Get all occurrences within the range
        // Add buffer to range to ensure we catch events that span midnight
        const occurrences = rule.between(
          new Date(rangeStart.getTime() - duration),
          rangeEnd,
          true // inc = include start/end dates
        );

        // Generate event instances for each occurrence
        for (const occurrence of occurrences) {
          const instanceStart = occurrence;
          const instanceEnd = new Date(occurrence.getTime() + duration);

          // Skip if this instance doesn't overlap with our range
          if (instanceEnd < rangeStart || instanceStart > rangeEnd) {
            continue;
          }

          // Create a new event instance
          const eventInstance: Event = {
            ...event,
            // Create a virtual ID for this instance (original ID + occurrence date)
            id: `${event.id}_${instanceStart.getTime()}`,
            startAt: instanceStart.toISOString(),
            endAt: instanceEnd.toISOString(),
            // Mark this as a recurring instance for UI purposes
            _isRecurringInstance: true,
            _originalEventId: event.id,
            _occurrenceDate: instanceStart.toISOString(),
          } as Event & { 
            _isRecurringInstance: boolean; 
            _originalEventId: string;
            _occurrenceDate: string;
          };

          expandedEvents.push(eventInstance);
        }
      } catch (error) {
        console.error('Failed to parse recurring rule:', event.recurringRule.rruleText, error);
        // If parsing fails, just include the original event
        expandedEvents.push(event);
      }
    } else {
      // Non-recurring event - just add it as-is
      expandedEvents.push(event);
    }
  }

  return expandedEvents;
};

/**
 * Get the date range for the current calendar view
 * @param viewMode - 'week' or 'month'
 * @param selectedDate - The currently selected date
 * @returns Object with start and end dates for the view
 */
export const getViewDateRange = (
  viewMode: 'week' | 'month',
  selectedDate: Date
): { start: Date; end: Date } => {
  const start = new Date(selectedDate);
  const end = new Date(selectedDate);

  if (viewMode === 'week') {
    // Start from Sunday of the current week
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    
    // End on Saturday of the current week
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    // Month view
    // Start from the first day of the month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    
    // Go back to include previous month's visible days (up to 6 days before)
    const firstDayOfWeek = start.getDay();
    start.setDate(start.getDate() - firstDayOfWeek);
    
    // End includes up to 6 weeks of dates
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Last day of current month
    const lastDayOfWeek = end.getDay();
    end.setDate(end.getDate() + (6 - lastDayOfWeek));
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};
