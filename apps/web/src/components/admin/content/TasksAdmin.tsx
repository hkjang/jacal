import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function TasksAdmin() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['admin', 'tasks', page, limit, search],
    queryFn: () => adminAPI.getTasks({ page, limit, search }),
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.tasks', '작업')}</h2>
          <p className="section-description">All tasks from all users</p>
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
              <th>Title</th>
              <th>User</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Est. Time</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tasksData?.data?.map((task: any) => (
              <tr key={task.id}>
                <td>
                  <div className="task-title">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      readOnly
                      disabled
                    />
                    <span className={task.completed ? 'completed' : ''}>{task.title}</span>
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    <strong>{task.user.name}</strong>
                    <small>{task.user.email}</small>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${task.completed ? 'done' : 'pending'}`}>
                    {task.completed ? 'Done' : 'Pending'}
                  </span>
                </td>
                <td>
                  {task.priority && typeof task.priority === 'string' && (
                    <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  )}
                </td>
                <td>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                </td>
                <td>{task.estimatedMinutes ? `${task.estimatedMinutes} min` : '-'}</td>
                <td>{new Date(task.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!tasksData?.data || tasksData.data.length === 0) && (
        <div className="empty-state">
          <p>{t('common.noData', '데이터가 없습니다.')}</p>
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
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-tertiary);
          border-radius: 8px;
          overflow: hidden;
        }

        .data-table th,
        .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          background: rgba(0, 0, 0, 0.2);
          font-weight: 600;
          color: var(--text-secondary);
        }

        .data-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .task-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .task-title .completed {
          text-decoration: line-through;
          opacity: 0.6;
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
        }

        .status-badge.done {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-badge.pending {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .priority-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .priority-badge.высокий,
        .priority-badge.high {
          background: var(--danger-bg);
          color: var(--danger);
        }

        .priority-badge.средний,
        .priority-badge.medium {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .priority-badge.низкий,
        .priority-badge.low {
          background: var(--success-bg);
          color: var(--success);
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
          margin-top: 1rem;
        }
        
        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }
        
        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 4px;
        }
        
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
