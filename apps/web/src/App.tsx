import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventAPI, taskAPI, Event, Task } from './lib/api';
import Settings from './components/Settings';
import Calendar from './components/Calendar';
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';
import { useNaturalInput } from './hooks/useNaturalInput';
import { useScheduler } from './hooks/useScheduler';
import { useFocus } from './hooks/useFocus';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import AdminPanel from './components/AdminPanel';
import HabitTracker from './components/HabitTracker';
import Dashboard from './components/Dashboard';
import TeamView from './components/TeamView';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'home' | 'calendar' | 'settings' | 'admin' | 'habits' | 'dashboard' | 'teams'>('home');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  const { 
    isAuthenticated, 
    isAdmin, 
    loginMode, 
    setLoginMode, 
    email, 
    setEmail, 
    password, 
    setPassword, 
    name, 
    setName, 
    handleAuth, 
    handleLogout 
  } = useAuth();

  const { naturalInput, setNaturalInput, handleNaturalInput, parseMutation } = useNaturalInput();
  const { autoScheduleMutation } = useScheduler();
  const { focusTimeMutation } = useFocus();

  // Fetch events and tasks
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: eventAPI.getAll,
    enabled: isAuthenticated,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskAPI.getAll,
    enabled: isAuthenticated,
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: '1', alt: true, handler: () => setView('home'), description: 'Go to Home' },
    { key: '2', alt: true, handler: () => setView('calendar'), description: 'Go to Calendar' },
    { key: '3', alt: true, handler: () => setView('settings'), description: 'Go to Settings' },
    { key: '4', alt: true, handler: () => setView('admin'), description: 'Go to Admin', condition: isAdmin },
    { key: '/', shift: true, handler: () => setShowShortcutsModal(true), description: 'Show shortcuts' },
    { key: 'k', ctrlOrCmd: true, handler: () => {
      const input = document.querySelector('.nlu-input') as HTMLInputElement;
      if (input) input.focus();
    }, description: 'Focus input' },
  ], isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Jacal</h1>
          <p className="auth-subtitle">{t('app.subtitle', '지능형 생산성 플랫폼')}</p>
          
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${loginMode === 'login' ? 'active' : ''}`}
              onClick={() => setLoginMode('login')}
            >
              {t('auth.login', '로그인')}
            </button>
            <button 
              className={`auth-tab ${loginMode === 'register' ? 'active' : ''}`}
              onClick={() => setLoginMode('register')}
            >
              {t('auth.register', '회원가입')}
            </button>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {loginMode === 'register' && (
              <div className="form-group">
                <label>{t('auth.name', '이름')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>{t('auth.email', '이메일')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('auth.password', '비밀번호')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {loginMode === 'login' ? t('auth.login', '로그인') : t('auth.register', '회원가입')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="logo">{t('app.title', 'Jacal')}</h1>
            <p className="text-sm text-secondary">{t('app.subtitle', '지능형 생산성 플랫폼')}</p>
          </div>
          <div className="flex gap-md items-center">
            <button onClick={() => setView('home')} className={`btn ${view === 'home' ? 'btn-primary' : 'btn-secondary'}`}>
              {t('nav.home', '🏠 홈')}
            </button>
            <button onClick={() => setView('calendar')} className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}>
              📅 {t('calendar.title', '캘린더')}
            </button>
            <button onClick={() => setView('habits')} className={`btn ${view === 'habits' ? 'btn-primary' : 'btn-secondary'}`}>
              {t('nav.habits', '✅ 습관')}
            </button>
            <button onClick={() => setView('dashboard')} className={`btn ${view === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}>
              {t('nav.dashboard', '📊 대시보드')}
            </button>
            <button onClick={() => setView('teams')} className={`btn ${view === 'teams' ? 'btn-primary' : 'btn-secondary'}`}>
              {t('nav.teams', '👥 팀')}
            </button>
            <button onClick={() => setView('settings')} className={`btn ${view === 'settings' ? 'btn-primary' : 'btn-secondary'}`}>
              {t('nav.settings', '⚙️ 설정')}
            </button>
            {isAdmin && (
              <button onClick={() => setView('admin')} className={`btn ${view === 'admin' ? 'btn-primary' : 'btn-secondary'}`}>
                {t('nav.admin', '👑 관리자')}
              </button>
            )}
            <button 
              onClick={() => i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko')} 
              className="btn btn-secondary"
              title={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
            >
              {i18n.language === 'ko' ? '🇬🇧 EN' : '🇰🇷 KR'}
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              {t('nav.logout', '로그아웃')}
            </button>
          </div>
        </div>
      </header>

      {view === 'settings' ? (
        <Settings />
      ) : view === 'calendar' ? (
        <Calendar isAdmin={isAdmin} />
      ) : view === 'admin' ? (
        <AdminPanel />
      ) : view === 'habits' ? (
        <HabitTracker />
      ) : view === 'dashboard' ? (
        <Dashboard />
      ) : view === 'teams' ? (
        <TeamView />
      ) : (
      <main className="container">
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
      )}

      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}

export default App;
