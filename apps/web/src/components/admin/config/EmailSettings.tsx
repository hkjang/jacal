import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

interface EmailSetting {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  fromName: string;
  fromEmail: string;
  secure: boolean;
  isEnabled: boolean;
}

export default function EmailSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EmailSetting | null>(null);
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromName: '',
    fromEmail: '',
    secure: true,
    isEnabled: true,
  });

  const { data: settingsList, isLoading } = useQuery({
    queryKey: ['admin', 'emailSettings'],
    queryFn: adminAPI.getEmailSettings,
  });

  const createMutation = useMutation({
    mutationFn: adminAPI.createEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emailSettings'] });
      closeModal();
      alert(t('admin.settingsSaved', '설정이 저장되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.saveFailed', '저장 실패: ') + error.response?.data?.error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateEmailSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emailSettings'] });
      closeModal();
      alert(t('admin.settingsUpdated', '설정이 업데이트되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.updateFailed', '업데이트 실패: ') + error.response?.data?.error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emailSettings'] });
      alert(t('admin.settingsDeleted', '설정이 삭제되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.response?.data?.error);
    },
  });

  const openCreateModal = () => {
    setEditingSetting(null);
    setFormData({
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromName: 'Jacal',
      fromEmail: '',
      secure: true,
      isEnabled: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (setting: EmailSetting) => {
    setEditingSetting(setting);
    setFormData({
      smtpHost: setting.smtpHost,
      smtpPort: setting.smtpPort,
      smtpUser: setting.smtpUser,
      smtpPassword: '', // Don't show existing password
      fromName: setting.fromName,
      fromEmail: setting.fromEmail,
      secure: setting.secure,
      isEnabled: setting.isEnabled,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSetting(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    
    // Remove empty password if editing (to keep existing)
    if (editingSetting && !data.smtpPassword) {
      delete (data as any).smtpPassword;
    }

    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('admin.confirmDelete', '정말 삭제하시겠습니까?'))) {
      deleteMutation.mutate(id);
    }
  };

  const toggleStatus = (setting: EmailSetting) => {
    updateMutation.mutate({
      id: setting.id,
      data: { isEnabled: !setting.isEnabled },
    });
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.email', '이메일 설정')}</h2>
          <p className="section-description">Configure email server and notification settings</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          {t('admin.addEmailSetting', '이메일 설정 추가')}
        </button>
      </div>

      <div className="email-config-list">
        {settingsList?.map((setting: EmailSetting) => (
          <div key={setting.id} className="config-card">
            <div className="config-header">
              <div className="config-title">
                <h3>{setting.fromName} &lt;{setting.fromEmail}&gt;</h3>
                <span className="host-badge">{setting.smtpHost}:{setting.smtpPort}</span>
              </div>
              <div className="config-status-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={setting.isEnabled}
                    onChange={() => toggleStatus(setting)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="config-details">
              <div className="detail-row">
                <span className="label">SMTP User:</span>
                <span className="value">{setting.smtpUser}</span>
              </div>
              <div className="detail-row">
                <span className="label">Security:</span>
                <span className="value">{setting.secure ? 'SSL/TLS' : 'None'}</span>
              </div>
            </div>

            <div className="config-actions">
              <button 
                className="action-btn"
                onClick={() => openEditModal(setting)}
              >
                ⚙️ Configure
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={() => handleDelete(setting.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}

        {(!settingsList || settingsList.length === 0) && (
          <div className="empty-state">
            <p>{t('common.noData', '데이터가 없습니다.')}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editingSetting 
                ? t('admin.editEmailSetting', '이메일 설정 수정') 
                : t('admin.createEmailSetting', '이메일 설정 생성')}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="config-section">
                <h3>SMTP Settings</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>SMTP Host</label>
                    <input
                      type="text"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <input
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>SMTP Username</label>
                  <input
                    type="text"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SMTP Password {editingSetting && '(Leave blank to keep unchanged)'}</label>
                  <input
                    type="password"
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                    className="form-input"
                    required={!editingSetting}
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.secure}
                      onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                    />
                    Use SSL/TLS
                  </label>
                </div>
              </div>

              <div className="config-section">
                <h3>Sender Info</h3>
                <div className="form-group">
                  <label>From Name</label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>From Email</label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    />
                    Enable this configuration
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? t('common.saving', '저장 중...') 
                    : t('common.save', '저장')}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  {t('common.cancel', '취소')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="note">
        <p>💡 <strong>Note:</strong> For production, use environment variables for sensitive data and implement secure email template management.</p>
      </div>

      <style>{`
        .admin-section {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .section-description {
          color: var(--text-secondary);
          margin: 0;
        }

        .email-config-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .config-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .config-title h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
        }

        .host-badge {
          font-size: 0.8rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          color: var(--text-secondary);
        }

        .config-details {
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .detail-row {
          display: flex;
          margin-bottom: 0.5rem;
        }

        .detail-row .label {
          color: var(--text-secondary);
          width: 80px;
        }

        .config-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          flex: 1;
        }

        .action-btn:hover {
          background: var(--bg-tertiary);
        }
        
        .delete-btn {
          color: var(--danger);
          border-color: var(--danger);
          flex: 0 0 auto;
        }
        
        .delete-btn:hover {
          background: var(--danger-bg);
        }

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
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .config-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .config-section:last-child {
          border-bottom: none;
        }

        .config-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: var(--primary);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-input {
          width: 100%;
          padding: 0.6rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: normal;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          justify-content: flex-end;
        }

        /* Switch Toggle */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }

        input:checked + .slider {
          background-color: var(--primary);
        }

        input:focus + .slider {
          box-shadow: 0 0 1px var(--primary);
        }

        input:checked + .slider:before {
          transform: translateX(16px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        .note {
          padding: 1rem;
          background: rgba(255, 165, 0, 0.1);
          border-left: 4px solid var(--warning);
          border-radius: 4px;
        }

        .note p {
          margin: 0;
          color: var(--text-secondary);
        }
        
        .empty-state {
          grid-column: 1 / -1;
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }
        
        .loading {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
