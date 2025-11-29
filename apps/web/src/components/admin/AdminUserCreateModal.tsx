import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AdminUserCreateModalProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function AdminUserCreateModal({
  onSave,
  onCancel,
  isSaving,
}: AdminUserCreateModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    timezone: 'UTC',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('admin.createUser', '사용자 생성')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('admin.name', '이름')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('admin.email', '이메일')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('admin.password', '비밀번호')}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>{t('admin.role', '역할')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('admin.timezone', '시간대')}</label>
            <input
              type="text"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? t('common.saving', '저장 중...') : t('common.create', '생성')}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              {t('common.cancel', '취소')}
            </button>
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
            background: var(--bg-primary);
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg-secondary);
            color: var(--text-primary);
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            justify-content: flex-end;
          }
        `}</style>
      </div>
    </div>
  );
}
