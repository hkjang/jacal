import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

interface Webhook {
    id: string;
    name: string;
    url: string;
    active: boolean;
    headers?: Record<string, string>;
    createdAt: string;
    _count?: {
        logs: number;
    };
}

export default function NotificationWebhooksAdmin() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        active: true,
        headers: '',
    });

    const { data: webhooks, isLoading } = useQuery({
        queryKey: ['admin', 'notification-webhooks'],
        queryFn: adminAPI.getNotificationWebhooks,
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string; url: string; active: boolean; headers?: Record<string, string> }) =>
            adminAPI.createNotificationWebhook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notification-webhooks'] });
            setShowCreateModal(false);
            resetForm();
            alert(t('admin.webhookCreated', '웹훅이 생성되었습니다.'));
        },
        onError: (error: any) => {
            alert(t('admin.createFailed', '생성 실패: ') + error.response?.data?.error);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            adminAPI.updateNotificationWebhook(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notification-webhooks'] });
            setEditingWebhook(null);
            resetForm();
            alert(t('admin.webhookUpdated', '웹훅이 업데이트되었습니다.'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: adminAPI.deleteNotificationWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notification-webhooks'] });
            alert(t('admin.webhookDeleted', '웹훅이 삭제되었습니다.'));
        },
    });

    const testMutation = useMutation({
        mutationFn: adminAPI.testNotificationWebhook,
        onSuccess: (data) => {
            alert(data.success ? t('admin.testSuccess', '테스트 성공!') : t('admin.testFailed', '테스트 실패: ') + data.message);
        },
        onError: (error: any) => {
            alert(t('admin.testFailed', '테스트 실패: ') + error.response?.data?.error);
        },
    });

    const resetForm = () => {
        setFormData({ name: '', url: '', active: true, headers: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            name: formData.name,
            url: formData.url,
            active: formData.active,
            headers: formData.headers ? JSON.parse(formData.headers) : undefined,
        };

        if (editingWebhook) {
            updateMutation.mutate({ id: editingWebhook.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (webhook: Webhook) => {
        setEditingWebhook(webhook);
        setFormData({
            name: webhook.name,
            url: webhook.url,
            active: webhook.active,
            headers: webhook.headers ? JSON.stringify(webhook.headers, null, 2) : '',
        });
    };

    if (isLoading) {
        return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
    }

    return (
        <div className="admin-section">
            <div className="section-header">
                <div>
                    <h2>{t('admin.notificationWebhooks', '알림 웹훅')}</h2>
                    <p className="section-description">
                        {t('admin.notificationWebhooksDescription', '일정 알림 발송시 호출되는 웹훅을 관리합니다.')}
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                >
                    ➕ {t('admin.addWebhook', '웹훅 추가')}
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('common.name', '이름')}</th>
                            <th>URL</th>
                            <th>{t('common.status', '상태')}</th>
                            <th>{t('admin.logCount', '로그 수')}</th>
                            <th>{t('common.actions', '작업')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {webhooks?.map((webhook: Webhook) => (
                            <tr key={webhook.id}>
                                <td><strong>{webhook.name}</strong></td>
                                <td>
                                    <code style={{ fontSize: '0.85em', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {webhook.url.length > 50 ? webhook.url.substring(0, 50) + '...' : webhook.url}
                                    </code>
                                </td>
                                <td>
                                    <span className={`badge ${webhook.active ? 'badge-success' : 'badge-secondary'}`}>
                                        {webhook.active ? '🟢 ' + t('common.active', '활성') : '🔴 ' + t('common.inactive', '비활성')}
                                    </span>
                                </td>
                                <td>{webhook._count?.logs || 0}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => testMutation.mutate(webhook.id)}
                                            className="btn-icon"
                                            title={t('common.test', '테스트')}
                                            disabled={testMutation.isPending}
                                        >
                                            🧪
                                        </button>
                                        <button
                                            onClick={() => handleEdit(webhook)}
                                            className="btn-icon"
                                            title={t('common.edit', '수정')}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(t('admin.confirmDelete', '정말 삭제하시겠습니까?'))) {
                                                    deleteMutation.mutate(webhook.id);
                                                }
                                            }}
                                            className="btn-icon"
                                            title={t('common.delete', '삭제')}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(!webhooks || webhooks.length === 0) && (
                <div className="empty-state">
                    <p>{t('admin.noWebhooks', '등록된 알림 웹훅이 없습니다. 웹훅을 추가하면 일정 알림 시 자동으로 호출됩니다.')}</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingWebhook) && (
                <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingWebhook(null); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingWebhook ? t('admin.editWebhook', '웹훅 수정') : t('admin.createWebhook', '웹훅 생성')}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>{t('common.name', '이름')} *</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('admin.webhookNamePlaceholder', 'Slack 알림')}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>URL *</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://hooks.slack.com/services/..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                    {t('common.active', '활성')}
                                </label>
                            </div>
                            <div className="form-group">
                                <label>{t('admin.customHeaders', '커스텀 헤더 (JSON)')}</label>
                                <textarea
                                    value={formData.headers}
                                    onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                                    placeholder='{"Authorization": "Bearer xxx"}'
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => { setShowCreateModal(false); setEditingWebhook(null); }} className="btn btn-secondary">
                                    {t('common.cancel', '취소')}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {t('common.save', '저장')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .badge-success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        .badge-secondary {
          background: rgba(107, 114, 128, 0.2);
          color: #9ca3af;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }
      `}</style>
        </div>
    );
}
