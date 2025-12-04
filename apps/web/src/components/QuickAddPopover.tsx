import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface QuickAddPopoverProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSave: (title: string) => void;
  onMoreOptions: () => void;
}

const QuickAddPopover = ({ isOpen, position, onClose, onSave, onMoreOptions }: QuickAddPopoverProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setTitle('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title);
      setTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate position to keep it within viewport (simplified)
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 200),
    left: Math.min(position.x, window.innerWidth - 300),
    zIndex: 1000,
  };

  return (
    <div 
      ref={popoverRef} 
      className="quick-add-popover" 
      style={style}
    >
      <form onSubmit={handleSubmit}>
        <div className="quick-add-header">
          <button type="button" onClick={onClose} className="close-btn">×</button>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('calendar.quickAddPlaceholder', '새 일정 제목 입력')}
          className="quick-add-input"
        />
        <div className="quick-add-footer">
          <button type="button" onClick={onMoreOptions} className="btn-text">
            {t('calendar.moreOptions', '더 보기')}
          </button>
          <button type="submit" className="btn-primary btn-sm">
            {t('common.save', '저장')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickAddPopover;
