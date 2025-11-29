import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

interface NavbarProps {
  userEmail: string;
  onLogout: () => void;
  onLanguageToggle: () => void;
  currentLanguage: string;
}

export default function Navbar({ userEmail, onLogout, onLanguageToggle, currentLanguage }: NavbarProps) {
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-logo">
          <span className="logo-icon">📅</span>
          {t('app.title', 'Jacal')}
        </h1>

        <div className="navbar-search">
          <input
            type="text"
            placeholder={t('navbar.search', '검색...')}
            className="navbar-search-input"
          />
          <span className="navbar-search-icon">🔍</span>
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
