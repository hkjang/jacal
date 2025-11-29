import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';
import './Roles.css';

export default function Roles() {
  const { t } = useTranslation();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers({ page: 1, limit: 1000, search: '' }),
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const roleStats = {
    admin: users?.data?.filter((u: any) => u.role === 'ADMIN').length || 0,
    user: users?.data?.filter((u: any) => u.role === 'USER').length || 0,
  };

  return (
    <div className="admin-section">
      <h2>{t('admin.roles', '역할 및 권한')}</h2>
      <p className="section-description">User role distribution and permissions</p>

      <div className="role-stats">
        <div className="role-card admin-role">
          <div className="role-icon">👑</div>
          <div className="role-info">
            <h3>Administrators</h3>
            <p className="role-count">{roleStats.admin}</p>
            <p className="role-desc">Full system access</p>
          </div>
        </div>

        <div className="role-card user-role">
          <div className="role-icon">👤</div>
          <div className="role-info">
            <h3>Regular Users</h3>
            <p className="role-count">{roleStats.user}</p>
            <p className="role-desc">Standard access</p>
          </div>
        </div>
      </div>

      <div className="permissions-section">
        <h3>Role Permissions</h3>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Admin</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>View own data</td>
              <td><span className="check">✅</span></td>
              <td><span className="check">✅</span></td>
            </tr>
            <tr>
              <td>Manage own content</td>
              <td><span className="check">✅</span></td>
              <td><span className="check">✅</span></td>
            </tr>
            <tr>
              <td>View all users</td>
              <td><span className="check">✅</span></td>
              <td><span className="cross">❌</span></td>
            </tr>
            <tr>
              <td>Manage users</td>
              <td><span className="check">✅</span></td>
              <td><span className="cross">❌</span></td>
            </tr>
            <tr>
              <td>System statistics</td>
              <td><span className="check">✅</span></td>
              <td><span className="cross">❌</span></td>
            </tr>
            <tr>
              <td>Analytics</td>
              <td><span className="check">✅</span></td>
              <td><span className="cross">❌</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="note">
        <p>💡 <strong>Note:</strong> Role changes can be made in the User List section by editing individual users.</p>
      </div>
    </div>
  );
}
