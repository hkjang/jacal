import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function UsageAnalytics() {
  const { t } = useTranslation();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin', 'usage-analytics'],
    queryFn: adminAPI.getUsageAnalytics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !analytics) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <h2>{t('admin.usage', '사용량 보고서')}</h2>
      <p className="section-description">User growth and engagement metrics</p>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <p className="metric-value">{analytics.totalUsers}</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>New Users (30d)</h3>
            <p className="metric-value">{analytics.newUsersLast30Days}</p>
            <p className="metric-subtext">+{analytics.userGrowthRate}% growth</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>Active Users (7d)</h3>
            <p className="metric-value">{analytics.activeUsersLast7Days}</p>
            <p className="metric-subtext">{analytics.activeUserRate}% of total</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>Total Events</h3>
            <p className="metric-value">{analytics.totalEvents}</p>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Total Tasks</h3>
            <p className="metric-value">{analytics.totalTasks}</p>
          </div>
        </div>

        <div className="metric-card neutral">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Avg Items/User</h3>
            <p className="metric-value">
              {analytics.totalUsers > 0 
                ? Math.round((analytics.totalEvents + analytics.totalTasks) / analytics.totalUsers)
                : 0}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .admin-section {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .section-description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          gap: 1rem;
          border-left: 4px solid;
        }

        .metric-card.primary { border-color: var(--primary); }
        .metric-card.success { border-color: var(--success); }
        .metric-card.info { border-color: #3498db; }
        .metric-card.warning { border-color: var(--warning); }
        .metric-card.accent { border-color: #9b59b6; }
        .metric-card.neutral { border-color: var(--text-secondary); }

        .metric-icon {
          font-size: 2.5rem;
        }

        .metric-content {
          flex: 1;
        }

        .metric-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
          color: var(--primary);
        }

        .metric-subtext {
          margin: 0.25rem 0 0 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .loading {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
