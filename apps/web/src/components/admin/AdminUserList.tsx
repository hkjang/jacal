import { useTranslation } from 'react-i18next';
import { UseMutationResult } from '@tanstack/react-query';
import { User } from '../../types/admin';

interface AdminUserListProps {
  users?: User[];
  onEditUser: (user: User) => void;
  deleteUserMutation: UseMutationResult<void, any, string, unknown>;
}

export default function AdminUserList({ users, onEditUser, deleteUserMutation }: AdminUserListProps) {
  const { t } = useTranslation();

  return (
    <div className="users-section">
      <h2>{t('admin.userManagement', '사용자 관리')}</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>{t('admin.name', '이름')}</th>
            <th>{t('admin.email', '이메일')}</th>
            <th>{t('admin.role', '역할')}</th>
            <th>{t('admin.events', '이벤트')}</th>
            <th>{t('admin.tasks', '작업')}</th>
            <th>{t('admin.actions', '작업')}</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </td>
              <td>{user._count.events}</td>
              <td>{user._count.tasks}</td>
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
        </tbody>
      </table>

      <style>{`
        .users-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-secondary);
          border-radius: 8px;
          overflow: hidden;
        }

        .users-table th,
        .users-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .users-table th {
          background: var(--bg-tertiary);
          font-weight: 600;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .role-badge.admin {
          background: var(--danger-bg);
          color: var(--danger);
        }

        .role-badge.user {
          background: var(--success-bg);
          color: var(--success);
        }

        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
          margin-right: 0.5rem;
        }

        .btn-danger {
          background: var(--danger);
          color: white;
        }

        .btn-danger:hover {
          background: var(--danger-dark);
        }
      `}</style>
    </div>
  );
}
