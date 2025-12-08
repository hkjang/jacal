import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Event } from '../lib/api';

interface DayEventsPopoverProps {
    isOpen: boolean;
    position: { x: number; y: number };
    date: Date;
    events: Event[];
    onClose: () => void;
    onEventClick: (event: Event, e: React.MouseEvent) => void;
    onAddEvent: (date: Date) => void;
    getEventTypeClass: (event: Event) => string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const DayEventsPopover = ({
    isOpen,
    position,
    date,
    events,
    onClose,
    onEventClick,
    onAddEvent,
    getEventTypeClass,
    onMouseEnter,
    onMouseLeave
}: DayEventsPopoverProps) => {
    const { t } = useTranslation();
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Calculate position to keep popover within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = 300;
    const popoverMaxHeight = 400;

    let left = position.x;
    let top = position.y;

    if (left + popoverWidth > viewportWidth - 20) {
        left = viewportWidth - popoverWidth - 20;
    }
    if (left < 20) left = 20;

    if (top + popoverMaxHeight > viewportHeight - 20) {
        top = viewportHeight - popoverMaxHeight - 20;
    }
    if (top < 20) top = 20;

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            ref={popoverRef}
            className="day-events-popover"
            style={{
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
                zIndex: 1000,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="day-events-popover-header">
                <h3 className="day-events-popover-title">
                    {date.toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                    })}
                </h3>
                <button onClick={onClose} className="day-events-popover-close">×</button>
            </div>

            <div className="day-events-popover-content">
                {events.length === 0 ? (
                    <div className="day-events-empty">
                        {t('calendar.noEvents', '일정이 없습니다.')}
                    </div>
                ) : (
                    <div className="day-events-list">
                        {events.map(event => (
                            <div
                                key={event.id}
                                className={`day-events-item ${getEventTypeClass(event)}`}
                                onClick={(e) => onEventClick(event, e)}
                            >
                                <div className="day-events-item-time">
                                    {event.isAllDay ? (
                                        <span className="all-day-badge">{t('calendar.allDay', '종일')}</span>
                                    ) : (
                                        `${formatTime(event.startAt)} - ${formatTime(event.endAt)}`
                                    )}
                                </div>
                                <div className="day-events-item-title">{event.title}</div>
                                {event.location && (
                                    <div className="day-events-item-location">📍 {event.location}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="day-events-popover-footer">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onAddEvent(date)}
                >
                    + {t('calendar.newEvent', '새 일정')}
                </button>
            </div>
        </div>
    );
};

export default DayEventsPopover;
