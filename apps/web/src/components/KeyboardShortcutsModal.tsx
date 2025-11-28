import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  const { t } = useTranslation();

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

  if (!isOpen) return null;

  const shortcuts = [
    { category: t('shortcuts.global', '전역'), items: [
      { keys: 'Alt+1 / Cmd+1', description: t('shortcuts.goHome', '홈으로 이동') },
      { keys: 'Alt+2 / Cmd+2', description: t('shortcuts.goCalendar', '캘린더로 이동') },
      { keys: 'Alt+3 / Cmd+3', description: t('shortcuts.goSettings', '설정으로 이동') },
      { keys: 'Ctrl+K / Cmd+K', description: t('shortcuts.focusInput', '입력창 포커스') },
      { keys: '?', description: t('shortcuts.showHelp', '도움말 보기') },
    ]},
    { category: t('shortcuts.calendar', '캘린더'), items: [
      { keys: 'T', description: t('shortcuts.today', '오늘로 이동') },
      { keys: 'W', description: t('shortcuts.weekView', '주간 보기') },
      { keys: 'M', description: t('shortcuts.monthView', '월간 보기') },
      { keys: '← / →', description: t('shortcuts.navigate', '이전/다음 기간') },
    ]},
    { category: t('shortcuts.modals', '모달'), items: [
      { keys: 'Esc', description: t('shortcuts.closeModal', '모달 닫기') },
      { keys: 'Ctrl+Enter / Cmd+Enter', description: t('shortcuts.submit', '폼 제출') },
    ]},
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()} style={{
        background: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            {t('shortcuts.title', '키보드 단축키')}
          </h2>
          <button onClick={onClose} className="modal-close" style={{
            background: 'none',
            border: 'none',
            fontSize: '2rem',
            cursor: 'pointer',
            color: '#666',
            lineHeight: 1,
            padding: 0,
            width: '32px',
            height: '32px',
          }}>×</button>
        </div>

        <div className="shortcuts-content" style={{ padding: '1.5rem' }}>
          {shortcuts.map((section, idx) => (
            <div key={idx} className="shortcut-section" style={{
              marginBottom: idx === shortcuts.length - 1 ? 0 : '2rem'
            }}>
              <h3 className="shortcut-category" style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#6366f1',
              }}>{section.category}</h3>
              <div className="shortcut-list" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                {section.items.map((item, i) => (
                  <div key={i} className="shortcut-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}>
                    <kbd className="shortcut-keys" style={{
                      fontFamily: "'Monaco', 'Courier New', monospace",
                      background: '#f5f5f5',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #d0d0d0',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      minWidth: '180px',
                      display: 'inline-block',
                    }}>{item.keys}</kbd>
                    <span className="shortcut-desc" style={{
                      flex: 1,
                      color: '#666',
                    }}>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;

