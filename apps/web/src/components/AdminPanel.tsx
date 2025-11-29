import { useState } from 'react';
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

interface AdminPanelProps {
  onExit: () => void;
}

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  
  // User list state
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(20);
  const [userSearch, setUserSearch] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userPage, userLimit, userSearch],
    queryFn: () => adminAPI.getUsers({ page: userPage, limit: userLimit, search: userSearch }),
  });

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
          <h1 className="admin-title">{t('admin.title', '관리자 패널')}</h1>
          <p className="admin-subtitle">{t('admin.subtitle', '시스템 관리 및 사용자 관리')}</p>
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
