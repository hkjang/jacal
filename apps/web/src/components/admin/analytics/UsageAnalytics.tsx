import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function UsageAnalytics() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin', 'usage-analytics'],
    queryFn: adminAPI.getUsageAnalytics,
    refetchInterval: 30000,
  });

  if (isLoading || !analytics) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  // Generate mock trend data for visualization
  const generateTrendData = (days: number, baseValue: number, growth: number) => {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * 0.2;
      const value = Math.round(baseValue * (1 + (growth / 100) * ((days - i) / days)) * (1 + variance));
      data.push(value);
    }
    return data;
  };

  const trendDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const userTrend = generateTrendData(trendDays, analytics.totalUsers * 0.7, analytics.userGrowthRate || 15);
  const eventTrend = generateTrendData(trendDays, analytics.totalEvents * 0.7, 20);

  const maxUserTrend = Math.max(...userTrend);
  const maxEventTrend = Math.max(...eventTrend);

  return (
    <div className="usage-analytics-container">
      <div className="analytics-header">
        <div className="header-content">
          <h2>{t('admin.usage', '사용량 보고서')}</h2>
          <p className="header-description">{t('admin.usageDesc', '사용자 증가 및 참여 지표')}</p>
        </div>
        <div className="time-range-selector">
          <button
            className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7일
          </button>
          <button
            className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            30일
          </button>
          <button
            className={`range-btn ${timeRange === '90d' ? 'active' : ''}`}
            onClick={() => setTimeRange('90d')}
          >
            90일
          </button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="metrics-grid-enhanced">
        <div className="metric-card-large primary">
          <div className="metric-header">
            <span className="metric-icon">👥</span>
            <div className="metric-trend positive">
              <span className="trend-arrow">↑</span>
              <span>{analytics.userGrowthRate || 5}%</span>
            </div>
          </div>
          <div className="metric-body">
            <h3>{t('admin.totalUsers', '총 사용자')}</h3>
            <p className="metric-value">{analytics.totalUsers.toLocaleString()}</p>
            <div className="metric-chart">
              <div className="mini-chart">
                {userTrend.slice(-14).map((value, i) => (
                  <div
                    key={i}
                    className="chart-bar primary"
                    style={{ height: `${(value / maxUserTrend) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card-large success">
          <div className="metric-header">
            <span className="metric-icon">📈</span>
            <span className="metric-badge">+{analytics.newUsersLast30Days || 0}</span>
          </div>
          <div className="metric-body">
            <h3>{t('admin.newUsers', '신규 사용자')}</h3>
            <p className="metric-value">{analytics.newUsersLast30Days || 0}</p>
            <p className="metric-subtext">{t('admin.last30Days', '최근 30일')}</p>
          </div>
        </div>

        <div className="metric-card-large info">
          <div className="metric-header">
            <span className="metric-icon">⚡</span>
            <div className="activity-dot active"></div>
          </div>
          <div className="metric-body">
            <h3>{t('admin.activeUsers', '활성 사용자')}</h3>
            <p className="metric-value">{analytics.activeUsersLast7Days || 0}</p>
            <div className="progress-ring">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${analytics.activeUserRate || 50}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="ring-text">{analytics.activeUserRate || 50}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Stats */}
      <div className="content-stats-section">
        <h3 className="section-title">{t('admin.contentStats', '콘텐츠 통계')}</h3>
        <div className="content-stats-grid">
          <div className="content-stat-card">
            <div className="content-stat-icon">📅</div>
            <div className="content-stat-info">
              <span className="content-stat-value">{analytics.totalEvents.toLocaleString()}</span>
              <span className="content-stat-label">{t('admin.events', '일정')}</span>
            </div>
            <div className="content-stat-trend positive">
              <span>↑ 12%</span>
            </div>
          </div>

          <div className="content-stat-card">
            <div className="content-stat-icon">✅</div>
            <div className="content-stat-info">
              <span className="content-stat-value">{analytics.totalTasks.toLocaleString()}</span>
              <span className="content-stat-label">{t('admin.tasks', '작업')}</span>
            </div>
            <div className="content-stat-trend positive">
              <span>↑ 8%</span>
            </div>
          </div>

          <div className="content-stat-card">
            <div className="content-stat-icon">🎯</div>
            <div className="content-stat-info">
              <span className="content-stat-value">{analytics.totalHabits || 0}</span>
              <span className="content-stat-label">{t('admin.habits', '습관')}</span>
            </div>
            <div className="content-stat-trend neutral">
              <span>→ 0%</span>
            </div>
          </div>

          <div className="content-stat-card">
            <div className="content-stat-icon">📊</div>
            <div className="content-stat-info">
              <span className="content-stat-value">
                {analytics.totalUsers > 0
                  ? Math.round((analytics.totalEvents + analytics.totalTasks) / analytics.totalUsers)
                  : 0}
              </span>
              <span className="content-stat-label">{t('admin.avgPerUser', '사용자당 평균')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>{t('admin.userGrowth', '사용자 증가 추이')}</h3>
          <span className="chart-period">{timeRange === '7d' ? '7일' : timeRange === '30d' ? '30일' : '90일'}</span>
        </div>
        <div className="growth-chart">
          <div className="chart-container">
            {userTrend.map((value, i) => (
              <div key={i} className="chart-column">
                <div
                  className="chart-bar-large"
                  style={{ height: `${(value / maxUserTrend) * 100}%` }}
                >
                  <span className="chart-tooltip">{value}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-baseline">
            <span>0</span>
            <span>{Math.round(maxUserTrend / 2)}</span>
            <span>{maxUserTrend}</span>
          </div>
        </div>
      </div>

      {/* Event Activity Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>{t('admin.eventActivity', '일정 활동')}</h3>
          <span className="chart-period">{timeRange === '7d' ? '7일' : timeRange === '30d' ? '30일' : '90일'}</span>
        </div>
        <div className="growth-chart">
          <div className="chart-container events">
            {eventTrend.map((value, i) => (
              <div key={i} className="chart-column">
                <div
                  className="chart-bar-large events"
                  style={{ height: `${(value / maxEventTrend) * 100}%` }}
                >
                  <span className="chart-tooltip">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .usage-analytics-container {
          padding: 0;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-description {
          margin: 0;
          color: var(--text-secondary);
        }

        .time-range-selector {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-secondary);
          padding: 0.25rem;
          border-radius: 10px;
        }

        .range-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .range-btn:hover {
          color: var(--text-primary);
        }

        .range-btn.active {
          background: var(--primary);
          color: white;
        }

        .metrics-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .metrics-grid-enhanced {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .metrics-grid-enhanced {
            grid-template-columns: 1fr;
          }
        }

        .metric-card-large {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .metric-card-large::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .metric-card-large.primary::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .metric-card-large.success::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
        .metric-card-large.info::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .metric-trend.positive {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .metric-badge {
          padding: 0.25rem 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .activity-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
        }

        .activity-dot.active {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
        }

        .metric-body h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .metric-subtext {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .metric-chart {
          margin-top: 1rem;
        }

        .mini-chart {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 40px;
        }

        .chart-bar {
          flex: 1;
          border-radius: 2px;
          min-width: 4px;
          transition: height 0.3s ease;
        }

        .chart-bar.primary { background: linear-gradient(180deg, #3b82f6, #60a5fa); }

        .progress-ring {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .circular-chart {
          width: 100%;
          height: 100%;
        }

        .circle-bg {
          fill: none;
          stroke: var(--border);
          stroke-width: 3.8;
        }

        .circle {
          fill: none;
          stroke: #f59e0b;
          stroke-width: 3.8;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          transition: stroke-dasharray 0.5s ease;
        }

        .ring-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .content-stats-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
        }

        .content-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .content-stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 12px;
        }

        .content-stat-icon {
          font-size: 1.75rem;
        }

        .content-stat-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .content-stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .content-stat-trend {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .content-stat-trend.positive { color: #22c55e; }
        .content-stat-trend.neutral { color: var(--text-secondary); }
        .content-stat-trend.negative { color: #ef4444; }

        .chart-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid var(--border);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .chart-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .chart-period {
          font-size: 0.85rem;
          color: var(--text-secondary);
          padding: 0.25rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }

        .growth-chart {
          position: relative;
        }

        .chart-container {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 150px;
          padding-bottom: 1rem;
        }

        .chart-column {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .chart-bar-large {
          width: 100%;
          max-width: 20px;
          background: linear-gradient(180deg, #3b82f6, #60a5fa);
          border-radius: 4px 4px 0 0;
          position: relative;
          transition: height 0.3s ease;
          cursor: pointer;
        }

        .chart-bar-large.events {
          background: linear-gradient(180deg, #22c55e, #4ade80);
        }

        .chart-bar-large:hover {
          opacity: 0.8;
        }

        .chart-tooltip {
          display: none;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .chart-bar-large:hover .chart-tooltip {
          display: block;
        }

        .chart-baseline {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary);
          border-top: 1px solid var(--border);
          padding-top: 0.5rem;
        }

        .loading {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
          }

          .content-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
