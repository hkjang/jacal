import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventAPI, taskAPI, nluAPI, authAPI, schedulerAPI, focusAPI, Event, Task } from './lib/api';
import Settings from './components/Settings';
import Calendar from './components/Calendar';
import { useTranslation } from 'react-i18next';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [view, setView] = useState<'home' | 'calendar' | 'settings'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [naturalInput, setNaturalInput] = useState('');
  
  const queryClient = useQueryClient();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

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

  // Natural language parsing mutation
  const parseMutation = useMutation({
    mutationFn: (input: string) => nluAPI.parse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNaturalInput('');
    },
  });

  // Auto-schedule mutation
  const autoScheduleMutation = useMutation({
    mutationFn: schedulerAPI.autoSchedule,
    onSuccess: (data) => {
      alert(`Scheduled ${data.scheduled} tasks!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      alert('Failed to auto-schedule tasks');
    },
  });

  // Focus time mutation
  const focusTimeMutation = useMutation({
    mutationFn: focusAPI.protect,
    onSuccess: (data) => {
      alert(`Protected ${data.protected} focus time blocks!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      alert('Failed to protect focus time');
    },
  });

  // Auth mutations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (loginMode === 'login') {
        const data = await authAPI.login(email, password);
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setIsAdmin(data.user.isAdmin || false);
      } else {
        const data = await authAPI.register(email, name, password);
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setIsAdmin(data.user.isAdmin || false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(t('auth.failed', '인증 실패'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleNaturalInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;
    parseMutation.mutate(naturalInput);
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Jacal</h1>
          <p className="auth-subtitle">Your Intelligent Productivity Platform</p>
          
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${loginMode === 'login' ? 'active' : ''}`}
              onClick={() => setLoginMode('login')}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${loginMode === 'register' ? 'active' : ''}`}
              onClick={() => setLoginMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {loginMode === 'register' && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {loginMode === 'login' ? 'Login' : 'Register'}
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
            <button onClick={() => setView('settings')} className={`btn ${view === 'settings' ? 'btn-primary' : 'btn-secondary'}`}>
              {t('nav.settings', '⚙️ 설정')}
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
      ) : (
      <main className="container">
        <section className="nlu-section">
          <h2 className="section-title">Natural Language Input</h2>
          <form onSubmit={handleNaturalInput} className="nlu-form">
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              placeholder="Try: 내일 오전 9시 회의 1시간, 준비 30분 포함"
              className="nlu-input"
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={parseMutation.isPending}
            >
              {parseMutation.isPending ? 'Parsing...' : 'Add'}
            </button>
          </form>
          {parseMutation.isError && (
            <p className="error-message">Failed to parse input. Please check your API key in backend .env</p>
          )}
          
          <div className="flex gap-md" style={{ marginTop: '1rem' }}>
            <button 
              onClick={() => autoScheduleMutation.mutate()} 
              className="btn btn-secondary"
              disabled={autoScheduleMutation.isPending}
            >
              {autoScheduleMutation.isPending ? 'Scheduling...' : '🤖 Auto-Schedule Tasks'}
            </button>
            <button 
              onClick={() => focusTimeMutation.mutate()} 
              className="btn btn-secondary"
              disabled={focusTimeMutation.isPending}
            >
              {focusTimeMutation.isPending ? 'Protecting...' : '🎯 Protect Focus Time'}
            </button>
          </div>
        </section>

        <div className="content-grid">
          <section className="events-section">
            <h2 className="section-title">Events ({events.length})</h2>
            <div className="items-list">
              {events.length === 0 ? (
                <p className="text-secondary">No events yet. Try adding one using natural language!</p>
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
            <h2 className="section-title">Tasks ({tasks.length})</h2>
            <div className="items-list">
              {tasks.length === 0 ? (
                <p className="text-secondary">No tasks yet. Try adding one using natural language!</p>
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
    </div>
  );
}

export default App;
