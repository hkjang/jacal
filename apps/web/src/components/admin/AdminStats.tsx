import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../lib/adminApi';
import { Stats } from '../types/admin';

interface AdminStatsProps {
  stats?: Stats;
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const { t } = useTranslation();

  // Fetch additional analytics data for the dashboard
  const { data: analytics } = useQuery({
    queryKey: ['admin', 'usage-analytics'],
    queryFn: adminAPI.getUsageAnalytics,
    staleTime: 60000,
  });

  const { data: systemStats } = useQuery({
    queryKey: ['admin', 'system-stats'],
    queryFn: adminAPI.getSystemStats,
    staleTime: 60000,
  });

  const { data: adoption } = useQuery({
    queryKey: ['admin', 'adoption'],
    queryFn: adminAPI.getAdoptionStats,
    staleTime: 60000,
  });

  if (!stats) return null;

  // Calculate derived metrics
  const activeUserRate = stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;

  const avgEventsPerUser = stats.totalUsers > 0
    ? (stats.totalEvents / stats.totalUsers).toFixed(1)
    : '0';

  const avgTasksPerUser = stats.totalUsers > 0
    ? (stats.totalTasks / stats.totalUsers).toFixed(1)
    : '0';

  // Mock trend data (would come from API in production)
  const trends = {
    users: analytics?.userGrowthRate || 5,
    events: 12,
    tasks: 8,
    active: analytics?.activeUserRate || activeUserRate,
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h2>{t('admin.welcome', '관리자 대시보드에 오신 것을 환영합니다')}</h2>
          <p>{t('admin.welcomeDesc', '시스템 전반의 상태를 한눈에 확인하세요')}</p>
        </div>
        <div className="welcome-time">
          <span className="current-date">{new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid-enhanced">
        <div className="stat-card-enhanced users">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper users">
              <span className="stat-icon">👥</span>
            </div>
            <div className={`stat-trend ${trends.users >= 0 ? 'positive' : 'negative'}`}>
              <span className="trend-icon">{trends.users >= 0 ? '↑' : '↓'}</span>
              <span className="trend-value">{Math.abs(trends.users)}%</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3>{t('admin.totalUsers', '총 사용자')}</h3>
            <p className="stat-value-large">{stats.totalUsers.toLocaleString()}</p>
            <div className="stat-subinfo">
              <span>{t('admin.newThis30Days', '최근 30일')}: +{analytics?.newUsersLast30Days || 0}</span>
            </div>
          </div>
          <div className="stat-card-bar">
            <div className="stat-bar-fill users" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="stat-card-enhanced active">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper active">
              <span className="stat-icon">⚡</span>
            </div>
            <div className={`stat-trend ${trends.active >= 50 ? 'positive' : 'warning'}`}>
              <span className="trend-value">{activeUserRate}%</span>
              <span className="trend-label">{t('admin.activityRate', '활동률')}</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3>{t('admin.activeUsers', '활성 사용자')}</h3>
            <p className="stat-value-large">{stats.activeUsers.toLocaleString()}</p>
            <div className="stat-subinfo">
              <span>{t('admin.last7Days', '최근 7일')}: {analytics?.activeUsersLast7Days || stats.activeUsers}</span>
            </div>
          </div>
          <div className="stat-card-bar">
            <div className="stat-bar-fill active" style={{ width: `${activeUserRate}%` }}></div>
          </div>
        </div>

        <div className="stat-card-enhanced events">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper events">
              <span className="stat-icon">📅</span>
            </div>
            <div className={`stat-trend ${trends.events >= 0 ? 'positive' : 'negative'}`}>
              <span className="trend-icon">{trends.events >= 0 ? '↑' : '↓'}</span>
              <span className="trend-value">{Math.abs(trends.events)}%</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3>{t('admin.totalEvents', '총 일정')}</h3>
            <p className="stat-value-large">{stats.totalEvents.toLocaleString()}</p>
            <div className="stat-subinfo">
              <span>{t('admin.avgPerUser', '사용자당 평균')}: {avgEventsPerUser}</span>
            </div>
          </div>
          <div className="stat-card-bar">
            <div className="stat-bar-fill events" style={{ width: `${Math.min((adoption?.calendar?.adoptionRate || 70), 100)}%` }}></div>
          </div>
        </div>

        <div className="stat-card-enhanced tasks">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper tasks">
              <span className="stat-icon">✅</span>
            </div>
            <div className={`stat-trend ${trends.tasks >= 0 ? 'positive' : 'negative'}`}>
              <span className="trend-icon">{trends.tasks >= 0 ? '↑' : '↓'}</span>
              <span className="trend-value">{Math.abs(trends.tasks)}%</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3>{t('admin.totalTasks', '총 작업')}</h3>
            <p className="stat-value-large">{stats.totalTasks.toLocaleString()}</p>
            <div className="stat-subinfo">
              <span>{t('admin.avgPerUser', '사용자당 평균')}: {avgTasksPerUser}</span>
            </div>
          </div>
          <div className="stat-card-bar">
            <div className="stat-bar-fill tasks" style={{ width: `${Math.min((adoption?.tasks?.adoptionRate || 50), 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="stats-secondary-row">
        <div className="secondary-stat-card">
          <div className="secondary-stat-icon">🎯</div>
          <div className="secondary-stat-content">
            <span className="secondary-stat-label">{t('admin.habits', '습관')}</span>
            <span className="secondary-stat-value">{systemStats?.habits || 0}</span>
          </div>
        </div>
        <div className="secondary-stat-card">
          <div className="secondary-stat-icon">👥</div>
          <div className="secondary-stat-content">
            <span className="secondary-stat-label">{t('admin.teams', '팀')}</span>
            <span className="secondary-stat-value">{adoption?.teams?.count || 0}</span>
          </div>
        </div>
        <div className="secondary-stat-card">
          <div className="secondary-stat-icon">🔔</div>
          <div className="secondary-stat-content">
            <span className="secondary-stat-label">{t('admin.reminders', '알림')}</span>
            <span className="secondary-stat-value">{systemStats?.reminders || 0}</span>
          </div>
        </div>
        <div className="secondary-stat-card">
          <div className="secondary-stat-icon">📊</div>
          <div className="secondary-stat-content">
            <span className="secondary-stat-label">{t('admin.totalItems', '총 항목')}</span>
            <span className="secondary-stat-value">{(stats.totalEvents + stats.totalTasks + (systemStats?.habits || 0)).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Feature Adoption Section */}
      <div className="adoption-section">
        <h3 className="section-title">{t('admin.featureAdoption', '기능 사용률')}</h3>
        <div className="adoption-bars">
          <div className="adoption-item">
            <div className="adoption-label">
              <span className="adoption-icon">📅</span>
              <span>{t('admin.calendar', '캘린더')}</span>
            </div>
            <div className="adoption-bar-container">
              <div className="adoption-bar" style={{
                width: `${adoption?.calendar?.adoptionRate || 70}%`,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)'
              }}></div>
            </div>
            <span className="adoption-percent">{adoption?.calendar?.adoptionRate || 70}%</span>
          </div>
          <div className="adoption-item">
            <div className="adoption-label">
              <span className="adoption-icon">✅</span>
              <span>{t('admin.tasks', '작업')}</span>
            </div>
            <div className="adoption-bar-container">
              <div className="adoption-bar" style={{
                width: `${adoption?.tasks?.adoptionRate || 50}%`,
                background: 'linear-gradient(90deg, #22c55e, #4ade80)'
              }}></div>
            </div>
            <span className="adoption-percent">{adoption?.tasks?.adoptionRate || 50}%</span>
          </div>
          <div className="adoption-item">
            <div className="adoption-label">
              <span className="adoption-icon">🎯</span>
              <span>{t('admin.habits', '습관')}</span>
            </div>
            <div className="adoption-bar-container">
              <div className="adoption-bar" style={{
                width: `${adoption?.habits?.adoptionRate || 30}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              }}></div>
            </div>
            <span className="adoption-percent">{adoption?.habits?.adoptionRate || 30}%</span>
          </div>
          <div className="adoption-item">
            <div className="adoption-label">
              <span className="adoption-icon">👥</span>
              <span>{t('admin.teams', '팀')}</span>
            </div>
            <div className="adoption-bar-container">
              <div className="adoption-bar" style={{
                width: `${adoption?.teams?.adoptionRate || 20}%`,
                background: 'linear-gradient(90deg, #a855f7, #c084fc)'
              }}></div>
            </div>
            <span className="adoption-percent">{adoption?.teams?.adoptionRate || 20}%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="section-title">{t('admin.quickActions', '빠른 동작')}</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="qa-icon">👤</span>
            <span className="qa-label">{t('admin.addUser', '사용자 추가')}</span>
          </button>
          <button className="quick-action-btn">
            <span className="qa-icon">📊</span>
            <span className="qa-label">{t('admin.viewAnalytics', '분석 보기')}</span>
          </button>
          <button className="quick-action-btn">
            <span className="qa-icon">💾</span>
            <span className="qa-label">{t('admin.createBackup', '백업 생성')}</span>
          </button>
          <button className="quick-action-btn">
            <span className="qa-icon">⚙️</span>
            <span className="qa-label">{t('admin.settings', '설정')}</span>
          </button>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          padding: 0;
        }

        .dashboard-welcome {
          background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .welcome-content h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .welcome-content p {
          margin: 0;
          opacity: 0.9;
        }

        .welcome-time {
          text-align: right;
        }

        .current-date {
          font-size: 1rem;
          opacity: 0.9;
        }

        .stats-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1400px) {
          .stats-grid-enhanced {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid-enhanced {
            grid-template-columns: 1fr;
          }
        }

        .stat-card-enhanced {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card-enhanced:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stat-icon-wrapper.users { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); }
        .stat-icon-wrapper.active { background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%); }
        .stat-icon-wrapper.events { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
        .stat-icon-wrapper.tasks { background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%); }

        .stat-trend {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .stat-trend.positive {
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .stat-trend.negative {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .stat-trend.warning {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .trend-icon {
          font-size: 0.75rem;
          margin-right: 2px;
        }

        .trend-label {
          font-size: 0.7rem;
          font-weight: normal;
          opacity: 0.8;
        }

        .stat-card-body h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value-large {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
          line-height: 1;
        }

        .stat-subinfo {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .stat-card-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
        }

        .stat-bar-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .stat-bar-fill.users { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .stat-bar-fill.active { background: linear-gradient(90deg, #22c55e, #4ade80); }
        .stat-bar-fill.events { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .stat-bar-fill.tasks { background: linear-gradient(90deg, #a855f7, #c084fc); }

        .stats-secondary-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .secondary-stat-card {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid var(--border);
        }

        .secondary-stat-icon {
          font-size: 1.5rem;
        }

        .secondary-stat-content {
          display: flex;
          flex-direction: column;
        }

        .secondary-stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .secondary-stat-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .adoption-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
        }

        .adoption-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .adoption-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .adoption-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 100px;
        }

        .adoption-icon {
          font-size: 1.2rem;
        }

        .adoption-bar-container {
          flex: 1;
          height: 24px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .adoption-bar {
          height: 100%;
          border-radius: 12px;
          transition: width 0.5s ease;
        }

        .adoption-percent {
          min-width: 45px;
          font-weight: 600;
          text-align: right;
          color: var(--text-primary);
        }

        .quick-actions-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
        }

        .qa-icon {
          font-size: 1.5rem;
        }

        .qa-label {
          font-size: 0.85rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .dashboard-welcome {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .welcome-time {
            text-align: center;
          }

          .adoption-item {
            flex-wrap: wrap;
          }

          .adoption-label {
            min-width: 80px;
          }
        }
      `}</style>
    </div>
  );
}
