import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitAPI } from '../lib/habitApi';
import { Habit } from '../types/habit';

export default function HabitTracker() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    targetDays: 7,
    color: '#4CAF50',
    icon: '✅',
  });

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: habitAPI.getAll,
  });

  const createHabitMutation = useMutation({
    mutationFn: habitAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowCreateModal(false);
      setNewHabit({
        title: '',
        description: '',
        frequency: 'daily',
        targetDays: 7,
        color: '#4CAF50',
        icon: '✅',
      });
    },
  });

  const logCompletionMutation = useMutation({
    mutationFn: ({ habitId }: { habitId: string }) => habitAPI.logCompletion(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: habitAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const getStreak = (habit: Habit): number => {
    if (!habit.logs || habit.logs.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    const sortedLogs = [...habit.logs].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    for (const log of sortedLogs) {
      const logDate = new Date(log.completedAt);
      logDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  };

  const isCompletedToday = (habit: Habit): boolean => {
    if (!habit.logs || habit.logs.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return habit.logs.some(log => {
      const logDate = new Date(log.completedAt);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="habit-tracker">
      <div className="habit-header">
        <h1>{t('habits.title', '습관 트래커')}</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          {t('habits.create', '+ 새 습관')}
        </button>
      </div>

      <div className="habits-grid">
        {habits?.map((habit) => (
          <div key={habit.id} className="habit-card" style={{ borderLeft: `4px solid ${habit.color}` }}>
            <div className="habit-card-header">
              <div className="habit-info">
                <span className="habit-icon">{habit.icon}</span>
                <div>
                  <h3>{habit.title}</h3>
                  {habit.description && <p className="habit-description">{habit.description}</p>}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(t('habits.confirmDelete', '정말 삭제하시겠습니까?'))) {
                    deleteHabitMutation.mutate(habit.id);
                  }
                }}
                className="btn-icon"
              >
                🗑️
              </button>
            </div>

            <div className="habit-stats">
              <div className="stat">
                <span className="stat-label">{t('habits.streak', '연속')}</span>
                <span className="stat-value">🔥 {getStreak(habit)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{t('habits.total', '총')}</span>
                <span className="stat-value">{habit.logs?.length || 0}</span>
              </div>
            </div>

            <button
              onClick={() => logCompletionMutation.mutate({ habitId: habit.id })}
              className={`btn ${isCompletedToday(habit) ? 'btn-success' : 'btn-primary'}`}
              disabled={isCompletedToday(habit) || logCompletionMutation.isPending}
            >
              {isCompletedToday(habit) ? t('habits.completed', '✓ 완료됨') : t('habits.complete', '완료하기')}
            </button>
          </div>
        ))}

        {habits?.length === 0 && (
          <div className="empty-state">
            <p>{t('habits.empty', '아직 습관이 없습니다. 새로운 습관을 만들어보세요!')}</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('habits.createNew', '새 습관 만들기')}</h2>
            <div className="form-group">
              <label>{t('habits.title', '제목')}</label>
              <input
                type="text"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                placeholder={t('habits.titlePlaceholder', '예: 물 마시기')}
              />
            </div>
            <div className="form-group">
              <label>{t('habits.description', '설명')}</label>
              <textarea
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                placeholder={t('habits.descriptionPlaceholder', '습관에 대한 설명...')}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('habits.icon', '아이콘')}</label>
                <input
                  type="text"
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="form-group">
                <label>{t('habits.color', '색상')}</label>
                <input
                  type="color"
                  value={newHabit.color}
                  onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => createHabitMutation.mutate(newHabit)}
                className="btn btn-primary"
                disabled={!newHabit.title || createHabitMutation.isPending}
              >
                {createHabitMutation.isPending ? t('common.creating', '생성 중...') : t('common.create', '생성')}
              </button>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                {t('common.cancel', '취소')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .habit-tracker {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .habit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .habits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .habit-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .habit-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .habit-info {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .habit-icon {
          font-size: 2rem;
        }

        .habit-description {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }

        .habit-stats {
          display: flex;
          gap: 1rem;
        }

        .stat {
          flex: 1;
          background: var(--bg-tertiary);
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: bold;
        }

        .btn-icon {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .btn-icon:hover {
          opacity: 1;
        }

        .btn-success {
          background: var(--success);
          color: white;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg-primary);
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
