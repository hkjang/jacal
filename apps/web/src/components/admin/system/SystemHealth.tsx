import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function SystemHealth() {
  const { t } = useTranslation();

  const { data: health, isLoading } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: adminAPI.getHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading || !health) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isDatabaseHealthy = health.database === 'healthy';

  return (
    <div className="admin-section">
      <h2>{t('admin.health', '상태 모니터')}</h2>
      <p className="section-description">System health and service status monitoring</p>

      <div className="health-grid">
        <div className={`health-card ${isDatabaseHealthy ? 'healthy' : 'unhealthy'}`}>
          <div className="health-icon">{isDatabaseHealthy ? '✅' : '❌'}</div>
          <h3>Database</h3>
          <p className="health-status">{health.database}</p>
        </div>

        <div className="health-card healthy">
          <div className="health-icon">⏱️</div>
          <h3>API Uptime</h3>
          <p className="health-status">{formatUptime(health.uptime)}</p>
        </div>

        <div className="health-card healthy">
          <div className="health-icon">🧠</div>
          <h3>Memory (Heap)</h3>
          <p className="health-status">
            {formatBytes(health.memory.heapUsed)} / {formatBytes(health.memory.heapTotal)}
          </p>
        </div>

        <div className="health-card healthy">
          <div className="health-icon">💾</div>
          <h3>External Memory</h3>
          <p className="health-status">{formatBytes(health.memory.external)}</p>
        </div>
      </div>

      <div className="health-details">
        <h3>System Details</h3>
        <table>
          <tbody>
            <tr>
              <td><strong>RSS (Resident Set Size):</strong></td>
              <td>{formatBytes(health.memory.rss)}</td>
            </tr>
            <tr>
              <td><strong>Array Buffers:</strong></td>
              <td>{formatBytes(health.memory.arrayBuffers)}</td>
            </tr>
            <tr>
              <td><strong>Last Check:</strong></td>
              <td>{new Date(health.timestamp).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
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

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .health-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          border: 2px solid transparent;
        }

        .health-card.healthy {
          border-color: var(--success);
        }

        .health-card.unhealthy {
          border-color: var(--danger);
        }

        .health-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .health-card h3 {
          margin: 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .health-status {
          font-size: 1.2rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: var(--primary);
        }

        .health-details {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
        }

        .health-details h3 {
          margin: 0 0 1rem 0;
        }

        .health-details table {
          width: 100%;
        }

        .health-details td {
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
