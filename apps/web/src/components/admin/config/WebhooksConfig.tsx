import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  'user.created',
  'user.updated',
  'event.created',
  'event.updated',
  'event.deleted',
  'task.created',
  'task.completed',
  'habit.logged',
];

export default function WebhooksConfig() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true,
  });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['admin', 'webhooks'],
    queryFn: adminAPI.getWebhooks,
  });

  const createMutation = useMutation({
    mutationFn: adminAPI.createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'webhooks'] });
      closeModal();
      alert(t('admin.webhookCreated', '웹훅이 생성되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.webhookCreateFailed', '웹훅 생성 실패: ') + (error.response?.data?.error || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'webhooks'] });
      closeModal();
      alert(t('admin.webhookUpdated', '웹훅이 수정되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.webhookUpdateFailed', '웹훅 수정 실패: ') + (error.response?.data?.error || error.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'webhooks'] });
      alert(t('admin.webhookDeleted', '웹훅이 삭제되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.webhookDeleteFailed', '웹훅 삭제 실패: ') + (error.response?.data?.error || error.message));
    },
  });

  const testMutation = useMutation({
    mutationFn: adminAPI.testWebhook,
    onSuccess: (data) => {
      alert(data.message || t('admin.webhookTestSuccess', '웹훅 테스트 성공'));
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      const details = error.response?.data?.details;
      alert(t('admin.webhookTestFailed', '웹훅 테스트 실패: ') + errorMsg + (details ? `\n\n상세: ${details}` : ''));
    },
  });

  const openCreateModal = () => {
    setEditingWebhook(null);
    setFormData({
      name: '',
      url: '',
      events: [],
      active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || [],
      active: webhook.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWebhook(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('admin.confirmDeleteWebhook', '이 웹훅을 삭제하시겠습니까?'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleTest = (id: string) => {
    testMutation.mutate(id);
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const toggleStatus = (webhook: Webhook) => {
    updateMutation.mutate({
      id: webhook.id,
      data: { active: !webhook.active },
    });
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.webhooks', '웹훅')}</h2>
          <p className="section-description">{t('admin.webhooksDescription', '외부 서비스 연동을 위한 웹훅을 관리합니다')}</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          ➕ {t('admin.addWebhook', '웹훅 추가')}
        </button>
      </div>

      <div className="webhooks-list">
        {webhooks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔗</span>
            <p>{t('admin.noWebhooks', '등록된 웹훅이 없습니다')}</p>
          </div>
        ) : (
          webhooks.map((webhook: Webhook) => (
            <div key={webhook.id} className="webhook-card">
              <div className="webhook-header">
                <h3>{webhook.name}</h3>
                <div className="webhook-status">
                  <button
                    className={`status-toggle ${webhook.active ? 'active' : 'inactive'}`}
                    onClick={() => toggleStatus(webhook)}
                  >
                    {webhook.active ? '🟢 Active' : '🔴 Inactive'}
                  </button>
                </div>
              </div>

              <div className="webhook-details">
                <div className="detail-row">
                  <span className="detail-label">URL:</span>
                  <code className="detail-value">{webhook.url}</code>
                </div>

                <div className="detail-row">
                  <span className="detail-label">{t('admin.events', '이벤트')}:</span>
                  <div className="events-list">
                    {webhook.events && webhook.events.length > 0 ? (
                      webhook.events.map((event) => (
                        <span key={event} className="event-badge">{event}</span>
                      ))
                    ) : (
                      <span className="no-events">{t('admin.noEventsSelected', '선택된 이벤트 없음')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="webhook-actions">
                <button
                  className="action-btn test"
                  onClick={() => handleTest(webhook.id)}
                  disabled={testMutation.isPending}
                >
                  🧪 {t('admin.test', '테스트')}
                </button>
                <button className="action-btn edit" onClick={() => openEditModal(webhook)}>
                  ✏️ {t('admin.edit', '수정')}
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(webhook.id)}
                  disabled={deleteMutation.isPending}
                >
                  🗑️ {t('admin.delete', '삭제')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="available-events">
        <h3>{t('admin.availableEvents', '사용 가능한 이벤트')}</h3>
        <div className="events-grid">
          {AVAILABLE_EVENTS.map((event) => (
            <div key={event} className="event-item">
              <code>{event}</code>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingWebhook ? t('admin.editWebhook', '웹훅 수정') : t('admin.addWebhook', '웹훅 추가')}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('admin.webhookName', '웹훅 이름')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('admin.webhookNamePlaceholder', '예: Slack 알림')}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('admin.webhookUrl', '웹훅 URL')}</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://hooks.example.com/webhook"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('admin.selectEvents', '이벤트 선택')}</label>
                <div className="events-checkbox-grid">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label key={event} className="event-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                      />
                      <span>{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  {t('admin.webhookActive', '활성화')}
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  {t('common.cancel', '취소')}
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t('common.saving', '저장 중...')
                    : t('common.save', '저장')}
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
          margin: 0.25rem 0 0 0;
        }

        .add-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }

        .add-btn:hover {
          opacity: 0.9;
        }

        .webhooks-list {
          margin-bottom: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .webhook-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .webhook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .webhook-header h3 {
          margin: 0;
        }

        .status-toggle {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }

        .status-toggle.active {
          background: var(--success-bg, rgba(34, 197, 94, 0.2));
          color: var(--success, #22c55e);
        }

        .status-toggle.inactive {
          background: var(--danger-bg, rgba(239, 68, 68, 0.2));
          color: var(--danger, #ef4444);
        }

        .webhook-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          align-items: flex-start;
        }

        .detail-label {
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 60px;
        }

        .detail-value {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
          word-break: break-all;
        }

        .events-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .event-badge {
          background: var(--primary-bg, rgba(99, 102, 241, 0.2));
          color: var(--primary, #6366f1);
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .no-events {
          color: var(--text-secondary);
          font-style: italic;
        }

        .webhook-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .action-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.delete:hover:not(:disabled) {
          background: var(--danger-bg, rgba(239, 68, 68, 0.2));
          border-color: var(--danger, #ef4444);
        }

        .available-events {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .available-events h3 {
          margin: 0 0 1rem 0;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
        }

        .event-item code {
          display: block;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--bg-secondary);
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .modal form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .form-group input[type="text"],
        .form-group input[type="url"] {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 1rem;
        }

        .events-checkbox-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .event-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
          cursor: pointer;
          font-weight: normal;
        }

        .event-checkbox:hover {
          background: var(--bg-primary);
        }

        .event-checkbox input {
          width: auto;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input {
          width: auto;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
          margin-top: 1rem;
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-save {
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }

        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
