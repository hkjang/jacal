import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function EventsAdmin() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['admin', 'events', page, limit, search],
    queryFn: () => adminAPI.getEvents({ page, limit, search }),
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.events', '일정')}</h2>
          <p className="section-description">All events from all users</p>
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
              <th>Start</th>
              <th>End</th>
              <th>Location</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {eventsData?.data?.map((event: any) => (
              <tr key={event.id}>
                <td>
                  <div className="event-title">
                    <strong>{event.title}</strong>
                    {event.description && (
                      <small className="event-desc">{event.description}</small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    <strong>{event.user.name}</strong>
                    <small>{event.user.email}</small>
                  </div>
                </td>
                <td>{formatDateTime(event.startAt)}</td>
                <td>{formatDateTime(event.endAt)}</td>
                <td>{event.location || '-'}</td>
                <td>{new Date(event.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!eventsData?.data || eventsData.data.length === 0) && (
        <div className="empty-state">
          <p>{t('common.noData', '데이터가 없습니다.')}</p>
        </div>
      )}

      {eventsData?.meta && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.prev', '이전')}
          </button>
          <span>
            {page} / {eventsData.meta.totalPages || 1}
          </span>
          <button
            disabled={page >= eventsData.meta.totalPages}
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

        .event-title {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .event-desc {
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: normal;
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
