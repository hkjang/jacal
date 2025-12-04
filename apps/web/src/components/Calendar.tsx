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
    navigatePrev, 
    navigateNext, 
    goToToday 
  } = useCalendarNavigation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<Date | null>(null);
  
  // Drag and drop state
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const { createMutation, updateMutation, deleteMutation } = useEventMutations();

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
      
      // Calculate new start time keeping the same time of day
      const newStart = new Date(targetDate);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
      
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

  const handleDateClick = (date: Date) => {
    setSelectedDateForCreate(date);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="calendar-container">
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
        <div className="calendar-week">
          <div className="week-header">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={i} className="week-day-header">{day}</div>
            ))}
          </div>
          <div className="week-grid">
            {weekDates.map((date, i) => {
              const dayEvents = filterEventsForDate(events, date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isDragOver = dragOverDate?.toDateString() === date.toDateString();
              return (
                <div 
                  key={i} 
                  className={`week-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  onClick={() => handleDateClick(date)}
                  onDragOver={(e) => handleDragOver(date, e)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(date, e)}
                >
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-events">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id} 
                        className={`calendar-event ${getEventTypeClass(event)} ${draggedEvent?.id === event.id ? 'dragging' : ''}`}
                        onClick={(e) => handleEventClick(event, e)}
                        draggable
                        onDragStart={(e) => handleDragStart(event, e)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="event-time">
                          {new Date(event.startAt).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="event-title">{event.title}</div>
                        {((event as any).isTeamEvent || (isAdmin && (event as any).user)) && (
                          <div className="event-user">
                            {(event as any).isTeamEvent ? '👥 ' + (event as any).team?.name : '👤 ' + (event as any).user?.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        event={selectedEvent}
        initialDate={selectedDateForCreate || undefined}
      />
    </div>
  );
};

export default Calendar;
