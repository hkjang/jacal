import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Settings from './Settings';
import Calendar from './Calendar';
import AdminPanel from './AdminPanel';
import HabitTracker from './HabitTracker';
import Dashboard from './Dashboard';
import TeamView from './TeamView';
import HomePage from './HomePage';

import { ViewType } from '../types/navigation';

interface MainLayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userEmail: string;
  onLogout: () => void;
  isAdmin: boolean;
}

export default function MainLayout({
  currentView,
  onViewChange,
  userEmail,
  onLogout,
  isAdmin,
}: MainLayoutProps) {
  const { i18n } = useTranslation();

  const renderView = (): ReactNode => {
    switch (currentView) {
      case 'settings':
        return (
          <main className="app-content">
            <Settings />
          </main>
        );
      case 'calendar':
        return (
          <main className="app-content">
            <Calendar isAdmin={isAdmin} />
          </main>
        );
      case 'admin':
        return <AdminPanel onExit={() => onViewChange('home')} />;
      case 'habits':
        return (
          <main className="app-content">
            <HabitTracker />
          </main>
        );
      case 'dashboard':
        return (
          <main className="app-content">
            <Dashboard />
          </main>
        );
      case 'teams':
        return (
          <main className="app-content">
            <TeamView />
          </main>
        );
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        userEmail={userEmail}
        onLogout={onLogout}
        onLanguageToggle={() => i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko')}
        currentLanguage={i18n.language}
        onViewChange={onViewChange}
      />
      <div className="app-layout">
        {currentView !== 'admin' && (
          <Sidebar
            currentView={currentView}
            onViewChange={onViewChange}
            isAdmin={isAdmin}
          />
        )}
        {renderView()}
      </div>
    </div>
  );
}
