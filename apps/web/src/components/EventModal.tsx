import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Event, EventType, settingsAPI } from '../lib/api';
import { teamAPI } from '../lib/teamApi';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<Event>, teamId?: string) => void;
  onDelete?: () => void;
  onDuplicate?: (event: Event) => void;
  event?: Event | null;
  initialDate?: Date;
  initialEndDate?: Date;
}

// Reminder options in minutes before event
const REMINDER_OPTIONS = [
  { value: 10, label: '10분 전' },
  { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전' },
  { value: 1440, label: '1일 전' },
];

// Recurrence options
const RECURRENCE_OPTIONS = [
  { value: '', label: '반복 안 함' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
  { value: 'MONTHLY', label: '매월' },
  { value: 'YEARLY', label: '매년' },
];

// Helper function to format date for datetime-local input (preserves local timezone)
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to format date for date input (YYYY-MM-DD)
const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to convert recurrence type to RRULE format
const toRRule = (type: string): string => {
  switch (type) {
    case 'DAILY': return 'FREQ=DAILY';
    case 'WEEKLY': return 'FREQ=WEEKLY';
    case 'MONTHLY': return 'FREQ=MONTHLY';
    case 'YEARLY': return 'FREQ=YEARLY';
    default: return '';
  }
};

// Helper to parse RRULE to recurrence type
const fromRRule = (rrule: string): string => {
  if (rrule.includes('FREQ=DAILY')) return 'DAILY';
  if (rrule.includes('FREQ=WEEKLY')) return 'WEEKLY';
  if (rrule.includes('FREQ=MONTHLY')) return 'MONTHLY';
  if (rrule.includes('FREQ=YEARLY')) return 'YEARLY';
  return '';
};

const EventModal = ({ isOpen, onClose, onSave, onDelete, onDuplicate, event, initialDate, initialEndDate }: EventModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    startDate: '',
    endDate: '',
    location: '',
    eventType: 'OTHER' as EventType,
    isFocusTime: false,
    isAllDay: false,
    recurrence: '',
    reminderMinutes: [] as number[],
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Fetch saved locations from settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsAPI.getSettings,
  });
  const savedLocations = settings?.savedLocations || [];

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamAPI.getMyTeams,
    enabled: isOpen,
  });

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startAt);
      const endDate = new Date(event.endAt);

      // Check if event has reminders and extract minutes
      const reminderMinutes: number[] = [];
      console.log('[EventModal] Loading event:', event.id, 'reminders:', event.reminders);
      if (event.reminders && event.reminders.length > 0) {
        event.reminders.forEach(r => {
          const notifyAt = new Date(r.notifyAt);
          const diffMinutes = Math.round((startDate.getTime() - notifyAt.getTime()) / (1000 * 60));
          console.log('[EventModal] Reminder notifyAt:', r.notifyAt, 'diffMinutes:', diffMinutes);
          if (REMINDER_OPTIONS.some(opt => opt.value === diffMinutes)) {
            reminderMinutes.push(diffMinutes);
          }
        });
      }
      console.log('[EventModal] Extracted reminderMinutes:', reminderMinutes);

      setFormData({
        title: event.title,
        description: event.description || '',
        startAt: formatDateForInput(startDate),
        endAt: formatDateForInput(endDate),
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
        location: event.location || '',
        eventType: event.eventType || 'OTHER',
        isFocusTime: event.isFocusTime || false,
        isAllDay: event.isAllDay || false,
        recurrence: event.recurringRule ? fromRRule(event.recurringRule.rruleText) : '',
        reminderMinutes,
      });
      // If it's a team event, set the team ID
      if ((event as any).isTeamEvent && (event as any).teamId) {
        setSelectedTeamId((event as any).teamId);
      } else {
        setSelectedTeamId('');
      }
    } else if (initialDate) {
      const start = new Date(initialDate);
      const now = new Date();
      // Only set time if initialDate doesn't have time (e.g. from month view click)
      if (start.getHours() === 0 && start.getMinutes() === 0) {
        start.setHours(now.getHours(), now.getMinutes());
      }

      let end: Date;
      if (initialEndDate) {
        end = new Date(initialEndDate);
        if (end.getHours() === 0 && end.getMinutes() === 0) {
          end.setHours(start.getHours() + 1, start.getMinutes());
        }
      } else {
        end = new Date(start);
        end.setHours(start.getHours() + 1);
      }

      setFormData({
        title: '',
        description: '',
        startAt: formatDateForInput(start),
        endAt: formatDateForInput(end),
        startDate: formatDateOnly(start),
        endDate: formatDateOnly(end),
        location: '',
        eventType: 'OTHER',
        isFocusTime: false,
        isAllDay: false,
        recurrence: '',
        reminderMinutes: [],
      });
      setSelectedTeamId('');
    }
  }, [event, initialDate, initialEndDate]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleAllDayChange = (checked: boolean) => {
    if (checked) {
      // When switching to all-day, set times to full day
      const startDate = formData.startAt.split('T')[0];
      const endDate = formData.endAt.split('T')[0];
      setFormData({
        ...formData,
        isAllDay: true,
        startDate: startDate,
        endDate: endDate,
      });
    } else {
      // When switching from all-day, restore times
      const now = new Date();
      const startDateTime = `${formData.startDate}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const endHour = (now.getHours() + 1) % 24;
      const endDateTime = `${formData.endDate}T${String(endHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        ...formData,
        isAllDay: false,
        startAt: startDateTime,
        endAt: endDateTime,
      });
    }
  };

  const toggleReminder = (minutes: number) => {
    setFormData(prev => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes.includes(minutes)
        ? prev.reminderMinutes.filter(m => m !== minutes)
        : [...prev.reminderMinutes, minutes],
    }));
  };

  const handleDuplicate = () => {
    if (event && onDuplicate) {
      onDuplicate(event);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let startAt: Date;
    let endAt: Date;

    if (formData.isAllDay) {
      // For all-day events, set start to 00:00 and end to 23:59
      startAt = new Date(formData.startDate + 'T00:00:00');
      endAt = new Date(formData.endDate + 'T23:59:59');
    } else {
      startAt = new Date(formData.startAt);
      endAt = new Date(formData.endAt);
    }

    // Build reminders array
    const reminders = formData.reminderMinutes.map(minutes => ({
      notifyAt: new Date(startAt.getTime() - minutes * 60 * 1000).toISOString(),
      channel: 'push',
    }));

    // Build recurring rule - use null to indicate deletion of existing rule
    const recurringRule = formData.recurrence ? {
      rruleText: toRRule(formData.recurrence),
    } : null;

    // Debug: Log what we're sending
    console.log('[EventModal] Saving event with recurrence:', formData.recurrence, 'recurringRule:', recurringRule);

    onSave({
      title: formData.title,
      description: formData.description,
      startAt: startAt as any,
      endAt: endAt as any,
      location: formData.location,
      eventType: formData.eventType,
      isFocusTime: formData.isFocusTime,
      isAllDay: formData.isAllDay,
      reminders: reminders as any,
      recurringRule: recurringRule as any,
    }, selectedTeamId || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? t('event.edit', '일정 수정') : t('event.create', '새 일정')}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>{t('event.title', '제목')} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('event.calendar', '캘린더')}</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={!!event} // Disable changing calendar for existing events for now
            >
              <option value="">👤 {t('event.personal', '개인')}</option>
              {teams?.map(team => (
                <option key={team.id} value={team.id}>👥 {team.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('event.description', '설명')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* All-Day Toggle */}
          <div className="all-day-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => handleAllDayChange(e.target.checked)}
              />
              <span className="toggle-icon">📅</span>
              <span className="toggle-text">{t('event.allDay', '종일')}</span>
            </label>
          </div>

          {/* Date/Time inputs */}
          {formData.isAllDay ? (
            <div className="form-row">
              <div className="form-group">
                <label>{t('event.startDate', '시작 날짜')} *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('event.endDate', '종료 날짜')} *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>{t('event.start', '시작 시간')} *</label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('event.end', '종료 시간')} *</label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {/* Recurrence Selector */}
          <div className="form-group">
            <label>🔄 {t('event.recurrence', '반복')}</label>
            <select
              value={formData.recurrence}
              onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Reminder Selector */}
          <div className="form-group">
            <label>🔔 {t('event.reminders', '알림')}</label>
            <div className="reminder-options">
              {REMINDER_OPTIONS.map(opt => (
                <label key={opt.value} className="reminder-chip">
                  <input
                    type="checkbox"
                    checked={formData.reminderMinutes.includes(opt.value)}
                    onChange={() => toggleReminder(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            {!selectedTeamId && (
              <div className="form-group">
                <label>{t('event.type', '일정 유형')}</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                >
                  <option value="WORK">💼 {t('event.type.work', '업무')}</option>
                  <option value="MEETING">👥 {t('event.type.meeting', '회의')}</option>
                  <option value="PERSONAL">😊 {t('event.type.personal', '개인')}</option>
                  <option value="APPOINTMENT">📅 {t('event.type.appointment', '약속')}</option>
                  <option value="OTHER">📌 {t('event.type.other', '기타')}</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>{t('event.location', '위치')}</label>
              <input
                list="location-suggestions"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('event.location.placeholder', '위치를 입력하거나 선택하세요')}
              />
              {savedLocations.length > 0 && (
                <datalist id="location-suggestions">
                  {savedLocations.map((loc, idx) => (
                    <option key={idx} value={loc} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Focus Time Toggle */}
          {!selectedTeamId && (
            <div className="focus-time-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.isFocusTime}
                  onChange={(e) => setFormData({ ...formData, isFocusTime: e.target.checked })}
                />
                <span className="toggle-icon">🎯</span>
                <span className="toggle-text">{t('event.focusTime', '집중 시간')}</span>
              </label>
              {formData.isFocusTime && (
                <p className="toggle-hint">{t('event.focusTimeHint', '방해받지 않는 집중 작업 시간으로 표시됩니다.')}</p>
              )}
            </div>
          )}

          <div className="modal-actions">
            <div className="flex gap-sm">
              {event && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="btn btn-danger"
                >
                  {t('event.delete', '삭제')}
                </button>
              )}
              {event && onDuplicate && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="btn btn-secondary"
                >
                  📋 {t('event.duplicate', '복제')}
                </button>
              )}
            </div>
            <div className="flex gap-sm ml-auto">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                {t('common.cancel', '취소')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('common.save', '저장')}
              </button>
            </div>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--modal-backdrop);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: var(--color-surface);
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--color-border);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--color-text-secondary);
            line-height: 1;
            padding: 0;
            width: 32px;
            height: 32px;
          }

          .modal-close:hover {
            color: var(--color-text);
          }

          .modal-form {
            padding: 1.25rem 1.5rem;
          }

          .form-group {
            margin-bottom: 0.75rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.25rem;
            font-weight: 500;
            color: var(--color-text);
            font-size: 0.875rem;
          }

          .form-group input,
          .form-group textarea,
          .form-group select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-size: 0.875rem;
            font-family: inherit;
            background-color: var(--color-surface);
            color: var(--color-text);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .form-group input:focus,
          .form-group textarea:focus,
          .form-group select:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--focus-ring);
          }

          .form-group select {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 12px;
            padding-right: 2.5rem;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          /* All-Day Toggle */
          .all-day-toggle {
            margin: 0.5rem 0 0.75rem;
            padding: 0.75rem;
            background: var(--color-bg);
            border-radius: 8px;
            border: 1px solid var(--color-border);
          }

          /* Focus Time Toggle */
          .focus-time-toggle {
            margin: 0.75rem 0;
            padding: 0.75rem;
            background: var(--color-bg);
            border-radius: 8px;
            border: 1px solid var(--color-border);
          }

          .toggle-label {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            font-weight: 500;
          }

          .toggle-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--color-primary);
          }

          .toggle-icon {
            font-size: 1.25rem;
          }

          .toggle-text {
            color: var(--color-text);
          }

          .toggle-hint {
            margin: 0.5rem 0 0 2rem;
            font-size: 0.875rem;
            color: var(--color-text-secondary);
          }

          /* Reminder Options */
          .reminder-options {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.25rem;
          }

          .reminder-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s;
          }

          .reminder-chip:hover {
            border-color: var(--color-primary);
          }

          .reminder-chip input {
            width: 14px;
            height: 14px;
            margin: 0;
            accent-color: var(--color-primary);
          }

          .reminder-chip:has(input:checked) {
            background: var(--color-primary-light, rgba(79, 70, 229, 0.1));
            border-color: var(--color-primary);
          }

          .modal-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1rem;
            border-top: 1px solid var(--color-border);
          }

          .btn-danger {
            background: var(--color-error);
            color: white;
          }

          .btn-danger:hover {
            background: hsl(0, 70%, 50%);
          }

          .ml-auto {
            margin-left: auto;
          }
        `}</style>
      </div>
    </div>
  );
};

export default EventModal;
