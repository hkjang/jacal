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
  event?: Event | null;
  initialDate?: Date;
}

// Helper function to format date for datetime-local input (preserves local timezone)
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventModal = ({ isOpen, onClose, onSave, onDelete, event, initialDate }: EventModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
    eventType: 'OTHER' as EventType,
    isFocusTime: false,
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
      setFormData({
        title: event.title,
        description: event.description || '',
        startAt: formatDateForInput(new Date(event.startAt)),
        endAt: formatDateForInput(new Date(event.endAt)),
        location: event.location || '',
        eventType: event.eventType || 'OTHER',
        isFocusTime: (event as any).isFocusTime || false,
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
      start.setHours(now.getHours(), now.getMinutes()); // Set to current time
      const end = new Date(start);
      end.setHours(start.getHours() + 1); // Set to 1 hour later
      setFormData({
        title: '',
        description: '',
        startAt: formatDateForInput(start),
        endAt: formatDateForInput(end),
        location: '',
        eventType: 'OTHER',
        isFocusTime: false,
      });
      setSelectedTeamId('');
    }
  }, [event, initialDate]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startAt: new Date(formData.startAt),
      endAt: new Date(formData.endAt),
    } as any, selectedTeamId || undefined);
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
              rows={3}
            />
          </div>

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
            {event && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="btn btn-danger"
              >
                {t('event.delete', '삭제')}
              </button>
            )}
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
            padding: 1.5rem;
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
            padding: 1.5rem;
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

          /* Focus Time Toggle */
          .focus-time-toggle {
            margin: 1rem 0;
            padding: 1rem;
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

