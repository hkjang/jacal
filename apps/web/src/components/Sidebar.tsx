import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ViewType } from '../types/navigation';
import './Navigation.css';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAdmin: boolean;
}

export default function Sidebar({ currentView, onViewChange, isAdmin }: SidebarProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: { id: ViewType; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: t('nav.home', '홈') },
    { id: 'calendar', icon: '📅', label: t('calendar.title', '캘린더') },
    { id: 'habits', icon: '✅', label: t('nav.habits', '습관') },
    { id: 'dashboard', icon: '📊', label: t('nav.dashboard', '대시보드') },
    { id: 'teams', icon: '👥', label: t('nav.teams', '팀') },
    { id: 'settings', icon: '⚙️', label: t('nav.settings', '설정') },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', icon: '👑', label: t('nav.admin', '관리자') });
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? t('sidebar.expand', '확장') : t('sidebar.collapse', '축소')}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
            title={item.label}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
