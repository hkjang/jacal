import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { User } from '../../types/admin';
import { PaginatedResponse } from '../../lib/adminApi';
import UserSettingsModal from './UserSettingsModal';
import './AdminUserList.css';

interface AdminUserListProps {
  data?: PaginatedResponse<User>;
  onEditUser: (user: User) => void;
  deleteUserMutation: UseMutationResult<void, any, string, unknown>;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  onCreateUser: () => void;
}

export default function AdminUserList({ 
  data, 
  onEditUser, 
  deleteUserMutation,
  page,
  setPage,
  search,
  setSearch,
  onCreateUser
}: AdminUserListProps) {
  const { t } = useTranslation();
  const [settingsModalUser, setSettingsModalUser] = useState<User | null>(null);

  return (
    <div className="users-section">
      <div className="section-header">
        <h2>{t('admin.userManagement', '사용자 관리')}</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder={t('common.search', '검색...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button onClick={onCreateUser} className="btn btn-primary">
            {t('admin.addUser', '사용자 추가')}
          </button>
        </div>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>{t('admin.name', '이름')}</th>
            <th>{t('admin.email', '이메일')}</th>
            <th>{t('admin.role', '역할')}</th>
            <th>{t('admin.events', '이벤트')}</th>
            <th>{t('admin.tasks', '작업')}</th>
            <th>{t('admin.settings', '설정')}</th>
            <th>{t('admin.actions', '작업')}</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </td>
              <td>{user._count?.events || 0}</td>
              <td>{user._count?.tasks || 0}</td>
              <td>
                <div className="settings-summary">
                  {user.settings?.ollamaEnabled && (
                    <span className="settings-badge ai" title={t('admin.aiEnabled', 'AI 활성화됨')}>
                      AI
                    </span>
                  )}
                  {user.settings?.pop3Enabled && (
                    <span className="settings-badge email" title={t('admin.emailEnabled', '이메일 활성화됨')}>
                      📧
                    </span>
                  )}
                  {user.webhookConfig?.enabled && (
                    <span className="settings-badge webhook" title={t('admin.webhookEnabled', '웹훅 활성화됨')}>
                      🔗
                    </span>
                  )}
                  {user._count?.connectedAccounts > 0 && (
                    <span className="settings-badge integration" title={t('admin.integrations', '연동')}>
                      {user._count.connectedAccounts}
                    </span>
                  )}
                  <button
                    onClick={() => setSettingsModalUser(user)}
                    className="btn btn-xs btn-link"
                    title={t('admin.viewSettings', '설정 보기')}
                  >
                    {t('admin.configure', '설정')}
                  </button>
                </div>
              </td>
              <td>
                <button
                  onClick={() => onEditUser(user)}
                  className="btn btn-sm btn-secondary"
                >
                  {t('admin.edit', '수정')}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('admin.confirmDelete', '정말 삭제하시겠습니까?'))) {
                      deleteUserMutation.mutate(user.id);
                    }
                  }}
                  className="btn btn-sm btn-danger"
                  disabled={deleteUserMutation.isPending}
                >
                  {t('admin.delete', '삭제')}
                </button>
              </td>
            </tr>
          ))}
          {(!data?.data || data.data.length === 0) && (
            <tr>
              <td colSpan={7} className="text-center">
                {t('common.noData', '데이터가 없습니다.')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {data?.meta && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.prev', '이전')}
          </button>
          <span>
            {page} / {data.meta.totalPages || 1}
          </span>
          <button
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.next', '다음')}
          </button>
        </div>
      )}

      {settingsModalUser && (
        <UserSettingsModal
          user={settingsModalUser}
          onClose={() => setSettingsModalUser(null)}
        />
      )}
    </div>
  );
}
