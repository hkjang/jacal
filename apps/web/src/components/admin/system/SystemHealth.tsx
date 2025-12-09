import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function SystemHealth() {
  const { t } = useTranslation();

  const { data: health, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: adminAPI.getHealth,
    refetchInterval: 10000,
  });

  if (isLoading || !health) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isDatabaseHealthy = health.database === 'healthy';
  const heapUsedPercent = Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100);

  // System status calculation
  const overallStatus = isDatabaseHealthy && heapUsedPercent < 90 ? 'healthy' : heapUsedPercent < 90 ? 'warning' : 'critical';

  const services = [
    {
      id: 'api',
      name: t('admin.apiServer', 'API 서버'),
      status: 'healthy',
      icon: '🚀',
      uptime: health.uptime,
      description: t('admin.apiDesc', 'Express.js 백엔드 서버')
    },
    {
      id: 'database',
      name: t('admin.database', '데이터베이스'),
      status: isDatabaseHealthy ? 'healthy' : 'error',
      icon: '🗄️',
      description: t('admin.dbDesc', 'PostgreSQL/SQLite 연결')
    },
    {
      id: 'memory',
      name: t('admin.memory', '메모리'),
      status: heapUsedPercent < 70 ? 'healthy' : heapUsedPercent < 90 ? 'warning' : 'error',
      icon: '🧠',
      usage: heapUsedPercent,
      description: `${formatBytes(health.memory.heapUsed)} / ${formatBytes(health.memory.heapTotal)}`
    },
    {
      id: 'scheduler',
      name: t('admin.scheduler', '스케줄러'),
      status: 'healthy',
      icon: '⏰',
      description: t('admin.schedulerDesc', '알림 및 리마인더 스케줄러')
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error':
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return t('admin.healthy', '정상');
      case 'warning': return t('admin.warning', '주의');
      case 'error':
      case 'critical': return t('admin.error', '오류');
      default: return t('admin.unknown', '알 수 없음');
    }
  };

  return (
    <div className="health-container">
      <div className="health-header">
        <div className="header-content">
          <h2>{t('admin.health', '상태 모니터')}</h2>
          <p className="header-description">{t('admin.healthDesc', '시스템 상태 및 서비스 모니터링')}</p>
        </div>
        <div className="header-meta">
          <div className="last-check">
            <span className="check-label">{t('admin.lastCheck', '마지막 확인')}:</span>
            <span className="check-time">{new Date(dataUpdatedAt).toLocaleTimeString('ko-KR')}</span>
          </div>
          <div className="refresh-indicator">
            <span className="refresh-dot"></span>
            <span>{t('admin.liveMonitoring', '실시간 모니터링')}</span>
          </div>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`overall-status-banner ${overallStatus}`}>
        <div className="status-pulse-container">
          <span className={`status-pulse ${overallStatus}`}></span>
          <span className="status-icon-large">
            {overallStatus === 'healthy' ? '✅' : overallStatus === 'warning' ? '⚠️' : '❌'}
          </span>
        </div>
        <div className="status-text">
          <h3>{t('admin.systemStatus', '시스템 상태')}</h3>
          <p>
            {overallStatus === 'healthy'
              ? t('admin.allSystemsOperational', '모든 시스템이 정상 작동 중입니다')
              : overallStatus === 'warning'
                ? t('admin.someIssues', '일부 시스템에 주의가 필요합니다')
                : t('admin.criticalIssues', '심각한 문제가 감지되었습니다')}
          </p>
        </div>
        <div className="status-uptime">
          <span className="uptime-label">{t('admin.uptime', '가동 시간')}</span>
          <span className="uptime-value">{formatUptime(health.uptime)}</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-section">
        <h3 className="section-title">{t('admin.services', '서비스 상태')}</h3>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className={`service-card ${service.status}`}>
              <div className="service-header">
                <div className="service-icon-wrapper" style={{ background: getStatusColor(service.status) }}>
                  {service.icon}
                </div>
                <div className={`service-status-badge ${service.status}`}>
                  <span className="status-dot" style={{ background: getStatusColor(service.status) }}></span>
                  {getStatusText(service.status)}
                </div>
              </div>
              <div className="service-body">
                <h4>{service.name}</h4>
                <p className="service-description">{service.description}</p>
                {service.uptime && (
                  <div className="service-detail">
                    <span className="detail-label">{t('admin.uptime', '가동')}:</span>
                    <span className="detail-value">{formatUptime(service.uptime)}</span>
                  </div>
                )}
                {service.usage !== undefined && (
                  <div className="service-usage">
                    <div className="usage-bar">
                      <div
                        className="usage-fill"
                        style={{
                          width: `${service.usage}%`,
                          background: getStatusColor(service.status)
                        }}
                      ></div>
                    </div>
                    <span className="usage-text">{service.usage}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory Details */}
      <div className="memory-details-section">
        <h3 className="section-title">{t('admin.memoryDetails', '메모리 상세')}</h3>
        <div className="memory-table">
          <div className="memory-row">
            <div className="memory-row-icon">📦</div>
            <div className="memory-row-info">
              <span className="memory-row-label">{t('admin.heapUsed', 'Heap 사용')}</span>
              <span className="memory-row-value">{formatBytes(health.memory.heapUsed)}</span>
            </div>
            <div className="memory-row-bar">
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(health.memory.heapUsed / health.memory.heapTotal) * 100}%`,
                    background: heapUsedPercent < 70 ? '#22c55e' : heapUsedPercent < 90 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="memory-row">
            <div className="memory-row-icon">💾</div>
            <div className="memory-row-info">
              <span className="memory-row-label">{t('admin.heapTotal', 'Heap 전체')}</span>
              <span className="memory-row-value">{formatBytes(health.memory.heapTotal)}</span>
            </div>
          </div>

          <div className="memory-row">
            <div className="memory-row-icon">📊</div>
            <div className="memory-row-info">
              <span className="memory-row-label">{t('admin.rss', 'RSS (Resident Set Size)')}</span>
              <span className="memory-row-value">{formatBytes(health.memory.rss)}</span>
            </div>
          </div>

          <div className="memory-row">
            <div className="memory-row-icon">🔗</div>
            <div className="memory-row-info">
              <span className="memory-row-label">{t('admin.external', '외부 메모리')}</span>
              <span className="memory-row-value">{formatBytes(health.memory.external)}</span>
            </div>
          </div>

          <div className="memory-row">
            <div className="memory-row-icon">🧊</div>
            <div className="memory-row-info">
              <span className="memory-row-label">{t('admin.arrayBuffers', 'Array Buffers')}</span>
              <span className="memory-row-value">{formatBytes(health.memory.arrayBuffers)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="system-info-section">
        <h3 className="section-title">{t('admin.systemInfo', '시스템 정보')}</h3>
        <div className="system-info-grid">
          <div className="info-card">
            <span className="info-icon">🕐</span>
            <span className="info-label">{t('admin.timestamp', '타임스탬프')}</span>
            <span className="info-value">{new Date(health.timestamp).toLocaleString('ko-KR')}</span>
          </div>
          <div className="info-card">
            <span className="info-icon">🌐</span>
            <span className="info-label">{t('admin.environment', '환경')}</span>
            <span className="info-value">Production</span>
          </div>
          <div className="info-card">
            <span className="info-icon">📡</span>
            <span className="info-label">{t('admin.nodeVersion', 'Node 버전')}</span>
            <span className="info-value">v18.x</span>
          </div>
        </div>
      </div>

      <style>{`
        .health-container {
          padding: 1rem;
        }

        .health-header {
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

        .header-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .last-check {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .check-time {
          margin-left: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .refresh-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 20px;
          font-size: 0.8rem;
          color: #22c55e;
        }

        .refresh-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .overall-status-banner {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
        }

        .overall-status-banner.healthy {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .overall-status-banner.warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .overall-status-banner.critical {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-pulse-container {
          position: relative;
        }

        .status-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          animation: statusPulse 2s infinite;
        }

        .status-pulse.healthy { background: rgba(34, 197, 94, 0.3); }
        .status-pulse.warning { background: rgba(245, 158, 11, 0.3); }
        .status-pulse.critical { background: rgba(239, 68, 68, 0.3); }

        @keyframes statusPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }

        .status-icon-large {
          position: relative;
          font-size: 2.5rem;
          z-index: 1;
        }

        .status-text {
          flex: 1;
        }

        .status-text h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
        }

        .status-text p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .status-uptime {
          text-align: right;
        }

        .uptime-label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .uptime-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .services-section {
          margin-bottom: 2rem;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }

        .service-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
        }

        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .service-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .service-status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .service-status-badge.healthy { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .service-status-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .service-status-badge.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .service-body h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .service-description {
          margin: 0 0 0.75rem 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .service-detail {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .detail-label {
          color: var(--text-secondary);
        }

        .detail-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .service-usage {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .usage-bar {
          flex: 1;
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .usage-text {
          font-size: 0.85rem;
          font-weight: 600;
          min-width: 35px;
        }

        .memory-details-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
        }

        .memory-table {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .memory-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 10px;
        }

        .memory-row-icon {
          font-size: 1.25rem;
        }

        .memory-row-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .memory-row-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .memory-row-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .memory-row-bar {
          width: 200px;
        }

        .bar-track {
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .system-info-section {
          margin-bottom: 2rem;
        }

        .system-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .info-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.25rem;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border);
          text-align: center;
        }

        .info-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .info-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .loading {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .overall-status-banner {
            flex-direction: column;
            text-align: center;
          }

          .status-uptime {
            text-align: center;
          }

          .services-grid {
            grid-template-columns: 1fr;
          }

          .memory-row {
            flex-wrap: wrap;
          }

          .memory-row-bar {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
