import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function PerformanceMetrics() {
  const { t } = useTranslation();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'performance'],
    queryFn: adminAPI.getPerformanceMetrics,
    refetchInterval: 15000,
  });

  if (isLoading || !metrics) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { days, hours, minutes };
  };

  const formatMemory = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const uptime = formatUptime(metrics.uptime);
  const heapUsedPercent = Math.round((metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100);

  // Status indicators
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value < thresholds.good) return '#22c55e';
    if (value < thresholds.warning) return '#f59e0b';
    return '#ef4444';
  };

  const responseTimeColor = getStatusColor(parseInt(metrics.avgResponseTime) || 50, { good: 100, warning: 300 });
  const errorRateNum = parseFloat(metrics.errorRate) || 0;
  const errorRateColor = getStatusColor(errorRateNum, { good: 1, warning: 5 });
  const memoryColor = getStatusColor(heapUsedPercent, { good: 60, warning: 80 });

  return (
    <div className="performance-container">
      <div className="performance-header">
        <div className="header-content">
          <h2>{t('admin.performance', '성능 메트릭')}</h2>
          <p className="header-description">{t('admin.performanceDesc', 'API 및 시스템 성능 모니터링')}</p>
        </div>
        <div className="refresh-indicator">
          <span className="refresh-dot"></span>
          <span className="refresh-text">{t('admin.autoRefresh', '15초마다 새로고침')}</span>
        </div>
      </div>

      {/* Status Overview */}
      <div className="status-overview">
        <div className="status-card">
          <div className="status-icon-wrapper" style={{ background: responseTimeColor }}>
            🚀
          </div>
          <div className="status-info">
            <span className="status-label">{t('admin.responseTime', '응답 시간')}</span>
            <span className="status-value">{metrics.avgResponseTime}</span>
            <span className="status-detail">{t('admin.average', '평균')}</span>
          </div>
          <div className="status-gauge">
            <div className="gauge-track">
              <div
                className="gauge-fill"
                style={{
                  width: `${Math.min((parseInt(metrics.avgResponseTime) || 50) / 5, 100)}%`,
                  background: responseTimeColor
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon-wrapper" style={{ background: '#3b82f6' }}>
            📊
          </div>
          <div className="status-info">
            <span className="status-label">{t('admin.throughput', '처리량')}</span>
            <span className="status-value">{metrics.requestsPerMinute}</span>
            <span className="status-detail">{t('admin.reqPerMin', '요청/분')}</span>
          </div>
          <div className="status-badge active">{t('admin.normal', '정상')}</div>
        </div>

        <div className="status-card">
          <div className="status-icon-wrapper" style={{ background: errorRateColor }}>
            ❌
          </div>
          <div className="status-info">
            <span className="status-label">{t('admin.errorRate', '에러율')}</span>
            <span className="status-value">{metrics.errorRate}</span>
            <span className="status-detail">{t('admin.ofRequests', '요청 대비')}</span>
          </div>
          <div className={`status-badge ${errorRateNum < 1 ? 'success' : errorRateNum < 5 ? 'warning' : 'error'}`}>
            {errorRateNum < 1 ? t('admin.healthy', '건강') : errorRateNum < 5 ? t('admin.attention', '주의') : t('admin.critical', '심각')}
          </div>
        </div>
      </div>

      {/* Uptime Card */}
      <div className="uptime-section">
        <h3 className="section-title">{t('admin.uptime', '가동 시간')}</h3>
        <div className="uptime-display">
          <div className="uptime-unit">
            <span className="uptime-value">{uptime.days}</span>
            <span className="uptime-label">{t('admin.days', '일')}</span>
          </div>
          <span className="uptime-separator">:</span>
          <div className="uptime-unit">
            <span className="uptime-value">{uptime.hours}</span>
            <span className="uptime-label">{t('admin.hours', '시간')}</span>
          </div>
          <span className="uptime-separator">:</span>
          <div className="uptime-unit">
            <span className="uptime-value">{uptime.minutes}</span>
            <span className="uptime-label">{t('admin.minutes', '분')}</span>
          </div>
        </div>
        <div className="uptime-bar">
          <div className="uptime-bar-fill"></div>
        </div>
        <p className="uptime-since">{t('admin.sinceLast', '마지막 재시작 이후')}</p>
      </div>

      {/* Memory Usage */}
      <div className="memory-section">
        <h3 className="section-title">{t('admin.memoryUsage', '메모리 사용량')}</h3>
        <div className="memory-overview">
          <div className="memory-gauge-container">
            <svg viewBox="0 0 100 60" className="memory-gauge">
              <defs>
                <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                className="gauge-bg"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                className="gauge-value"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="url(#memoryGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${heapUsedPercent * 1.26} 126`}
              />
            </svg>
            <div className="gauge-center">
              <span className="gauge-percent">{heapUsedPercent}%</span>
              <span className="gauge-label">{t('admin.used', '사용')}</span>
            </div>
          </div>
        </div>

        <div className="memory-details-grid">
          <div className="memory-detail-item">
            <div className="detail-header">
              <span className="detail-icon">📦</span>
              <span className="detail-label">{t('admin.heapUsed', 'Heap 사용')}</span>
            </div>
            <div className="detail-value-row">
              <span className="detail-value">{formatMemory(metrics.memoryUsage.heapUsed)} MB</span>
              <span className="detail-sub">/ {formatMemory(metrics.memoryUsage.heapTotal)} MB</span>
            </div>
            <div className="detail-bar">
              <div className="detail-bar-fill" style={{ width: `${heapUsedPercent}%`, background: memoryColor }}></div>
            </div>
          </div>

          <div className="memory-detail-item">
            <div className="detail-header">
              <span className="detail-icon">💾</span>
              <span className="detail-label">{t('admin.rss', 'RSS')}</span>
            </div>
            <div className="detail-value-row">
              <span className="detail-value">{formatMemory(metrics.memoryUsage.rss)} MB</span>
            </div>
            <p className="detail-desc">{t('admin.rssDesc', 'Resident Set Size')}</p>
          </div>

          <div className="memory-detail-item">
            <div className="detail-header">
              <span className="detail-icon">🔗</span>
              <span className="detail-label">{t('admin.external', '외부')}</span>
            </div>
            <div className="detail-value-row">
              <span className="detail-value">{formatMemory(metrics.memoryUsage.external)} MB</span>
            </div>
            <p className="detail-desc">{t('admin.externalDesc', 'C++ 바인딩 메모리')}</p>
          </div>

          <div className="memory-detail-item">
            <div className="detail-header">
              <span className="detail-icon">📊</span>
              <span className="detail-label">{t('admin.arrayBuffers', 'Array Buffers')}</span>
            </div>
            <div className="detail-value-row">
              <span className="detail-value">{formatMemory(metrics.memoryUsage.arrayBuffers)} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="performance-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>{t('admin.note', '안내')}</strong>
          <p>{t('admin.performanceNote', '응답 시간과 에러율은 예시 값입니다. 실제 프로덕션 모니터링을 위해 New Relic, Datadog 등의 APM 도구를 통합하세요.')}</p>
        </div>
      </div>

      <style>{`
        .performance-container {
          padding: 0;
        }

        .performance-header {
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

        .refresh-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border-radius: 20px;
        }

        .refresh-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        .refresh-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .status-overview {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .status-overview {
            grid-template-columns: 1fr;
          }
        }

        .status-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border);
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .status-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .status-info {
          flex: 1;
          min-width: 120px;
          display: flex;
          flex-direction: column;
        }

        .status-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .status-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .status-detail {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .status-gauge {
          width: 100%;
        }

        .gauge-track {
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
        }

        .gauge-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .status-badge.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .status-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .uptime-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
          text-align: center;
        }

        .uptime-display {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .uptime-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .uptime-value {
          font-size: 3rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .uptime-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .uptime-separator {
          font-size: 2rem;
          font-weight: 300;
          color: var(--text-secondary);
          margin-top: -1rem;
        }

        .uptime-bar {
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .uptime-bar-fill {
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, #22c55e, #4ade80);
          border-radius: 4px;
        }

        .uptime-since {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .memory-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
        }

        .memory-overview {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .memory-gauge-container {
          position: relative;
          width: 200px;
          height: 120px;
        }

        .memory-gauge {
          width: 100%;
          height: 100%;
        }

        .gauge-bg {
          stroke: var(--border);
        }

        .gauge-value {
          transition: stroke-dasharray 0.5s ease;
        }

        .gauge-center {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .gauge-percent {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .gauge-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .memory-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .memory-detail-item {
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 1rem;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .detail-icon {
          font-size: 1.25rem;
        }

        .detail-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .detail-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .detail-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .detail-sub {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .detail-bar {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }

        .detail-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .detail-desc {
          margin: 0.5rem 0 0 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .performance-note {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(245, 158, 11, 0.1);
          border-left: 4px solid #f59e0b;
          border-radius: 8px;
        }

        .performance-note .note-icon {
          font-size: 1.5rem;
        }

        .performance-note .note-content {
          flex: 1;
        }

        .performance-note .note-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .performance-note .note-content p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .loading {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .uptime-value {
            font-size: 2rem;
          }

          .memory-details-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
