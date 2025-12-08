import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

interface Reminder {
    id: string;
    entityType: string;
    entityId: string;
    notifyAt: string;
    channel: string;
    sent: boolean;
    createdAt: string;
    entity?: {
        id: string;
        title: string;
        startAt?: string;
        dueAt?: string;
    };
    user?: {
        id: string;
        name: string;
        email: string;
    };
    webhookLogs?: WebhookLog[];
}

interface WebhookLog {
    id: string;
    status: string;
    statusCode?: number;
    response?: string;
    sentAt?: string;
    webhook: {
        id: string;
        name: string;
    };
}

export default function RemindersAdmin() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [sentFilter, setSentFilter] = useState('');
    const [search, setSearch] = useState('');

    const { data: remindersData, isLoading } = useQuery({
        queryKey: ['admin', 'reminders', page, limit, entityTypeFilter, sentFilter, search],
        queryFn: () => adminAPI.getReminders({
            page,
            limit,
            search: search || undefined,
            entityType: entityTypeFilter || undefined,
            sent: sentFilter || undefined,
        }),
    });

    const { data: stats } = useQuery({
        queryKey: ['admin', 'reminders', 'stats'],
        queryFn: adminAPI.getReminderStats,
    });

    const resendMutation = useMutation({
        mutationFn: adminAPI.resendNotificationWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reminders'] });
            alert(t('admin.resendSuccess', '웹훅이 재전송되었습니다.'));
        },
        onError: (error: any) => {
            alert(t('admin.resendFailed', '재전송 실패: ') + (error.response?.data?.error || error.message));
        },
    });

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('ko-KR');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <span className="badge badge-success">✓ 성공</span>;
            case 'failed':
                return <span className="badge badge-danger">✗ 실패</span>;
            case 'pending':
                return <span className="badge badge-warning">⏳ 대기</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (isLoading) {
        return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
    }

    return (
        <div className="admin-section">
            <div className="section-header">
                <div>
                    <h2>{t('admin.reminders', '알림 관리')}</h2>
                    <p className="section-description">
                        {t('admin.remindersDescription', '사용자의 일정/태스크 알림과 웹훅 전송 상태를 확인합니다.')}
                    </p>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.reminders.total}</div>
                        <div className="stat-label">{t('admin.totalReminders', '전체 알림')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#10b981' }}>{stats.reminders.sent}</div>
                        <div className="stat-label">{t('admin.sentReminders', '발송 완료')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.reminders.pending}</div>
                        <div className="stat-label">{t('admin.pendingReminders', '대기 중')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#ef4444' }}>{stats.reminders.overdue}</div>
                        <div className="stat-label">{t('admin.overdueReminders', '지연됨')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#10b981' }}>{stats.webhooks.successful}</div>
                        <div className="stat-label">{t('admin.successfulWebhooks', '웹훅 성공')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#ef4444' }}>{stats.webhooks.failed}</div>
                        <div className="stat-label">{t('admin.failedWebhooks', '웹훅 실패')}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-row">
                <input
                    type="text"
                    placeholder={t('common.search', '검색...')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="search-input"
                />
                <select
                    value={entityTypeFilter}
                    onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
                    className="filter-select"
                >
                    <option value="">{t('admin.allTypes', '모든 유형')}</option>
                    <option value="event">{t('admin.events', '일정')}</option>
                    <option value="task">{t('admin.tasks', '태스크')}</option>
                </select>
                <select
                    value={sentFilter}
                    onChange={(e) => { setSentFilter(e.target.value); setPage(1); }}
                    className="filter-select"
                >
                    <option value="">{t('admin.allStatus', '모든 상태')}</option>
                    <option value="true">{t('admin.sent', '발송됨')}</option>
                    <option value="false">{t('admin.notSent', '미발송')}</option>
                </select>
            </div>

            {/* Reminders Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('admin.entityType', '유형')}</th>
                            <th>{t('common.title', '제목')}</th>
                            <th>{t('common.user', '사용자')}</th>
                            <th>{t('admin.notifyAt', '알림 시간')}</th>
                            <th>{t('admin.sentStatus', '발송')}</th>
                            <th>{t('admin.webhookStatus', '웹훅 상태')}</th>
                            <th>{t('common.actions', '작업')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {remindersData?.data?.map((reminder: Reminder) => (
                            <tr key={reminder.id}>
                                <td>
                                    <span className="type-badge">
                                        {reminder.entityType === 'event' ? '📅 일정' : '📋 태스크'}
                                    </span>
                                </td>
                                <td>
                                    <strong>{reminder.entity?.title || '-'}</strong>
                                </td>
                                <td>
                                    <div className="user-info">
                                        <strong>{reminder.user?.name || '-'}</strong>
                                        <small>{reminder.user?.email}</small>
                                    </div>
                                </td>
                                <td>{formatDateTime(reminder.notifyAt)}</td>
                                <td>
                                    {reminder.sent ? (
                                        <span className="badge badge-success">✓ 발송됨</span>
                                    ) : (
                                        <span className="badge badge-warning">⏳ 대기</span>
                                    )}
                                </td>
                                <td>
                                    <div className="webhook-logs">
                                        {reminder.webhookLogs && reminder.webhookLogs.length > 0 ? (
                                            reminder.webhookLogs.map((log) => (
                                                <div key={log.id} className="webhook-log-item">
                                                    <span className="webhook-name">{log.webhook.name}</span>
                                                    {getStatusBadge(log.status)}
                                                    {log.status === 'failed' && (
                                                        <button
                                                            className="btn-icon btn-resend"
                                                            onClick={() => resendMutation.mutate(log.id)}
                                                            disabled={resendMutation.isPending}
                                                            title={t('admin.resend', '재전송')}
                                                        >
                                                            🔄
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {reminder.webhookLogs?.some(l => l.status === 'failed') && (
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => {
                                                const failedLogs = reminder.webhookLogs?.filter(l => l.status === 'failed') || [];
                                                failedLogs.forEach(log => resendMutation.mutate(log.id));
                                            }}
                                            disabled={resendMutation.isPending}
                                        >
                                            🔄 {t('admin.resendAll', '전체 재전송')}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(!remindersData?.data || remindersData.data.length === 0) && (
                <div className="empty-state">
                    <p>{t('common.noData', '데이터가 없습니다.')}</p>
                </div>
            )}

            {/* Pagination */}
            {remindersData?.meta && (
                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="btn btn-sm btn-secondary"
                    >
                        {t('common.prev', '이전')}
                    </button>
                    <span>
                        {page} / {remindersData.meta.totalPages || 1}
                    </span>
                    <button
                        disabled={page >= remindersData.meta.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="btn btn-sm btn-secondary"
                    >
                        {t('common.next', '다음')}
                    </button>
                </div>
            )}

            <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-card {
          background: var(--bg-tertiary, rgba(0,0,0,0.2));
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
        }
        .stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .filters-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-surface);
          color: var(--color-text);
        }
        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-surface);
          color: var(--color-text);
        }
        .type-badge {
          font-size: 0.9rem;
        }
        .badge {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        .badge-warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        .badge-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .webhook-logs {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .webhook-log-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        .webhook-name {
          color: var(--text-secondary);
        }
        .btn-resend {
          padding: 0.15rem 0.3rem;
          font-size: 0.8rem;
        }
        .text-muted {
          color: var(--text-secondary);
        }
        .user-info {
          display: flex;
          flex-direction: column;
        }
        .user-info small {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }
      `}</style>
        </div>
    );
}
