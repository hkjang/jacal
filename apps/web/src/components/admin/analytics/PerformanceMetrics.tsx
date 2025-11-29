import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function PerformanceMetrics() {
  const { t } = useTranslation();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'performance'],
    queryFn: adminAPI.getPerformanceMetrics,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  if (isLoading || !metrics) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="admin-section">
      <h2>{t('admin.performance', '성능 메트릭')}</h2>
      <p className="section-description">API and system performance monitoring</p>

      <div className="perf-grid">
        <div className="perf-card">
          <h3>🚀 Response Time</h3>
          <p className="perf-value">{metrics.avgResponseTime}</p>
          <p className="perf-label">Average</p>
        </div>

        <div className="perf-card">
          <h3>📊 Throughput</h3>
          <p className="perf-value">{metrics.requestsPerMinute}</p>
          <p className="perf-label">Requests/min</p>
        </div>

        <div className="perf-card">
          <h3>❌ Error Rate</h3>
          <p className="perf-value">{metrics.errorRate}</p>
          <p className="perf-label">of requests</p>
        </div>

        <div className="perf-card">
          <h3>⏱️ Uptime</h3>
          <p className="perf-value">{formatUptime(metrics.uptime)}</p>
          <p className="perf-label">Since last restart</p>
        </div>
      </div>

      <div className="memory-section">
        <h3>Memory Usage</h3>
        <div className="memory-grid">
          <div className="memory-item">
            <span className="memory-label">Heap Used:</span>
            <span className="memory-value">{formatMemory(metrics.memoryUsage.heapUsed)}</span>
          </div>
          <div className="memory-item">
            <span className="memory-label">Heap Total:</span>
            <span className="memory-value">{formatMemory(metrics.memoryUsage.heapTotal)}</span>
          </div>
          <div className="memory-item">
            <span className="memory-label">RSS:</span>
            <span className="memory-value">{formatMemory(metrics.memoryUsage.rss)}</span>
          </div>
          <div className="memory-item">
            <span className="memory-label">External:</span>
            <span className="memory-value">{formatMemory(metrics.memoryUsage.external)}</span>
          </div>
        </div>
      </div>

      <div className="note">
        <p>💡 <strong>Note:</strong> Response time and error rate are placeholder values. Integrate APM tools like New Relic or Datadog for production monitoring.</p>
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

        .perf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .perf-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
        }

        .perf-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .perf-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: var(--primary);
        }

        .perf-label {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .memory-section {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .memory-section h3 {
          margin: 0 0 1rem 0;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .memory-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .memory-label {
          color: var(--text-secondary);
        }

        .memory-value {
          font-weight: bold;
          color: var(--primary);
        }

        .note {
          padding: 1rem;
          background: rgba(255, 165, 0, 0.1);
          border-left: 4px solid var(--warning);
          border-radius: 4px;
        }

        .note p {
          margin: 0;
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
