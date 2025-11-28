import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Event } from '../lib/api';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
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

  const { createMutation, updateMutation, deleteMutation } = useEventMutations();

  // Fetch events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['calendar-events', isAdmin],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const endpoint = isAdmin ? '/api/admin/events/all' : '/api/events';
      const { data } = await axios.get(`http://localhost:3000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });

  const weekDates = viewMode === 'week' ? getWeekDates(selectedDate) : [];
  const monthDates = viewMode === 'month' ? getMonthDates(selectedDate) : [];

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

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    if (selectedEvent) {
      await updateMutation.mutateAsync({ id: selectedEvent.id, data: eventData });
    } else {
      await createMutation.mutateAsync(eventData);
    }
    setModalOpen(false);
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && confirm(t('calendar.confirmDelete', '이 일정을 삭제하시겠습니까?'))) {
      await deleteMutation.mutateAsync(selectedEvent.id);
      setModalOpen(false);
    }
  };

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
              const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
              return (
                <div 
                  key={i} 
                  className={`week-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-events">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id} 
                        className="calendar-event"
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <div className="event-time">
                          {new Date(event.startAt).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="event-title">{event.title}</div>
                        {isAdmin && (event as any).user && (
                          <div className="event-user">👤 {(event as any).user.name}</div>
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
                        className="calendar-event-compact"
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        {event.title}
                        {isAdmin && (event as any).user && ` (${(event as any).user.name})`}
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
