import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Event } from '../lib/api';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<Event>) => void;
  onDelete?: () => void;
  event?: Event | null;
  initialDate?: Date;
}

const EventModal = ({ isOpen, onClose, onSave, onDelete, event, initialDate }: EventModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        startAt: new Date(event.startAt).toISOString().slice(0, 16),
        endAt: new Date(event.endAt).toISOString().slice(0, 16),
        location: event.location || '',
      });
    } else if (initialDate) {
      const start = new Date(initialDate);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      setFormData({
        title: '',
        description: '',
        startAt: start.toISOString().slice(0, 16),
        endAt: end.toISOString().slice(0, 16),
        location: '',
      });
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
    } as any);
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

          <div className="form-group">
            <label>{t('event.location', '위치')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

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
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
            font-size: 1.5rem;
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
            margin-bottom: 1rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--color-text);
          }

          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-size: 1rem;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: var(--color-primary);
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .modal-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1rem;
            border-top: 1px solid var(--color-border);
          }

          .btn-danger {
            background: #dc3545;
            color: white;
          }

          .btn-danger:hover {
            background: #c82333;
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
