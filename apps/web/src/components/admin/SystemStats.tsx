import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../lib/adminApi';

export default function SystemStats() {
  const { t } = useTranslation();

  const { data: systemStats, isLoading } = useQuery({
    queryKey: ['admin', 'system-stats'],
    queryFn: adminAPI.getSystemStats,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading || !systemStats) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 ** 3);
    return gb.toFixed(2) + ' GB';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const memoryUsagePercent = ((systemStats.totalMemory - systemStats.freeMemory) / systemStats.totalMemory * 100).toFixed(1);
  const cpuCount = systemStats.cpus?.length || 0;
  const avgLoad = systemStats.loadAverage?.[0]?.toFixed(2) || '0';

  return (
    <div className="admin-section">
      <h2>{t('admin.stats', '시스템 통계')}</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🖥️</div>
          <h3>System Uptime</h3>
          <p className="stat-value">{formatUptime(systemStats.uptime)}</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧠</div>
          <h3>Memory Usage</h3>
          <p className="stat-value">{memoryUsagePercent}%</p>
          <p className="stat-detail">
            {formatBytes(systemStats.totalMemory - systemStats.freeMemory)} / {formatBytes(systemStats.totalMemory)}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <h3>CPU Cores</h3>
          <p className="stat-value">{cpuCount}</p>
          <p className="stat-detail">Load: {avgLoad}</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <h3>Free Memory</h3>
          <p className="stat-value">{formatBytes(systemStats.freeMemory)}</p>
        </div>
      </div>

      <div className="system-info">
        <h3>System Information</h3>
        <table>
          <tbody>
            <tr>
              <td><strong>Platform:</strong></td>
              <td>{systemStats.platform}</td>
            </tr>
            <tr>
              <td><strong>Architecture:</strong></td>
              <td>{systemStats.arch}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-section {
          padding: 0;
          background: transparent;
        }

        .admin-section h2 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          border: 1px solid var(--border);
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .stat-card h3 {
          margin: 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: var(--primary);
        }

        .stat-detail {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .system-info {
          margin-top: 1rem;
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .system-info h3 {
          margin: 0 0 1rem 0;
        }

        .system-info table {
          width: 100%;
        }

        .system-info td {
          padding: 0.5rem;
        }

        .loading {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
