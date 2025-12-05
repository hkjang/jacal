export const getWeekDates = (date: Date) => {
  const week = [];
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  return week;
};

export const getMonthDates = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const dates = [];
  const startDay = firstDay.getDay();
  
  // Add previous month's trailing dates
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() - i - 1);
    dates.push({ date: d, isCurrentMonth: false });
  }
  
  // Add current month dates
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // Add next month's leading dates
  const remaining = 42 - dates.length; // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(lastDay);
    d.setDate(lastDay.getDate() + i);
    dates.push({ date: d, isCurrentMonth: false });
  }
  
  return dates;
};

export const filterEventsForDate = (events: any[] | undefined, date: Date) => {
  if (!Array.isArray(events)) {
    console.log('🔍 filterEventsForDate - Events is not an array:', events);
    return [];
  }
  
  // Normalize target date to start of day for comparison
  const targetStart = new Date(date);
  targetStart.setHours(0, 0, 0, 0);
  const targetEnd = new Date(date);
  targetEnd.setHours(23, 59, 59, 999);
  
  const filtered = events.filter(event => {
    const eventStart = new Date(event.startAt);
    const eventEnd = new Date(event.endAt);
    
    // Event overlaps with target date if:
    // - Event starts before or during target day AND
    // - Event ends after or during target day
    const overlaps = eventStart <= targetEnd && eventEnd >= targetStart;
    
    return overlaps;
  });
  
  return filtered;
};
