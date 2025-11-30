import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function EventsAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['admin', 'events', page, limit, debouncedSearch],
    queryFn: () => adminAPI.getEvents({ page, limit, search: debouncedSearch }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminAPI.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      setShowEditModal(false);
      alert(t('admin.eventUpdated', '일정이 업데이트되었습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      alert(t('admin.eventDeleted', '일정이 삭제되었습니다.'));
    },
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('ko-KR');
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.events', '일정 관리')}</h2>
          <p className="section-description">{t('admin.eventsDescription', '시스템의 모든 사용자 일정')}</p>
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
              <th>{t('events.start', '시작')}</th>
              <th>{t('events.end', '종료')}</th>
              <th>{t('events.location', '위치')}</th>
              <th>{t('common.created', '생성일')}</th>
              <th>{t('common.actions', '작업')}</th>
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
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEditModal(true);
                      }}
                      className="btn-icon"
                      title={t('common.edit', '수정')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.confirmDeleteEvent', '이 일정을 삭제하시겠습니까?'))) {
                          deleteMutation.mutate(event.id);
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

      {(!eventsData?.data || eventsData.data.length === 0) && (
        <div className="empty-state">
          <p>{search ? t('common.noResults', '검색 결과가 없습니다.') : t('common.noData', '데이터가 없습니다.')}</p>
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

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.editEvent', '일정 수정')}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: selectedEvent.id,
                  data: {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    startAt: formData.get('startAt') as string,
                    endAt: formData.get('endAt') as string,
                    location: formData.get('location') as string,
                    eventType: formData.get('eventType') as string,
                  },
                });
              }}
            >
              <div className="form-group">
                <label>{t('common.title', '제목')} *</label>
                <input name="title" defaultValue={selectedEvent.title} required />
              </div>
              <div className="form-group">
                <label>{t('common.description', '설명')}</label>
                <textarea name="description" defaultValue={selectedEvent.description || ''} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('events.start', '시작 시간')} *</label>
                  <input
                    type="datetime-local"
                    name="startAt"
                    defaultValue={new Date(selectedEvent.startAt).toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('events.end', '종료 시간')} *</label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    defaultValue={new Date(selectedEvent.endAt).toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('events.location', '위치')}</label>
                  <input name="location" defaultValue={selectedEvent.location || ''} />
                </div>
                <div className="form-group">
                  <label>{t('events.type', '유형')}</label>
                  <select name="eventType" defaultValue={selectedEvent.eventType || 'OTHER'}>
                    <option value="WORK">{t('events.type.work', '업무')}</option>
                    <option value="MEETING">{t('events.type.meeting', '회의')}</option>
                    <option value="PERSONAL">{t('events.type.personal', '개인')}</option>
                    <option value="APPOINTMENT">{t('events.type.appointment', '약속')}</option>
                    <option value="OTHER">{t('events.type.other', '기타')}</option>
                  </select>
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
