import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';
import './ActivityLog.css';

export default function ActivityLog() {
  const { t } = useTranslation();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers({ page: 1, limit: 1000, search: '' }),
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  // Generate mock activity logs based on user data
  const activities = users?.data?.flatMap((user: any) => [
    {
      id: `${user.id}-1`,
      user: user.name,
      email: user.email,
      action: 'Logged in',
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      type: 'auth',
    },
    {
      id: `${user.id}-2`,
      user: user.name,
      email: user.email,
      action: `Created ${user._count.events} events`,
      timestamp: new Date(user.createdAt),
      type: 'content',
    },
  ]).sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'auth': return '🔐';
      case 'content': return '📝';
      case 'admin': return '⚙️';
      default: return '📋';
    }
  };

  return (
    <div className="admin-section">
      <h2>{t('admin.activity', '활동 로그')}</h2>
      <p className="section-description">Recent user activities and system events</p>

      <div className="activity-list">
        {activities?.map((activity: any) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon">{getActivityIcon(activity.type)}</div>
            <div className="activity-content">
              <div className="activity-header">
                <strong>{activity.user}</strong>
                <span className="activity-email">{activity.email}</span>
              </div>
              <p className="activity-action">{activity.action}</p>
            </div>
            <div className="activity-time">
              {activity.timestamp.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="note">
        <p>💡 <strong>Note:</strong> This is a mock implementation. For production, implement proper activity logging middleware that tracks all user actions.</p>
      </div>
    </div>
  );
}
