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
    </div>
  );
}

