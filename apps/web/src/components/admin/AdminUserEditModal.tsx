import { useTranslation } from 'react-i18next';
import { User } from '../../types/admin';

interface AdminUserEditModalProps {
  user: User;
  onSave: () => void;
  onCancel: () => void;
  onChange: (user: User) => void;
  isSaving: boolean;
}

export default function AdminUserEditModal({
  user,
  onSave,
  onCancel,
  onChange,
  isSaving,
}: AdminUserEditModalProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('admin.editUser', '사용자 수정')}</h2>
        <div className="form-group">
          <label>{t('admin.name', '이름')}</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => onChange({ ...user, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>{t('admin.email', '이메일')}</label>
          <input
            type="email"
            value={user.email}
            onChange={(e) => onChange({ ...user, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>{t('admin.role', '역할')}</label>
          <select
            value={user.role}
            onChange={(e) => onChange({ ...user, role: e.target.value as 'ADMIN' | 'USER' })}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('admin.timezone', '시간대')}</label>
          <input
            type="text"
            value={user.timezone}
            onChange={(e) => onChange({ ...user, timezone: e.target.value })}
          />
        </div>
        <div className="modal-actions">
          <button
            onClick={onSave}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? t('common.saving', '저장 중...') : t('common.save', '저장')}
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            {t('common.cancel', '취소')}
          </button>
        </div>

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
            z-index: 10000;
          }

          .modal-content {
            background: var(--color-surface, white);
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
            position: relative;
            z-index: 10001;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--color-text);
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            font-size: 1rem;
            background: var(--color-surface, white);
            color: var(--color-text);
            transition: all 0.2s ease;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px hsla(220, 90%, 56%, 0.1);
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }
        `}</style>
      </div>
    </div>
  );
}
