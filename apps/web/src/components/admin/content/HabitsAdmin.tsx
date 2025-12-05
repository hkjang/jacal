import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function HabitsAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Debounce search to prevent re-fetching on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: habitsData, isLoading } = useQuery({
    queryKey: ['admin', 'habits', page, limit, debouncedSearch],
    queryFn: () => adminAPI.getHabits({ page, limit, search: debouncedSearch }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminAPI.updateHabit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'habits'] });
      setShowEditModal(false);
      alert(t('admin.habitUpdated', '습관이 업데이트되었습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'habits'] });
      alert(t('admin.habitDeleted', '습관이 삭제되었습니다.'));
    },
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.habits', '습관 관리')}</h2>
          <p className="section-description">{t('admin.habitsDescription', '시스템의 모든 사용자 습관')}</p>
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
              <th>{t('habits.frequency', '빈도')}</th>
              <th>{t('habits.targetDays', '목표 일수')}</th>
              <th>{t('habits.logs', '기록')}</th>
              <th>{t('common.created', '생성일')}</th>
              <th>{t('common.actions', '작업')}</th>
            </tr>
          </thead>
          <tbody>
            {habitsData?.data?.map((habit: any) => (
              <tr key={habit.id}>
                <td>
                  <span style={{ marginRight: '0.5rem' }}>{habit.icon || '✅'}</span>
                  {habit.title}
                </td>
                <td>
                  <div className="user-info">
                    <strong>{habit.user.name}</strong>
                    <small>{habit.user.email}</small>
                  </div>
                </td>
                <td><span className="badge">{String(t(`habits.frequency.${habit.frequency.toLowerCase()}`, habit.frequency))}</span></td>
                <td>{habit.targetDays} {t('habits.days', '일')}</td>
                <td><span className="count-badge">{habit._count.logs}</span></td>
                <td>{new Date(habit.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => {
                        setSelectedHabit(habit);
                        setShowEditModal(true);
                      }}
                      className="btn-icon"
                      title={t('common.edit', '수정')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.confirmDeleteHabit', '이 습관을 삭제하시겠습니까?'))) {
                          deleteMutation.mutate(habit.id);
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

      {(!habitsData?.data || habitsData.data.length === 0) && (
        <div className="empty-state">
          <p>{search ? t('common.noResults', '검색 결과가 없습니다.') : t('common.noData', '데이터가 없습니다.')}</p>
        </div>
      )}

      {habitsData?.meta && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.prev', '이전')}
          </button>
          <span>
            {page} / {habitsData.meta.totalPages || 1}
          </span>
          <button
            disabled={page >= habitsData.meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.next', '다음')}
          </button>
        </div>
      )}

      {/* Edit Habit Modal */}
      {showEditModal && selectedHabit && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.editHabit', '습관 수정')}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: selectedHabit.id,
                  data: {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    frequency: formData.get('frequency') as string,
                    targetDays: parseInt(formData.get('targetDays') as string),
                    color: formData.get('color') as string,
                    icon: formData.get('icon') as string,
                  },
                });
              }}
            >
              <div className="form-group">
                <label>{t('common.title', '제목')} *</label>
                <input name="title" defaultValue={selectedHabit.title} required />
              </div>
              <div className="form-group">
                <label>{t('common.description', '설명')}</label>
                <textarea name="description" defaultValue={selectedHabit.description || ''} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('habits.frequency', '빈도')} *</label>
                  <select name="frequency" defaultValue={selectedHabit.frequency} required>
                    <option value="daily">{t('habits.frequency.daily', '매일')}</option>
                    <option value="weekly">{t('habits.frequency.weekly', '주간')}</option>
                    <option value="monthly">{t('habits.frequency.monthly', '월간')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('habits.targetDays', '목표 일수')} *</label>
                  <input
                    type="number"
                    name="targetDays"
                    defaultValue={selectedHabit.targetDays}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('habits.color', '색상')}</label>
                  <input type="color" name="color" defaultValue={selectedHabit.color || '#000000'} />
                </div>
                <div className="form-group">
                  <label>{t('habits.icon', '아이콘')}</label>
                  <input name="icon" defaultValue={selectedHabit.icon || ''} placeholder="📚" />
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

