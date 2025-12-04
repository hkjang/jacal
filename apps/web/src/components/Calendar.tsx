import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Event } from '../lib/api';
import { adminAPI } from '../lib/adminApi';
import { calendarAPI } from '../lib/calendarApi';
import { teamAPI } from '../lib/teamApi';
import { useTranslation } from 'react-i18next';
import { getWeekDates, getMonthDates, filterEventsForDate } from '../lib/dateUtils';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import { useEventMutations } from '../hooks/useEventMutations';
import EventModal from './EventModal';
import QuickAddPopover from './QuickAddPopover';
import './Calendar.css';

interface CalendarProps {
  isAdmin?: boolean;
}

const Calendar = ({ isAdmin = false }: CalendarProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { 
    viewMode, 
    setViewMode, 
    selectedDate, 
    setSelectedDate,
    navigatePrev, 
    navigateNext, 
    goToToday 
  } = useCalendarNavigation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<Date | null>(null);
  
  // Quick Add state
  const [quickAdd, setQuickAdd] = useState<{ isOpen: boolean; x: number; y: number; date: Date } | null>(null);

  // Drag and drop state
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  // Resize state
  const [resizingEvent, setResizingEvent] = useState<{ event: Event; initialY: number; initialHeight: number } | null>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);

  const { createMutation, updateMutation, deleteMutation } = useEventMutations();

  // Resize handlers
  const handleResizeStart = (event: Event, e: React.MouseEvent, height: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEvent({ event, initialY: e.clientY, initialHeight: height });
    setResizeHeight(height);
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingEvent) return;

      const deltaY = e.clientY - resizingEvent.initialY;
      const newHeight = Math.max(20, resizingEvent.initialHeight + deltaY); // Min height 20px
      setResizeHeight(newHeight);
    };

    const handleResizeEnd = async (e: MouseEvent) => {
      if (!resizingEvent) return;

      const { event } = resizingEvent;
      const finalHeight = resizeHeight || resizingEvent.initialHeight;
      
      // Calculate new end time
      // 50px = 60 minutes -> 1px = 1.2 minutes
      const durationMinutes = (finalHeight / 50) * 60;
      const start = new Date(event.startAt);
      const newEnd = new Date(start.getTime() + durationMinutes * 60 * 1000);

      try {
        if ((event as any).isTeamEvent) {
          await teamAPI.updateEvent(event.id, {
            endAt: newEnd.toISOString(),
          });
        } else {
          await updateMutation.mutateAsync({
            id: event.id,
            data: {
              endAt: newEnd.toISOString(),
            }
          });
        }
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      } catch (error) {
        console.error('Failed to resize event:', error);
        alert(t('calendar.resizeError', '일정 시간 변경에 실패했습니다.'));
      } finally {
        setResizingEvent(null);
        setResizeHeight(null);
      }
    };

    if (resizingEvent) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizingEvent, resizeHeight, updateMutation, queryClient, t]);

  // Fetch events using proper API client
  const { data: eventsData = [] } = useQuery<Event[]>({
    queryKey: ['calendar-events', isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        // For admin, fetch all events from all users with a large limit
        const response = await adminAPI.getEvents({ limit: 1000 });
        return response.data || [];
      } else {
        // For regular users, use calendarAPI to get personal + team events
        return await calendarAPI.getAllEvents();
      }
    },
  });

  const events = Array.isArray(eventsData) ? eventsData : [];
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n': // New event
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSelectedEvent(null);
            setSelectedDateForCreate(selectedDate);
            setModalOpen(true);
          }
          break;
        case 't': // Today
          e.preventDefault();
          goToToday();
          break;
        case 'w': // Week view
          e.preventDefault();
          setViewMode('week');
          break;
        case 'm': // Month view
          e.preventDefault();
          setViewMode('month');
          break;
        case 'arrowleft':
          if (!modalOpen) {
            e.preventDefault();
            navigatePrev();
          }
          break;
        case 'arrowright':
          if (!modalOpen) {
            e.preventDefault();
            navigateNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, modalOpen, goToToday, setViewMode, navigatePrev, navigateNext]);

  // Helper function to get event type color class
  const getEventTypeClass = (event: Event) => {
    if ((event as any).isTeamEvent) return 'event-type-team';
    if ((event as any).isFocusTime) return 'event-type-focus';
    
    switch (event.eventType) {
      case 'WORK': return 'event-type-work';
      case 'MEETING': return 'event-type-meeting';
      case 'PERSONAL': return 'event-type-personal';
      case 'APPOINTMENT': return 'event-type-appointment';
      default: return 'event-type-other';
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((event: Event, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    // Add dragging class to the element
    (e.target as HTMLElement).classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('dragging');
    setDraggedEvent(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((date: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverDate || dragOverDate.toDateString() !== date.toDateString()) {
      setDragOverDate(date);
    }
  }, [dragOverDate]);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback(async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedEvent) return;
    
    try {
      const originalStart = new Date(draggedEvent.startAt);
      const originalEnd = new Date(draggedEvent.endAt);
      const duration = originalEnd.getTime() - originalStart.getTime();
      
      // Calculate time from drop position
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      
      // 50px = 60 minutes
      const minutes = Math.floor((clickY / 50) * 60);
      // Snap to nearest 15 minutes
      const snappedMinutes = Math.round(minutes / 15) * 15;
      
      const hours = Math.floor(snappedMinutes / 60);
      const mins = snappedMinutes % 60;
      
      const newStart = new Date(targetDate);
      newStart.setHours(hours, mins, 0, 0);
      
      const newEnd = new Date(newStart.getTime() + duration);
      
      // Update the event
      if ((draggedEvent as any).isTeamEvent) {
        await teamAPI.updateEvent(draggedEvent.id, {
          startAt: newStart.toISOString(),
          endAt: newEnd.toISOString(),
        });
      } else {
        await updateMutation.mutateAsync({
          id: draggedEvent.id,
          data: {
            startAt: newStart.toISOString(),
            endAt: newEnd.toISOString(),
          }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    } catch (error) {
      console.error('Failed to move event:', error);
      alert(t('calendar.moveError', '일정 이동에 실패했습니다.'));
    } finally {
      setDraggedEvent(null);
      setDragOverDate(null);
    }
  }, [draggedEvent, updateMutation, queryClient, t]);

  const handleTimeSlotClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Calculate 15-minute slot from click position if in time grid
    let targetDate = new Date(date);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    
    // Check if we are in time grid view (clickY is relative to day column)
    // In month view, clickY might be different, but we only use this for Week View Time Grid for now
    if (viewMode === 'week') {
      const minutes = Math.floor((clickY / 50) * 60);
      const snappedMinutes = Math.round(minutes / 15) * 15;
      const hours = Math.floor(snappedMinutes / 60);
      const mins = snappedMinutes % 60;
      targetDate.setHours(hours, mins, 0, 0);
    }

    setQuickAdd({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      date: targetDate
    });
  };

  const handleQuickAddSave = async (title: string) => {
    if (!quickAdd) return;

    try {
      const start = new Date(quickAdd.date);
      const end = new Date(start);
      end.setHours(start.getHours() + 1); // Default 1 hour duration

      await createMutation.mutateAsync({
        title,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        eventType: 'OTHER',
        description: '',
        location: '',
      });
      
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setQuickAdd(null);
    } catch (error) {
      console.error('Failed to quick add event:', error);
      alert(t('calendar.saveError', '일정 저장에 실패했습니다.'));
    }
  };

  const handleQuickAddMoreOptions = () => {
    if (!quickAdd) return;
    setSelectedDateForCreate(quickAdd.date);
    setSelectedEvent(null);
    setQuickAdd(null);
    setModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    // Keep existing behavior for Month view, but redirect to Quick Add for Week view
    if (viewMode === 'week') {
      // This is handled by handleTimeSlotClick attached to the day column
      return;
    }
    setSelectedDateForCreate(date);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickAdd(null); // Close quick add if open
    setSelectedEvent(event);
    setSelectedDateForCreate(null);
    setModalOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<Event>, teamId?: string) => {
    try {
      if (selectedEvent) {
        // Update existing event
        if ((selectedEvent as any).isTeamEvent) {
          await teamAPI.updateEvent(selectedEvent.id, eventData);
        } else {
          await updateMutation.mutateAsync({ id: selectedEvent.id, data: eventData });
        }
      } else {
        // Create new event
        if (teamId) {
          await teamAPI.createEvent(teamId, eventData);
        } else {
          await createMutation.mutateAsync(eventData);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save event:', error);
      alert(t('calendar.saveError', '일정 저장에 실패했습니다.'));
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && confirm(t('calendar.confirmDelete', '이 일정을 삭제하시겠습니까?'))) {
      try {
        if ((selectedEvent as any).isTeamEvent) {
          await teamAPI.deleteEvent(selectedEvent.id);
        } else {
          await deleteMutation.mutateAsync(selectedEvent.id);
        }
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        setModalOpen(false);
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert(t('calendar.deleteError', '일정 삭제에 실패했습니다.'));
      }
    }
  };

  const weekDates = viewMode === 'week' ? getWeekDates(selectedDate) : [];
  const monthDates = viewMode === 'month' ? getMonthDates(selectedDate) : [];

  // Mini Calendar state
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  
  useEffect(() => {
    setMiniCalendarDate(selectedDate);
  }, [selectedDate]);

  const handleMiniCalendarPrev = () => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setMiniCalendarDate(newDate);
  };

  const handleMiniCalendarNext = () => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setMiniCalendarDate(newDate);
  };

  const miniCalendarDates = getMonthDates(miniCalendarDate);

  // Upcoming events (today and tomorrow)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const upcomingEvents = events.filter(event => {
    const eventStart = new Date(event.startAt);
    return eventStart >= today && eventStart < dayAfterTomorrow;
  }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <div className="calendar-container">
      <div className="calendar-layout">
        {/* Sidebar */}
        <div className="calendar-sidebar">
          {/* Mini Calendar */}
          <div className="mini-calendar">
            <div className="mini-calendar-header">
              <div className="mini-calendar-title">
                {miniCalendarDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </div>
              <div className="mini-calendar-nav">
                <button onClick={handleMiniCalendarPrev}>←</button>
                <button onClick={handleMiniCalendarNext}>→</button>
              </div>
            </div>
            <div className="mini-calendar-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="mini-calendar-day-header">{day}</div>
              ))}
              {miniCalendarDates.map(({ date, isCurrentMonth }, i) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div 
                    key={i} 
                    className={`mini-calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => {
                      setSelectedDate(date);
                    }}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="upcoming-events">
            <h3>{t('calendar.upcoming', '다가오는 일정')}</h3>
            <div className="upcoming-list">
              {upcomingEvents.length === 0 ? (
                <div className="text-gray-500 text-sm p-2 text-center">
                  {t('calendar.noUpcoming', '예정된 일정이 없습니다.')}
                </div>
              ) : (
                upcomingEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="upcoming-event-item"
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    <div className={`upcoming-event-color ${getEventTypeClass(event)}`}></div>
                    <div className="upcoming-event-content">
                      <div className="upcoming-event-title">{event.title}</div>
                      <div className="upcoming-event-time">
                        {new Date(event.startAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                        {' '}
                        {new Date(event.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar Content */}
        <div className="calendar-main">
          <div className="calendar-header">
            <div className="flex items-center gap-md">
              <button onClick={goToToday} className="btn btn-secondary">
                {t('calendar.today', '오늘')}
              </button>
              <button onClick={navigatePrev} className="btn btn-secondary">←</button>
              <button onClick={navigateNext} className="btn btn-secondary">→</button>
              <h2 className="calendar-title">
                {selectedDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long',
                  ...(viewMode === 'week' && { day: 'numeric' })
                })}
              </h2>
            </div>
            <div className="flex gap-sm">
              <button 
                onClick={() => setViewMode('week')} 
                className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t('calendar.week', '주간')}
              </button>
              <button 
                onClick={() => setViewMode('month')} 
                className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t('calendar.month', '월간')}
              </button>
            </div>
          </div>

          {viewMode === 'week' && (
            <div className="time-grid-container">
              <div className="time-grid-header">
                <div className="time-grid-header-cell"></div>
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={`time-grid-header-cell ${isToday ? 'today' : ''}`}>
                      {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]} 
                      <span className="ml-1">{date.getDate()}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Multi-day Section */}
              <div className="multi-day-section">
                <div className="multi-day-header">
                  {t('calendar.allDay', '종일')}
                </div>
                <div className="multi-day-grid">
                  {/* Background columns */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="multi-day-bg-col"></div>
                  ))}
                  
                  {/* Multi-day Events */}
                  <div className="multi-day-event-container">
                    {(() => {
                      // Filter and process multi-day events for this week
                      const weekStart = weekDates[0];
                      const weekEnd = new Date(weekDates[6]);
                      weekEnd.setHours(23, 59, 59, 999);

                      const multiDayEvents = events.filter(event => {
                        const start = new Date(event.startAt);
                        const end = new Date(event.endAt);
                        // Check if it overlaps with the week AND is multi-day (diff dates)
                        const overlapsWeek = start <= weekEnd && end >= weekStart;
                        const isMultiDay = start.toDateString() !== end.toDateString();
                        return overlapsWeek && isMultiDay;
                      });

                      // Simple layout algorithm: just stack them for now
                      // In a real app, we'd calculate overlaps to determine 'top' offset
                      // For simplicity here, we'll just map them and let them overlap or stack simply
                      // To do it right, we need to assign rows.
                      
                      const sortedEvents = multiDayEvents.sort((a, b) => {
                         const startA = new Date(a.startAt).getTime();
                         const startB = new Date(b.startAt).getTime();
                         return startA - startB; // Sort by start time
                      });

                      // Assign rows
                      const rows: Event[][] = [];
                      const eventRows: Map<string, number> = new Map();

                      sortedEvents.forEach(event => {
                        const start = new Date(event.startAt);
                        const end = new Date(event.endAt);
                        
                        // Find first row where this event fits
                        let rowIndex = 0;
                        while (true) {
                          const row = rows[rowIndex] || [];
                          const hasOverlap = row.some(existingEvent => {
                            const eStart = new Date(existingEvent.startAt);
                            const eEnd = new Date(existingEvent.endAt);
                            return start < eEnd && end > eStart;
                          });

                          if (!hasOverlap) {
                            if (!rows[rowIndex]) rows[rowIndex] = [];
                            rows[rowIndex].push(event);
                            eventRows.set(event.id, rowIndex);
                            break;
                          }
                          rowIndex++;
                        }
                      });

                      // Calculate height of container based on rows
                      const rowHeight = 24; // 22px height + 2px gap
                      const containerHeight = Math.max(30, rows.length * rowHeight + 4); // Min 30px

                      return (
                        <div style={{ height: `${containerHeight}px`, position: 'relative' }}>
                          {sortedEvents.map(event => {
                            const start = new Date(event.startAt);
                            const end = new Date(event.endAt);
                            const rowIndex = eventRows.get(event.id) || 0;

                            // Calculate start col and width
                            // Clamp start/end to week boundaries
                            const effectiveStart = start < weekStart ? weekStart : start;
                            const effectiveEnd = end > weekEnd ? weekEnd : end;

                            const startDayIndex = effectiveStart.getDay(); // 0-6
                            const endDayIndex = effectiveEnd.getDay(); // 0-6
                            
                            // Calculate span in days
                            // If it wraps the week, we clamped it.
                            // We need to be careful with day indices if week starts on Sunday (0)
                            // weekDates[0] is Sunday.
                            
                            let colStart = effectiveStart.getDay();
                            let colEnd = effectiveEnd.getDay();
                            
                            // If clamped start is weekStart, colStart is 0
                            // If clamped end is weekEnd, colEnd is 6
                            
                            // Calculate duration in days for width
                            // We can use the difference in time from the start of the week
                            const msPerDay = 24 * 60 * 60 * 1000;
                            const startDiff = effectiveStart.getTime() - weekStart.getTime();
                            const startDays = Math.floor(startDiff / msPerDay);
                            
                            const endDiff = effectiveEnd.getTime() - weekStart.getTime();
                            // We want inclusive end day, so we need to see if it ends at 00:00 of next day or later
                            // If end is 00:00, it effectively ends the previous day visually?
                            // Standard practice: if end is 00:00, it doesn't include that day.
                            // But our logic above (isMultiDay) includes it.
                            // Let's use ceiling of duration?
                            
                            // Let's use grid columns. 1-based.
                            // Start column: startDays + 1
                            // Span: 
                            
                            const gridStart = startDays + 1;
                            
                            // Calculate span
                            // If event is Mon 10am to Tue 10am.
                            // Start Mon (1). End Tue (2). Span 2?
                            // Yes, it covers Mon and Tue.
                            
                            let span = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / msPerDay);
                            if (span < 1) span = 1;
                            
                            // Adjust for "ends at midnight"
                            // If ends at 00:00:00, it shouldn't count that day?
                            if (effectiveEnd.getHours() === 0 && effectiveEnd.getMinutes() === 0 && effectiveEnd.getSeconds() === 0) {
                               // If it was exactly 24h (Mon 00:00 to Tue 00:00), span is 1 day (Mon).
                               // But our isMultiDay check (toDateString) says they are different.
                               // Wait, Mon 00:00 to Tue 00:00.
                               // start.toDateString() != end.toDateString(). True.
                               // Should it be multi-day? Yes, usually "All Day".
                               // But visually it only takes up Monday column.
                               // So span should be 1.
                               
                               // If Mon 10am to Tue 10am.
                               // Span should be 2 (Mon and Tue).
                            }
                            
                            // Better span calculation:
                            // (End Day Index - Start Day Index) + 1
                            const dayIndexStart = Math.floor((effectiveStart.getTime() - weekStart.getTime()) / msPerDay);
                            let dayIndexEnd = Math.floor((effectiveEnd.getTime() - weekStart.getTime()) / msPerDay);
                            
                            if (effectiveEnd.getHours() === 0 && effectiveEnd.getMinutes() === 0 && effectiveEnd.getSeconds() === 0 && effectiveEnd > effectiveStart) {
                                dayIndexEnd -= 1;
                            }
                            
                            const colSpan = (dayIndexEnd - dayIndexStart) + 1;

                            return (
                              <div 
                                key={event.id}
                                className={`multi-day-event ${getEventTypeClass(event)}`}
                                style={{
                                  left: `${dayIndexStart * (100/7)}%`,
                                  width: `${colSpan * (100/7)}%`,
                                  top: `${rowIndex * 24}px`
                                }}
                                onClick={(e) => handleEventClick(event, e)}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="time-grid-body">
                <div className="time-column">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="time-slot-label" style={{ top: `${i * 50}px`, position: 'absolute', width: '100%' }}>
                      {i === 0 ? '' : `${i}:00`}
                    </div>
                  ))}
                </div>
                {weekDates.map((date, i) => {
                  // Filter out multi-day events from the time grid
                  const dayEvents = filterEventsForDate(events, date).filter(event => {
                    const start = new Date(event.startAt);
                    const end = new Date(event.endAt);
                    return start.toDateString() === end.toDateString();
                  });
                  
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  
                  return (
                    <div 
                      key={i} 
                      className={`day-column ${isWeekend ? 'weekend' : ''}`}
                      onClick={(e) => handleTimeSlotClick(date, e)}
                      onDragOver={(e) => handleDragOver(date, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(date, e)}
                    >
                      {/* Time slots background */}
                      {Array.from({ length: 24 }).map((_, hour) => (
                        <div key={hour} className="time-slot"></div>
                      ))}

                      {/* Events */}
                      {dayEvents.map(event => {
                        const start = new Date(event.startAt);
                        const end = new Date(event.endAt);
                        const startMinutes = start.getHours() * 60 + start.getMinutes();
                        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                        
                        // Calculate position and height
                        // 50px per hour = 50/60 px per minute
                        const top = (startMinutes * 50) / 60;
                        let height = Math.max((durationMinutes * 50) / 60, 20); // Min height 20px

                        // Use resize height if this event is being resized
                        if (resizingEvent?.event.id === event.id && resizeHeight !== null) {
                          height = resizeHeight;
                        }

                        return (
                          <div 
                            key={event.id} 
                            className={`time-grid-event ${getEventTypeClass(event)} ${draggedEvent?.id === event.id ? 'dragging' : ''} ${resizingEvent?.event.id === event.id ? 'resizing' : ''}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={(e) => handleEventClick(event, e)}
                            draggable={!resizingEvent} // Disable drag while resizing
                            onDragStart={(e) => handleDragStart(event, e)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="event-title">{event.title}</div>
                            <div className="event-time">
                              {start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div 
                              className="resize-handle"
                              onMouseDown={(e) => handleResizeStart(event, e, height)}
                              onClick={(e) => e.stopPropagation()} // Prevent event click
                            />
                          </div>
                        );
                      })}
                      
                      {/* Current Time Indicator (only for today) */}
                      {isToday && (
                        <div 
                          className="current-time-indicator"
                          style={{ 
                            top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * 50 / 60}px` 
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="calendar-month">
              <div className="month-header">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                  <div key={i} className="month-day-header">{day}</div>
                ))}
              </div>
              <div className="month-grid">
                {monthDates.map(({ date, isCurrentMonth }, i) => {
                  const dayEvents = filterEventsForDate(events, date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
                  return (
                    <div 
                      key={i} 
                      className={`month-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="day-number">{date.getDate()}</div>
                      <div className="day-events-compact">
                        {dayEvents.slice(0, 3).map(event => (
                          <div 
                            key={event.id} 
                            className={`calendar-event-compact ${getEventTypeClass(event)}`}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="more-events">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        event={selectedEvent}
        initialDate={selectedDateForCreate || undefined}
      />

      {quickAdd && (
        <QuickAddPopover
          isOpen={quickAdd.isOpen}
          position={{ x: quickAdd.x, y: quickAdd.y }}
          onClose={() => setQuickAdd(null)}
          onSave={handleQuickAddSave}
          onMoreOptions={handleQuickAddMoreOptions}
        />
      )}
    </div>
  );
};

export default Calendar;
