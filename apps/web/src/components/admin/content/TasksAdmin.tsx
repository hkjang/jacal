import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function TasksAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['admin', 'tasks', page, limit, debouncedSearch],
    queryFn: () => adminAPI.getTasks({ page, limit, search: debouncedSearch }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminAPI.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      setShowEditModal(false);
      alert(t('admin.taskUpdated', '작업이 업데이트되었습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      alert(t('admin.taskDeleted', '작업이 삭제되었습니다.'));
    },
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.tasks', '작업 관리')}</h2>
          <p className="section-description">{t('admin.tasksDescription', '시스템의 모든 사용자 작업')}</p>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder={t('common.search', '검색...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('common.title', '제목')}</th>
              <th>{t('common.user', '사용자')}</th>
              <th>{t('tasks.status', '상태')}</th>
              <th>{t('tasks.priority', '우선순위')}</th>
              <th>{t('tasks.dueDate', '마감일')}</th>
              <th>{t('tasks.estimatedTime', '예상 시간')}</th>
              <th>{t('common.created', '생성일')}</th>
              <th>{t('common.actions', '작업')}</th>
            </tr>
          </thead>
          <tbody>
            {tasksData?.data?.map((task: any) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>
                  <div className="user-info">
                    <strong>{task.user.name}</strong>
                    <small>{task.user.email}</small>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${task.status?.toLowerCase() || 'pending'}`}>
                    {t(`tasks.status.${task.status?.toLowerCase() || 'pending'}`, task.status || 'Pending')}
                  </span>
                </td>
                <td>
                  {task.priority !== null && task.priority !== undefined && (
                    <span className={`priority-badge priority-${task.priority}`}>
                      {t(`tasks.priority.${task.priority}`, `우선순위 ${task.priority}`)}
                    </span>
                  )}
                </td>
                <td>
                  {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '-'}
                </td>
                <td>{task.estimatedMinutes ? `${task.estimatedMinutes} ${t('common.minutes', '분')}` : '-'}</td>
                <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowEditModal(true);
                      }}
                      className="btn-icon"
                      title={t('common.edit', '수정')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.confirmDeleteTask', '이 작업을 삭제하시겠습니까?'))) {
                          deleteMutation.mutate(task.id);
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

      {(!tasksData?.data || tasksData.data.length === 0) && (
        <div className="empty-state">
          <p>{search ? t('common.noResults', '검색 결과가 없습니다.') : t('common.noData', '데이터가 없습니다.')}</p>
        </div>
      )}

      {tasksData?.meta && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.prev', '이전')}
          </button>
          <span>
            {page} / {tasksData.meta.totalPages || 1}
          </span>
          <button
            disabled={page >= tasksData.meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.next', '다음')}
          </button>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.editTask', '작업 수정')}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: selectedTask.id,
                  data: {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    status: formData.get('status') as string,
                    priority: parseInt(formData.get('priority') as string),
                    dueAt: formData.get('dueAt') as string,
                    estimatedMinutes: parseInt(formData.get('estimatedMinutes') as string) || undefined,
                  },
                });
              }}
            >
              <div className="form-group">
                <label>{t('common.title', '제목')} *</label>
                <input name="title" defaultValue={selectedTask.title} required />
              </div>
              <div className="form-group">
                <label>{t('common.description', '설명')}</label>
                <textarea name="description" defaultValue={selectedTask.description || ''} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('tasks.status', '상태')} *</label>
                  <select name="status" defaultValue={selectedTask.status || 'pending'} required>
                    <option value="pending">{t('tasks.status.pending', '대기중')}</option>
                    <option value="in_progress">{t('tasks.status.in_progress', '진행중')}</option>
                    <option value="completed">{t('tasks.status.completed', '완료')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('tasks.priority', '우선순위')}</label>
                  <select name="priority" defaultValue={selectedTask.priority || 1}>
                    <option value="1">{t('tasks.priority.1', '낮음')}</option>
                    <option value="2">{t('tasks.priority.2', '보통')}</option>
                    <option value="3">{t('tasks.priority.3', '높음')}</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('tasks.dueDate', '마감일')}</label>
                  <input
                    type="datetime-local"
                    name="dueAt"
                    defaultValue={selectedTask.dueAt ? new Date(selectedTask.dueAt).toISOString().slice(0, 16) : ''}
                  />
                </div>
                <div className="form-group">
                  <label>{t('tasks.estimatedTime', '예상 시간 (분)')}</label>
                  <input
                    type="number"
                    name="estimatedMinutes"
                    defaultValue={selectedTask.estimatedMinutes || ''}
                    min="1"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  {t('common.cancel', '취소')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.save', '저장')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-section {
          padding: 1rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0 0 0.25rem 0;
        }

        .section-description {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.9rem;
        }

        .search-input {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          min-width: 250px;
        }

        .table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          background: var(--bg-secondary);
          font-weight: 600;
          color: var(--text-primary);
        }

        .data-table tbody tr:hover {
          background: var(--bg-secondary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-info small {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-badge.completed {
          background: var(--success-light);
          color: var(--success);
        }

        .status-badge.in_progress {
          background: var(--warning-light);
          color: var(--warning);
        }

        .status-badge.pending {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .priority-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .priority-badge.priority-3 {
          background: var(--danger-light);
          color: var(--danger);
        }

        .priority-badge.priority-2 {
          background: var(--warning-light);
          color: var(--warning);
        }

        .priority-badge.priority-1 {
          background: var(--success-light);
          color: var(--success);
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
          transition: transform 0.2s;
        }

        .btn-icon:hover {
          transform: scale(1.2);
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .loading {
          padding: 2rem;
          text-align: center;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }
        
        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 6px;
        }
        
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          z-index: 10000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin: 0 0 1.5rem 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
