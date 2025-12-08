import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

// Helper function to format date for datetime-local input (preserves local timezone)
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
                    defaultValue={formatDateForInput(new Date(selectedEvent.startAt))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('events.end', '종료 시간')} *</label>
                  <input
                    type="datetime-local"
                    name="endAt"
                    defaultValue={formatDateForInput(new Date(selectedEvent.endAt))}
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
    </div>
  );
}

