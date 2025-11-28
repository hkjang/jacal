import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Event } from '../lib/api';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

type ViewMode = 'week' | 'month';

interface CalendarProps {
  isAdmin?: boolean;
}

const Calendar = ({ isAdmin = false }: CalendarProps) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Get week dates
  const getWeekDates = (date: Date) => {
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

  // Get month dates
  const getMonthDates = (date: Date) => {
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

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigatePrev = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
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
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`week-day ${isToday ? 'today' : ''}`}>
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-events">
                    {dayEvents.map(event => (
                      <div key={event.id} className="calendar-event">
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
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div 
                  key={i} 
                  className={`month-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                >
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-events-compact">
                    {dayEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="calendar-event-compact">
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

      <style>{`
        .calendar-container {
          padding: 1.5rem;
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .calendar-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }
        
        .week-header, .month-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
        }
        
        .week-day-header, .month-day-header {
          background: var(--color-bg-secondary);
          padding: 0.75rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          min-height: 500px;
        }
        
        .week-day {
          background: white;
          padding: 0.75rem;
          min-height: 150px;
        }
        
        .week-day.today {
          background: #fff8e1;
        }
        
        .day-number {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-text);
        }
        
        .day-events {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .calendar-event {
          background: var(--color-primary-light);
          border-left: 3px solid var(--color-primary);
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.75rem;
        }
        
        .event-time {
          font-weight: 600;
          color: var(--color-primary);
        }
        
        .event-title {
          color: var(--color-text);
        }
        
        .event-user {
          color: var(--color-text-secondary);
          font-size: 0.7rem;
          margin-top: 0.125rem;
        }
        
        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
        }
        
        .month-day {
          background: white;
          padding: 0.5rem;
          min-height: 100px;
        }
        
        .month-day.other-month {
          background: var(--color-bg-secondary);
          opacity: 0.6;
        }
        
        .month-day.today {
          background: #fff8e1;
        }
        
        .day-events-compact {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        .calendar-event-compact {
          background: var(--color-primary-light);
          padding: 0.125rem 0.25rem;
          border-radius: 2px;
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .more-events {
          font-size: 0.7rem;
          color: var(--color-text-secondary);
          margin-top: 0.125rem;
        }
      `}</style>
    </div>
  );
};

export default Calendar;
