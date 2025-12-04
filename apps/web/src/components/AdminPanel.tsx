import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../lib/adminApi';
import { User } from '../types/admin';
import AdminStats from './admin/AdminStats';
import AdminUserList from './admin/AdminUserList';
import AdminUserEditModal from './admin/AdminUserEditModal';
import AdminUserCreateModal from './admin/AdminUserCreateModal';
import AdminSidebar from './admin/AdminSidebar';
import SystemStats from './admin/SystemStats';
import Roles from './admin/users/Roles';
import ActivityLog from './admin/users/ActivityLog';
import HabitsAdmin from './admin/content/HabitsAdmin';
import TeamsAdmin from './admin/content/TeamsAdmin';
import TasksAdmin from './admin/content/TasksAdmin';
import EventsAdmin from './admin/content/EventsAdmin';
import UsageAnalytics from './admin/analytics/UsageAnalytics';
import PerformanceMetrics from './admin/analytics/PerformanceMetrics';
import AdoptionStats from './admin/analytics/AdoptionStats';
import SystemHealth from './admin/system/SystemHealth';
import DatabaseManager from './admin/system/DatabaseManager';
import BackupManager from './admin/system/BackupManager';
import ServerLogs from './admin/system/ServerLogs';
import GeneralConfig from './admin/config/GeneralConfig';
import IntegrationsAdmin from './admin/config/IntegrationsAdmin';
import WebhooksConfig from './admin/config/WebhooksConfig';
import EmailSettings from './admin/config/EmailSettings';
import './PageLayouts.css';
import './admin/AdminPanel.css';

