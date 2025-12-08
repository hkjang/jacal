import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AdminSidebar.css';

interface AdminSidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  onExit: () => void;
}

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  children?: MenuItem[];
}

export default function AdminSidebar({ currentSection, onSectionChange, onExit }: AdminSidebarProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'users']));
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      icon: '📊',
      label: t('admin.overview', '개요'),
      children: [
        { id: 'dashboard', icon: '📈', label: t('admin.dashboard', '대시보드') },
        { id: 'stats', icon: '📉', label: t('admin.stats', '시스템 통계') },
      ],
    },
    {
      id: 'users',
      icon: '👥',
      label: t('admin.userManagement', '사용자 관리'),
      children: [
        { id: 'users-list', icon: '👤', label: t('admin.usersList', '사용자 목록') },
        { id: 'roles', icon: '🎭', label: t('admin.roles', '역할 및 권한') },
        { id: 'activity', icon: '📝', label: t('admin.activity', '활동 로그') },
      ],
    },
    {
      id: 'content',
      icon: '📁',
      label: t('admin.contentManagement', '콘텐츠 관리'),
      children: [
        { id: 'habits-admin', icon: '✅', label: t('admin.habits', '습관') },
        { id: 'teams-admin', icon: '👥', label: t('admin.teams', '팀') },
        { id: 'tasks-admin', icon: '📋', label: t('admin.tasks', '작업') },
        { id: 'events-admin', icon: '📅', label: t('admin.events', '일정') },
        { id: 'reminders-admin', icon: '🔔', label: t('admin.reminders', '알림') },
      ],
    },
    {
      id: 'analytics',
      icon: '📈',
      label: t('admin.analytics', '분석'),
      children: [
        { id: 'usage', icon: '📊', label: t('admin.usage', '사용량 보고서') },
        { id: 'performance', icon: '⚡', label: t('admin.performance', '성능 메트릭') },
        { id: 'adoption', icon: '📈', label: t('admin.adoption', '기능 사용률') },
      ],
    },
    {
      id: 'system',
      icon: '⚙️',
      label: t('admin.system', '시스템'),
      children: [
        { id: 'health', icon: '💚', label: t('admin.health', '상태 모니터') },
        { id: 'database', icon: '🗄️', label: t('admin.database', '데이터베이스') },
        { id: 'backups', icon: '💾', label: t('admin.backups', '백업') },
        { id: 'logs', icon: '📄', label: t('admin.logs', '서버 로그') },
      ],
    },
    {
      id: 'config',
      icon: '🔧',
      label: t('admin.configuration', '구성'),
      children: [
        { id: 'general', icon: '⚙️', label: t('admin.general', '일반 설정') },
        { id: 'integrations', icon: '🔌', label: t('admin.integrations', '통합') },
        { id: 'webhooks', icon: '🪝', label: t('admin.webhooks', '웹훅') },
        { id: 'notification-webhooks', icon: '🔔', label: t('admin.notificationWebhooks', '알림 웹훅') },
        { id: 'email', icon: '📧', label: t('admin.email', '이메일 설정') },
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = currentSection === item.id;

    return (
      <div key={item.id} className="admin-sidebar-item-container">
        <button
          className={`admin-sidebar-item ${isActive ? 'active' : ''} depth-${depth}`}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id);
            } else {
              onSectionChange(item.id);
            }
          }}
          title={item.label}
        >
          <span className="admin-sidebar-icon">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="admin-sidebar-label">{item.label}</span>
              {hasChildren && (
                <span className="admin-sidebar-arrow">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
            </>
          )}
        </button>
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="admin-sidebar-children">
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <h2 className="admin-sidebar-title">
          {!isCollapsed && t('admin.panel', '관리자 패널')}
        </h2>
        <button
          className="admin-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? t('sidebar.expand', '확장') : t('sidebar.collapse', '축소')}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      <div className="admin-sidebar-actions">
        <button
          className={`back-to-app-btn ${isCollapsed ? 'collapsed' : ''}`}
          onClick={onExit}
        >
          <span className="icon">🏠</span>
          {!isCollapsed && <span className="label">{t('admin.backToApp', '앱으로 돌아가기')}</span>}
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </aside>
  );
}
