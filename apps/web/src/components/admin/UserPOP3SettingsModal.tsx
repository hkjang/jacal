import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../lib/adminApi';
import { User } from '../../types/admin';
import './UserPOP3SettingsModal.css';

interface UserPOP3SettingsModalProps {
  user: User;
  onClose: () => void;
}

export default function UserPOP3SettingsModal({ user, onClose }: UserPOP3SettingsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    pop3Enabled: user.settings?.pop3Enabled ?? false,
    pop3Host: user.settings?.pop3Host ?? '',
    pop3Port: user.settings?.pop3Port ?? 995,
    pop3User: user.settings?.pop3User ?? '',
    pop3Password: user.settings?.pop3Password ?? '',
    pop3Tls: user.settings?.pop3Tls ?? true,
  });

  const updateMutation = useMutation({
    mutationFn: () => adminAPI.updateUserSettings(user.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('admin.pop3Settings', 'POP3 설정')} - {user.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.pop3Enabled}
                onChange={(e) => setFormData({ ...formData, pop3Enabled: e.target.checked })}
              />
              <span>{t('admin.enablePOP3', 'POP3 사용')}</span>
            </label>
          </div>

          {formData.pop3Enabled && (
            <>
              <div className="form-group">
                <label htmlFor="pop3Host">{t('admin.pop3Host', 'POP3 호스트')}</label>
                <input
                  id="pop3Host"
                  type="text"
                  value={formData.pop3Host}
                  onChange={(e) => setFormData({ ...formData, pop3Host: e.target.value })}
                  placeholder="pop.gmail.com"
                  required={formData.pop3Enabled}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pop3Port">{t('admin.pop3Port', 'POP3 포트')}</label>
                <input
                  id="pop3Port"
                  type="number"
                  value={formData.pop3Port}
                  onChange={(e) => setFormData({ ...formData, pop3Port: parseInt(e.target.value) })}
                  placeholder="995"
                  required={formData.pop3Enabled}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pop3User">{t('admin.pop3User', 'POP3 사용자')}</label>
                <input
                  id="pop3User"
                  type="text"
                  value={formData.pop3User}
                  onChange={(e) => setFormData({ ...formData, pop3User: e.target.value })}
                  placeholder="user@example.com"
                  required={formData.pop3Enabled}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pop3Password">{t('admin.pop3Password', 'POP3 비밀번호')}</label>
                <input
                  id="pop3Password"
                  type="password"
                  value={formData.pop3Password}
                  onChange={(e) => setFormData({ ...formData, pop3Password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.pop3Tls}
                    onChange={(e) => setFormData({ ...formData, pop3Tls: e.target.checked })}
                  />
                  <span>{t('admin.useTLS', 'TLS 사용')}</span>
                </label>
              </div>
            </>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('common.cancel', '취소')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.saving', '저장 중...') : t('common.save', '저장')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