interface AdminPanelProps {
  onExit: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'user' | 'team' | 'event' | 'task' | 'habit' | 'menu';
  icon: string;
  section?: string;
}

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  
  // Global search state
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // User list state
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(20);
  const [userSearch, setUserSearch] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userPage, userLimit, userSearch],
    queryFn: () => adminAPI.getUsers({ page: userPage, limit: userLimit, search: userSearch }),
  });

  // Menu sections for search
  const menuSections: SearchResult[] = [
    { id: 'dashboard', title: t('admin.dashboard', '대시보드'), type: 'menu', icon: '📊', section: 'dashboard' },
    { id: 'stats', title: t('admin.systemStats', '시스템 통계'), type: 'menu', icon: '📈', section: 'stats' },
    { id: 'users-list', title: t('admin.users', '사용자 관리'), type: 'menu', icon: '👥', section: 'users-list' },
    { id: 'roles', title: t('admin.roles', '역할 관리'), type: 'menu', icon: '🔑', section: 'roles' },
    { id: 'activity', title: t('admin.activity', '활동 로그'), type: 'menu', icon: '📋', section: 'activity' },
    { id: 'habits-admin', title: t('admin.habits', '습관 관리'), type: 'menu', icon: '✅', section: 'habits-admin' },
    { id: 'teams-admin', title: t('admin.teams', '팀 관리'), type: 'menu', icon: '👪', section: 'teams-admin' },
    { id: 'tasks-admin', title: t('admin.tasks', '작업 관리'), type: 'menu', icon: '📝', section: 'tasks-admin' },
    { id: 'events-admin', title: t('admin.events', '일정 관리'), type: 'menu', icon: '📅', section: 'events-admin' },
    { id: 'usage', title: t('admin.usage', '사용량 분석'), type: 'menu', icon: '📊', section: 'usage' },
    { id: 'performance', title: t('admin.performance', '성능 지표'), type: 'menu', icon: '⚡', section: 'performance' },
    { id: 'health', title: t('admin.health', '시스템 상태'), type: 'menu', icon: '💚', section: 'health' },
    { id: 'database', title: t('admin.database', '데이터베이스'), type: 'menu', icon: '🗃️', section: 'database' },
    { id: 'backups', title: t('admin.backups', '백업 관리'), type: 'menu', icon: '💾', section: 'backups' },
    { id: 'logs', title: t('admin.logs', '서버 로그'), type: 'menu', icon: '📜', section: 'logs' },
    { id: 'general', title: t('admin.general', '일반 설정'), type: 'menu', icon: '⚙️', section: 'general' },
    { id: 'integrations', title: t('admin.integrations', '통합 설정'), type: 'menu', icon: '🔗', section: 'integrations' },
    { id: 'webhooks', title: t('admin.webhooks', '웹훅 설정'), type: 'menu', icon: '🪝', section: 'webhooks' },
    { id: 'email', title: t('admin.email', '이메일 설정'), type: 'menu', icon: '📧', section: 'email' },
  ];

  // Global search effect
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = globalSearch.toLowerCase();
    const results: SearchResult[] = [];

    // Search menu sections
    menuSections.forEach(menu => {
      if (menu.title.toLowerCase().includes(query)) {
        results.push(menu);
      }
    });

    // Search users from loaded data
    if (usersData?.data) {
      usersData.data.forEach((user: User) => {
        if (user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)) {
          results.push({
            id: user.id,
            title: user.name,
            subtitle: user.email,
            type: 'user',
            icon: '👤',
            section: 'users-list',
          });
        }
      });
    }

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  }, [globalSearch, usersData, t]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.section) {
      setCurrentSection(result.section);
    }
    setGlobalSearch('');
    setShowSearchResults(false);
  };

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminAPI.getStats,
  });


  const updateUserMutation = useMutation({
    mutationFn: adminAPI.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditMode(false);
      setSelectedUser(null);
      alert(t('admin.userUpdated', '사용자가 업데이트되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.updateFailed', '업데이트 실패: ') + error.response?.data?.error);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: adminAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setCreateMode(false);
      alert(t('admin.userCreated', '사용자가 생성되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.createFailed', '생성 실패: ') + error.response?.data?.error);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setSelectedUser(null);
      alert(t('admin.userDeleted', '사용자가 삭제되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.response?.data?.error);
    },
  });

  const handleSaveUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      timezone: selectedUser.timezone,
    });
  };

  const handleCreateUser = (data: any) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditMode(true);
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminStats stats={stats} />;
      case 'stats':
        return <SystemStats />;
      case 'users-list':
        return (
          <AdminUserList
            data={usersData}
            onEditUser={handleEditUser}
            deleteUserMutation={deleteUserMutation}
            page={userPage}
            setPage={setUserPage}
            search={userSearch}
            setSearch={setUserSearch}
            onCreateUser={() => setCreateMode(true)}
          />
        );
      case 'roles':
        return <Roles />;
      case 'activity':
        return <ActivityLog />;
      case 'habits-admin':
        return <HabitsAdmin />;
      case 'teams-admin':
        return <TeamsAdmin />;
      case 'tasks-admin':
        return <TasksAdmin />;
      case 'events-admin':
        return <EventsAdmin />;
      case 'usage':
        return <UsageAnalytics />;
      case 'performance':
        return <PerformanceMetrics />;
      case 'adoption':
        return <AdoptionStats />;
      case 'health':
        return <SystemHealth />;
      case 'database':
        return <DatabaseManager />;
      case 'backups':
        return <BackupManager />;
      case 'logs':
        return <ServerLogs />;
      case 'general':
        return <GeneralConfig />;
      case 'integrations':
        return <IntegrationsAdmin />;
      case 'webhooks':
        return <WebhooksConfig />;
      case 'email':
        return <EmailSettings />;
      default:
        return <AdminStats stats={stats} />;
    }
  };

  if (usersLoading && currentSection === 'users-list' && !usersData) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onExit={onExit}
      />
      <div className="admin-content">
        <div className="admin-header">
          <div className="admin-header-left">
            <h1 className="admin-title">{t('admin.title', '관리자 패널')}</h1>
            <p className="admin-subtitle">{t('admin.subtitle', '시스템 관리 및 사용자 관리')}</p>
          </div>
          <div className="admin-header-right" ref={searchRef}>
            <div className="admin-global-search">
              <span className="admin-global-search-icon">🔍</span>
              <input
                type="text"
                className="admin-global-search-input"
                placeholder={t('admin.searchPlaceholder', '메뉴, 사용자 검색...')}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => globalSearch && setShowSearchResults(true)}
              />
              {showSearchResults && (
                <div className="admin-search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="admin-search-result-item"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <span className="admin-search-result-icon">{result.icon}</span>
                        <div className="admin-search-result-content">
                          <div className="admin-search-result-title">{result.title}</div>
                          {result.subtitle && (
                            <div className="admin-search-result-subtitle">{result.subtitle}</div>
                          )}
                        </div>
                        <span className="admin-search-result-type">
                          {result.type === 'menu' ? t('admin.menu', '메뉴') : t('admin.user', '사용자')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="admin-search-no-results">
                      {t('admin.noSearchResults', '검색 결과가 없습니다')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {renderContent()}

        {editMode && selectedUser && (
          <AdminUserEditModal
            user={selectedUser}
            onSave={handleSaveUser}
            onCancel={() => setEditMode(false)}
            onChange={setSelectedUser}
            isSaving={updateUserMutation.isPending}
          />
        )}

        {createMode && (
          <AdminUserCreateModal
            onSave={handleCreateUser}
            onCancel={() => setCreateMode(false)}
            isSaving={createUserMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
