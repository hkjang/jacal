import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

interface Integration {
  id: string;
  name: string;
  key: string;
  description?: string;
  isEnabled: boolean;
  config: any;
}

export default function IntegrationsAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    isEnabled: true,
    config: '{}',
  });

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['admin', 'integrations'],
    queryFn: adminAPI.getIntegrations,
  });

  const createMutation = useMutation({
    mutationFn: adminAPI.createIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
      closeModal();
      alert(t('admin.integrationCreated', '통합이 생성되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.createFailed', '생성 실패: ') + error.response?.data?.error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
      closeModal();
      alert(t('admin.integrationUpdated', '통합이 업데이트되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.updateFailed', '업데이트 실패: ') + error.response?.data?.error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] });
      alert(t('admin.integrationDeleted', '통합이 삭제되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.response?.data?.error);
    },
  });

  const openCreateModal = () => {
    setEditingIntegration(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      isEnabled: true,
      config: '{}',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      key: integration.key,
      description: integration.description || '',
      isEnabled: integration.isEnabled,
      config: JSON.stringify(integration.config, null, 2),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIntegration(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        config: JSON.parse(formData.config),
      };

      if (editingIntegration) {
        updateMutation.mutate({ id: editingIntegration.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (err) {
      alert('Invalid JSON configuration');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('admin.confirmDelete', '정말 삭제하시겠습니까?'))) {
      deleteMutation.mutate(id);
    }
  };

  const toggleStatus = (integration: Integration) => {
    updateMutation.mutate({
      id: integration.id,
      data: { isEnabled: !integration.isEnabled },
    });
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.integrations', '통합')}</h2>
          <p className="section-description">Manage third-party integrations and external services</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          {t('admin.addIntegration', '통합 추가')}
        </button>
      </div>

      <div className="integrations-grid">
        {integrations?.map((integration: Integration) => (
          <div key={integration.id} className="integration-card">
            <div className="integration-header">
              <div className="integration-icon">🔌</div>
              <div className="integration-status-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={integration.isEnabled}
                    onChange={() => toggleStatus(integration)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
            
            <div className="integration-content">
              <h3>{integration.name}</h3>
              <p className="integration-key">Key: {integration.key}</p>
              <p className="integration-desc">{integration.description}</p>

              <div className="integration-status">
                {integration.isEnabled ? (
                  <span className="status-badge configured">✅ Enabled</span>
                ) : (
                  <span className="status-badge disabled">⚪ Disabled</span>
                )}
              </div>

              {integration.config && Object.keys(integration.config).length > 0 && (
                <div className="integration-settings">
                  <pre>{JSON.stringify(integration.config, null, 2)}</pre>
                </div>
              )}

              <div className="integration-actions">
                <button 
                  className="action-btn"
                  onClick={() => openEditModal(integration)}
                >
                  ⚙️ Configure
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(integration.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {(!integrations || integrations.length === 0) && (
          <div className="empty-state">
            <p>{t('common.noData', '데이터가 없습니다.')}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editingIntegration 
                ? t('admin.editIntegration', '통합 수정') 
                : t('admin.createIntegration', '통합 생성')}
            </h2>
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
                <label>{t('admin.key', '키 (고유 식별자)')}</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  required
                  disabled={!!editingIntegration}
                />
              </div>
              <div className="form-group">
                <label>{t('admin.description', '설명')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>{t('admin.config', '설정 (JSON)')}</label>
                <textarea
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  rows={5}
                  className="code-input"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  />
                  {t('admin.enabled', '활성화')}
                </label>
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

        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .integration-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        
        .integration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .integration-icon {
          font-size: 2.5rem;
        }

        .integration-content h3 {
          margin: 0 0 0.25rem 0;
        }
        
        .integration-key {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-family: monospace;
          margin: 0 0 0.5rem 0;
        }

        .integration-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          min-height: 40px;
        }

        .integration-status {
          margin-bottom: 1rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-badge.configured {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-badge.disabled {
          background: rgba(128, 128, 128, 0.2);
          color: var(--text-secondary);
        }

        .integration-settings {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          max-height: 100px;
          overflow-y: auto;
        }
        
        .integration-settings pre {
          margin: 0;
          font-size: 0.8rem;
          white-space: pre-wrap;
        }

        .integration-actions {
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

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        
        .code-input {
          font-family: monospace;
        }
        
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
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
