import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchAPI, Task, Event } from '../lib/api';
import { ViewType } from '../types/navigation';
import './Navigation.css';

interface NavbarProps {
  userEmail: string;
  onLogout: () => void;
  onLanguageToggle: () => void;
  currentLanguage: string;
  onViewChange: (view: ViewType) => void;
}

export default function Navbar({ userEmail, onLogout, onLanguageToggle, currentLanguage, onViewChange }: NavbarProps) {
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tasks: Task[]; events: Event[]; habits: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          console.log('Searching for:', query);
          const data = await searchAPI.search(query);
          console.log('Search results:', data);
          setResults(data);
          setShowResults(true);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (type: 'task' | 'event' | 'habit', id: string) => {
    setShowResults(false);
    setQuery('');
    // Navigate based on type
    if (type === 'task') onViewChange('home'); // Tasks are on home page
    else if (type === 'event') onViewChange('calendar');
    else if (type === 'habit') onViewChange('habits');
    
    // Ideally we would also scroll to or highlight the item, but for now just switching view is enough
    console.log(`Navigate to ${type} ${id}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-logo">
          <span className="logo-icon">📅</span>
          {t('app.title', 'Jacal')}
        </h1>

        <div className="navbar-search" ref={searchRef}>
          <input
            type="text"
            placeholder={t('navbar.search', '검색...')}
            className="navbar-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
                if (query.trim().length >= 2 && results) setShowResults(true);
            }}
          />
          <span className="navbar-search-icon">
            {isLoading ? '⌛' : '🔍'}
          </span>

          {showResults && results && (
            <div className="search-results-dropdown">
              {results.tasks.length === 0 && results.events.length === 0 && results.habits.length === 0 ? (
                 <div className="search-no-results">{t('search.noResults', '검색 결과가 없습니다.')}</div>
              ) : (
                <>
                  {results.tasks.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-title">{t('search.tasks', '할 일')}</div>
                      {results.tasks.map(task => (
                        <div key={task.id} className="search-result-item" onClick={() => handleResultClick('task', task.id)}>
                          <span className="search-result-icon">✓</span>
                          <span className="search-result-text">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.events.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-title">{t('search.events', '일정')}</div>
                      {results.events.map(event => (
                        <div key={event.id} className="search-result-item" onClick={() => handleResultClick('event', event.id)}>
                          <span className="search-result-icon">📅</span>
                          <span className="search-result-text">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.habits.length > 0 && (
                    <div className="search-section">
                      <div className="search-section-title">{t('search.habits', '습관')}</div>
                      {results.habits.map(habit => (
                        <div key={habit.id} className="search-result-item" onClick={() => handleResultClick('habit', habit.id)}>
                          <span className="search-result-icon">🔄</span>
                          <span className="search-result-text">{habit.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="navbar-right">
          <button
            onClick={onLanguageToggle}
            className="navbar-btn"
            title={currentLanguage === 'ko' ? 'Switch to English' : '한국어로 전환'}
          >
            {currentLanguage === 'ko' ? '🇬🇧 EN' : '🇰🇷 KR'}
          </button>

          <div className="navbar-user-menu">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="navbar-user-btn"
            >
              <span className="navbar-user-avatar">👤</span>
              <span className="navbar-user-email">{userEmail}</span>
              <span className="navbar-user-arrow">{showUserMenu ? '▲' : '▼'}</span>
            </button>

            {showUserMenu && (
              <div className="navbar-dropdown">
                <button
                  onClick={onLogout}
                  className="navbar-dropdown-item"
                >
                  🚪 {t('nav.logout', '로그아웃')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
