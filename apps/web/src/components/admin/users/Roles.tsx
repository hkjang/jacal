import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';
import './Roles.css';

interface PermissionGroup {
  id: string;
  name: string;
  icon: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  admin: boolean;
  user: boolean;
}

export default function Roles() {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['user-management']));

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers({ page: 1, limit: 1000, search: '' }),
  });

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const roleStats = {
    admin: users?.data?.filter((u: any) => u.role === 'ADMIN').length || 0,
    user: users?.data?.filter((u: any) => u.role === 'USER').length || 0,
  };

  const permissionGroups: PermissionGroup[] = [
    {
      id: 'user-management',
      name: t('admin.userManagement', '사용자 관리'),
      icon: '👥',
      permissions: [
        { id: 'view-users', name: t('permissions.viewUsers', '사용자 목록 보기'), description: t('permissions.viewUsersDesc', '모든 사용자 정보 열람'), admin: true, user: false },
        { id: 'edit-users', name: t('permissions.editUsers', '사용자 수정'), description: t('permissions.editUsersDesc', '사용자 정보 및 역할 수정'), admin: true, user: false },
        { id: 'delete-users', name: t('permissions.deleteUsers', '사용자 삭제'), description: t('permissions.deleteUsersDesc', '사용자 계정 삭제'), admin: true, user: false },
        { id: 'create-users', name: t('permissions.createUsers', '사용자 생성'), description: t('permissions.createUsersDesc', '새 사용자 계정 생성'), admin: true, user: false },
      ],
    },
    {
      id: 'content-management',
      name: t('admin.contentManagement', '콘텐츠 관리'),
      icon: '📁',
      permissions: [
        { id: 'view-own-content', name: t('permissions.viewOwnContent', '본인 콘텐츠 보기'), description: t('permissions.viewOwnContentDesc', '본인의 일정, 작업, 습관 열람'), admin: true, user: true },
        { id: 'edit-own-content', name: t('permissions.editOwnContent', '본인 콘텐츠 수정'), description: t('permissions.editOwnContentDesc', '본인의 일정, 작업, 습관 수정'), admin: true, user: true },
        { id: 'view-all-content', name: t('permissions.viewAllContent', '모든 콘텐츠 보기'), description: t('permissions.viewAllContentDesc', '전체 사용자 콘텐츠 열람'), admin: true, user: false },
        { id: 'edit-all-content', name: t('permissions.editAllContent', '모든 콘텐츠 수정'), description: t('permissions.editAllContentDesc', '전체 사용자 콘텐츠 수정/삭제'), admin: true, user: false },
      ],
    },
    {
      id: 'system-management',
      name: t('admin.system', '시스템 관리'),
      icon: '⚙️',
      permissions: [
        { id: 'view-stats', name: t('permissions.viewStats', '통계 보기'), description: t('permissions.viewStatsDesc', '시스템 통계 및 분석 열람'), admin: true, user: false },
        { id: 'view-logs', name: t('permissions.viewLogs', '로그 보기'), description: t('permissions.viewLogsDesc', '서버 로그 및 활동 기록 열람'), admin: true, user: false },
        { id: 'manage-backups', name: t('permissions.manageBackups', '백업 관리'), description: t('permissions.manageBackupsDesc', '백업 생성 및 복원'), admin: true, user: false },
        { id: 'manage-settings', name: t('permissions.manageSettings', '설정 관리'), description: t('permissions.manageSettingsDesc', '시스템 설정 변경'), admin: true, user: false },
      ],
    },
    {
      id: 'team-management',
      name: t('admin.teams', '팀 관리'),
      icon: '👪',
      permissions: [
        { id: 'create-team', name: t('permissions.createTeam', '팀 생성'), description: t('permissions.createTeamDesc', '새 팀 생성'), admin: true, user: true },
        { id: 'manage-own-team', name: t('permissions.manageOwnTeam', '본인 팀 관리'), description: t('permissions.manageOwnTeamDesc', '본인이 생성한 팀 관리'), admin: true, user: true },
        { id: 'manage-all-teams', name: t('permissions.manageAllTeams', '모든 팀 관리'), description: t('permissions.manageAllTeamsDesc', '전체 팀 관리 및 삭제'), admin: true, user: false },
      ],
    },
    {
      id: 'integrations',
      name: t('admin.integrations', '통합'),
      icon: '🔌',
      permissions: [
        { id: 'own-integrations', name: t('permissions.ownIntegrations', '본인 통합 관리'), description: t('permissions.ownIntegrationsDesc', '본인의 웹훅, 이메일 연동 관리'), admin: true, user: true },
        { id: 'all-integrations', name: t('permissions.allIntegrations', '모든 통합 관리'), description: t('permissions.allIntegrationsDesc', '시스템 전체 통합 설정 관리'), admin: true, user: false },
      ],
    },
  ];

  const totalAdminPerms = permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.admin).length, 0);
  const totalUserPerms = permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.user).length, 0);

  return (
    <div className="roles-container">
      <div className="roles-header">
        <div className="roles-header-content">
          <h2>{t('admin.roles', '역할 및 권한')}</h2>
          <p className="roles-description">{t('admin.rolesDesc', '사용자 역할과 권한을 관리합니다')}</p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="role-cards-grid">
        <div className="role-card admin">
          <div className="role-card-header">
            <div className="role-icon-large">👑</div>
            <div className="role-badge admin">ADMIN</div>
          </div>
          <div className="role-card-body">
            <h3>{t('admin.adminRole', '관리자')}</h3>
            <p className="role-member-count">{roleStats.admin} {t('admin.members', '명')}</p>
            <div className="role-perm-summary">
              <div className="perm-stat">
                <span className="perm-stat-value">{totalAdminPerms}</span>
                <span className="perm-stat-label">{t('admin.permissions', '권한')}</span>
              </div>
              <div className="perm-stat">
                <span className="perm-stat-value">100%</span>
                <span className="perm-stat-label">{t('admin.access', '접근')}</span>
              </div>
            </div>
            <ul className="role-features">
              <li>✅ {t('admin.fullAccess', '전체 시스템 접근')}</li>
              <li>✅ {t('admin.userManagement', '사용자 관리')}</li>
              <li>✅ {t('admin.systemConfig', '시스템 구성')}</li>
              <li>✅ {t('admin.analytics', '분석 및 로그')}</li>
            </ul>
          </div>
        </div>

        <div className="role-card user">
          <div className="role-card-header">
            <div className="role-icon-large">👤</div>
            <div className="role-badge user">USER</div>
          </div>
          <div className="role-card-body">
            <h3>{t('admin.userRole', '일반 사용자')}</h3>
            <p className="role-member-count">{roleStats.user} {t('admin.members', '명')}</p>
            <div className="role-perm-summary">
              <div className="perm-stat">
                <span className="perm-stat-value">{totalUserPerms}</span>
                <span className="perm-stat-label">{t('admin.permissions', '권한')}</span>
              </div>
              <div className="perm-stat">
                <span className="perm-stat-value">{Math.round((totalUserPerms / totalAdminPerms) * 100)}%</span>
                <span className="perm-stat-label">{t('admin.access', '접근')}</span>
              </div>
            </div>
            <ul className="role-features">
              <li>✅ {t('admin.ownContent', '본인 콘텐츠 관리')}</li>
              <li>✅ {t('admin.teamParticipation', '팀 참여 및 생성')}</li>
              <li>✅ {t('admin.personalIntegrations', '개인 통합 설정')}</li>
              <li>❌ {t('admin.noAdminAccess', '관리자 기능 제외')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Permission Groups */}
      <div className="permissions-section">
        <h3 className="permissions-title">{t('admin.permissionDetails', '권한 상세')}</h3>

        <div className="permission-groups">
          {permissionGroups.map((group) => (
            <div key={group.id} className="permission-group">
              <button
                className={`permission-group-header ${expandedGroups.has(group.id) ? 'expanded' : ''}`}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="group-header-left">
                  <span className="group-icon">{group.icon}</span>
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">{group.permissions.length} {t('admin.items', '항목')}</span>
                </div>
                <span className="group-arrow">{expandedGroups.has(group.id) ? '▼' : '▶'}</span>
              </button>

              {expandedGroups.has(group.id) && (
                <div className="permission-group-body">
                  <table className="permissions-table-enhanced">
                    <thead>
                      <tr>
                        <th className="perm-col-name">{t('admin.permission', '권한')}</th>
                        <th className="perm-col-desc">{t('admin.description', '설명')}</th>
                        <th className="perm-col-role">👑 Admin</th>
                        <th className="perm-col-role">👤 User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.permissions.map((perm) => (
                        <tr key={perm.id}>
                          <td className="perm-name">{perm.name}</td>
                          <td className="perm-desc">{perm.description}</td>
                          <td className="perm-check">
                            <span className={`perm-indicator ${perm.admin ? 'allowed' : 'denied'}`}>
                              {perm.admin ? '✅' : '❌'}
                            </span>
                          </td>
                          <td className="perm-check">
                            <span className={`perm-indicator ${perm.user ? 'allowed' : 'denied'}`}>
                              {perm.user ? '✅' : '❌'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Note */}
      <div className="roles-help-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>{t('admin.note', '안내')}</strong>
          <p>{t('admin.roleChangeNote', '사용자의 역할을 변경하려면 사용자 목록에서 해당 사용자를 선택하여 수정하세요.')}</p>
        </div>
      </div>
    </div>
  );
}
