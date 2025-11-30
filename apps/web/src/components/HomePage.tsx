import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { eventAPI, taskAPI, Event, Task } from '../lib/api';
import { useNaturalInput } from '../hooks/useNaturalInput';
import { useScheduler } from '../hooks/useScheduler';
import { useFocus } from '../hooks/useFocus';
import './PageLayouts.css';

export default function HomePage() {
  const { t } = useTranslation();
  const { naturalInput, setNaturalInput, handleNaturalInput, parseMutation } = useNaturalInput();
  const { autoScheduleMutation } = useScheduler();
  const { focusTimeMutation } = useFocus();

  // Fetch events and tasks
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: eventAPI.getAll,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskAPI.getAll,
  });

  return (
    <main className="app-content" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <section className="nlu-section">
        <h2 className="section-title">{t('nlu.title', '자연어 입력')}</h2>
        <form onSubmit={handleNaturalInput} className="nlu-form">
          <input
            type="text"
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            placeholder={t('nlu.placeholder', '예: 내일 오전 9시 회의 1시간, 준비 30분 포함')}
            className="nlu-input"
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={parseMutation.isPending}
          >
            {parseMutation.isPending ? t('nlu.button.parsing', '분석 중...') : t('nlu.button.add', '추가')}
          </button>
        </form>
        {parseMutation.isError && (
          <p className="error-message">{t('nlu.error', '입력 분석 실패. 백엔드 .env 파일의 API 키를 확인해주세요.')}</p>
        )}
        
        <div className="flex gap-md" style={{ marginTop: '1rem' }}>
          <button 
            onClick={() => autoScheduleMutation.mutate()} 
            className="btn btn-secondary"
            disabled={autoScheduleMutation.isPending}
          >
            {autoScheduleMutation.isPending ? t('actions.scheduling', '스케줄링 중...') : t('actions.autoSchedule', '🤖 작업 자동 스케줄링')}
          </button>
          <button 
            onClick={() => focusTimeMutation.mutate()} 
            className="btn btn-secondary"
            disabled={focusTimeMutation.isPending}
          >
            {focusTimeMutation.isPending ? t('actions.protecting', '보호 중...') : t('actions.protectFocus', '🎯 집중 시간 보호')}
          </button>
        </div>
      </section>

      <div className="content-grid">
        <section className="events-section">
          <h2 className="section-title">{t('events.title', '일정')} ({events.length})</h2>
          <div className="items-list">
            {events.length === 0 ? (
              <p className="text-secondary">{t('events.empty', '아직 일정이 없습니다. 자연어로 추가해보세요!')}</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="card event-card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="item-title">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-secondary">{event.description}</p>
                      )}
                    </div>
                    <div className="event-time">
                      <p className="text-sm">{new Date(event.startAt).toLocaleString()}</p>
                      <p className="text-xs text-secondary">
                        to {new Date(event.endAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {event.location && (
                    <p className="text-sm text-secondary mt-sm">📍 {event.location}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tasks-section">
          <h2 className="section-title">{t('tasks.title', '할 일')} ({tasks.length})</h2>
          <div className="items-list">
            {tasks.length === 0 ? (
              <p className="text-secondary">{t('tasks.empty', '아직 할 일이 없습니다. 자연어로 추가해보세요!')}</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="card task-card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="item-title">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-secondary">{task.description}</p>
                      )}
                    </div>
                    <div className="task-meta">
                      {task.priority > 0 && (
                        <span className="priority-badge">P{task.priority}</span>
                      )}
                      <span className={`status-badge status-${task.status}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.dueAt && (
                    <p className="text-sm text-secondary mt-sm">
                      ⏰ Due: {new Date(task.dueAt).toLocaleString()}
                    </p>
                  )}
                  {task.estimatedMinutes && (
                    <p className="text-xs text-secondary">
                      ⏱️ Est: {task.estimatedMinutes} minutes
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
