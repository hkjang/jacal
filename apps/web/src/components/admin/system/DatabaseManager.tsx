import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function DatabaseManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newPoolSize, setNewPoolSize] = useState<number | null>(null);
  const [showRestartNotice, setShowRestartNotice] = useState(false);

  const { data: dbInfo, isLoading } = useQuery({
    queryKey: ['admin', 'database-stats'],
    queryFn: adminAPI.getDatabaseStats,
  });

  const updatePoolMutation = useMutation({
    mutationFn: (connectionLimit: number) => adminAPI.updatePoolConfig({ connectionLimit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'database-stats'] });
      setShowRestartNotice(true);
      setNewPoolSize(null);
    },
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const tableStats = dbInfo?.tableStats || {};
  const poolConfig = dbInfo?.poolConfig || { connectionLimit: 10, configuredLimit: 10 };
  const currentPoolSize = newPoolSize !== null ? newPoolSize : poolConfig.configuredLimit;

  // Calculate table statistics
  const tables = [
    { name: 'User', icon: '👤', count: tableStats.users || 0, color: '#3b82f6' },
    { name: 'Event', icon: '📅', count: tableStats.events || 0, color: '#22c55e' },
    { name: 'Task', icon: '✅', count: tableStats.tasks || 0, color: '#f59e0b' },
    { name: 'Habit', icon: '🎯', count: tableStats.habits || 0, color: '#a855f7' },
    { name: 'Team', icon: '👥', count: tableStats.teams || 0, color: '#ec4899' },
    { name: 'HabitLog', icon: '📊', count: tableStats.habitLogs || 0, color: '#06b6d4' },
    { name: 'Reminder', icon: '⏰', count: tableStats.reminders || 0, color: '#84cc16' },
    { name: 'Tag', icon: '🏷️', count: tableStats.tags || 0, color: '#f97316' },
  ];

  const totalRecords = tables.reduce((sum, t) => sum + t.count, 0);
  const maxTableCount = Math.max(...tables.map(t => t.count), 1);

  const handlePoolSizeChange = (value: number) => {
    setNewPoolSize(value);
    setShowRestartNotice(false);
  };

  const handleSavePoolConfig = () => {
    if (newPoolSize !== null) {
      updatePoolMutation.mutate(newPoolSize);
    }
  };

  return (
    <div className="database-container">
      <div className="database-header">
        <div className="header-content">
          <h2>{t('admin.database', '데이터베이스')}</h2>
          <p className="header-description">{t('admin.databaseDesc', '데이터베이스 정보 및 통계')}</p>
        </div>
      </div>

      {/* Database Overview Cards */}
      <div className="db-overview-grid">
        <div className="db-overview-card primary">
          <div className="overview-icon">🗄️</div>
          <div className="overview-content">
            <span className="overview-label">{t('admin.dbType', '데이터베이스 유형')}</span>
            <span className="overview-value">{dbInfo?.type || 'SQLite'}</span>
          </div>
        </div>

        <div className="db-overview-card success">
          <div className="overview-icon">📦</div>
          <div className="overview-content">
            <span className="overview-label">{t('admin.dbSize', '데이터베이스 크기')}</span>
            <span className="overview-value">{dbInfo?.size || 'N/A'}</span>
          </div>
        </div>

        <div className="db-overview-card info">
          <div className="overview-icon">📊</div>
          <div className="overview-content">
            <span className="overview-label">{t('admin.tables', '테이블 수')}</span>
            <span className="overview-value">{dbInfo?.tables || tables.length}</span>
          </div>
        </div>

        <div className="db-overview-card warning">
          <div className="overview-icon">📝</div>
          <div className="overview-content">
            <span className="overview-label">{t('admin.totalRecords', '총 레코드')}</span>
            <span className="overview-value">{totalRecords.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="tables-section">
        <h3 className="section-title">{t('admin.tableStats', '테이블 통계')}</h3>
        <div className="tables-grid">
          {tables.map((table) => (
            <div key={table.name} className="table-card">
              <div className="table-card-header">
                <span className="table-icon">{table.icon}</span>
                <span className="table-name">{table.name}</span>
              </div>
              <div className="table-count">{table.count.toLocaleString()}</div>
              <div className="table-bar">
                <div
                  className="table-bar-fill"
                  style={{
                    width: `${(table.count / maxTableCount) * 100}%`,
                    background: table.color
                  }}
                ></div>
              </div>
              <div className="table-percentage">
                {totalRecords > 0 ? Math.round((table.count / totalRecords) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Distribution */}
      <div className="distribution-section">
        <h3 className="section-title">{t('admin.recordDistribution', '레코드 분포')}</h3>
        <div className="distribution-chart">
          <div className="distribution-bars">
            {tables.map((table) => (
              <div key={table.name} className="distribution-item">
                <div className="dist-label">
                  <span className="dist-icon">{table.icon}</span>
                  <span className="dist-name">{table.name}</span>
                </div>
                <div className="dist-bar-container">
                  <div
                    className="dist-bar"
                    style={{
                      width: `${totalRecords > 0 ? (table.count / totalRecords) * 100 : 0}%`,
                      background: table.color
                    }}
                  ></div>
                </div>
                <span className="dist-count">{table.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection Status & Pool Configuration */}
      <div className="connection-section">
        <h3 className="section-title">{t('admin.connectionStatus', '연결 상태')}</h3>
        <div className="connection-card">
          <div className="connection-status-row">
            <div className="status-indicator">
              <span className="status-dot connected"></span>
              <span className="status-label">{t('admin.connected', '연결됨')}</span>
            </div>
            <span className="connection-info">{dbInfo?.type === 'SQLite' ? 'Local SQLite' : 'PostgreSQL'}</span>
          </div>
          <div className="connection-details">
            <div className="connection-detail">
              <span className="detail-key">{t('admin.provider', '프로바이더')}</span>
              <span className="detail-value">Prisma ORM</span>
            </div>
            <div className="connection-detail">
              <span className="detail-key">{t('admin.poolSize', '현재 풀 크기')}</span>
              <span className="detail-value">{poolConfig.connectionLimit}</span>
            </div>
          </div>
        </div>

        {/* Pool Configuration */}
        <div className="pool-config-card">
          <h4 className="pool-config-title">
            🔧 {t('admin.poolConfiguration', '풀 크기 설정')}
          </h4>
          <p className="pool-config-desc">
            {t('admin.poolConfigDesc', '데이터베이스 연결 풀의 최대 연결 수를 설정합니다. 변경 사항은 서버 재시작 후 적용됩니다.')}
          </p>

          <div className="pool-slider-container">
            <div className="pool-slider-header">
              <span className="pool-slider-label">{t('admin.connectionLimit', '연결 제한')}</span>
              <span className="pool-slider-value">{currentPoolSize}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={currentPoolSize}
              onChange={(e) => handlePoolSizeChange(parseInt(e.target.value, 10))}
              className="pool-slider"
            />
            <div className="pool-slider-range">
              <span>1</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <div className="pool-actions">
            <button
              className="pool-save-btn"
              onClick={handleSavePoolConfig}
              disabled={newPoolSize === null || updatePoolMutation.isPending}
            >
              {updatePoolMutation.isPending ? t('common.saving', '저장 중...') : t('common.save', '저장')}
            </button>
            {newPoolSize !== null && (
              <button
                className="pool-cancel-btn"
                onClick={() => setNewPoolSize(null)}
              >
                {t('common.cancel', '취소')}
              </button>
            )}
          </div>

          {showRestartNotice && (
            <div className="restart-notice">
              <span className="notice-icon">⚠️</span>
              <span>{t('admin.restartRequired', '변경 사항이 저장되었습니다. 서버를 재시작하면 새 설정이 적용됩니다.')}</span>
            </div>
          )}

          {updatePoolMutation.isError && (
            <div className="error-notice">
              <span className="notice-icon">❌</span>
              <span>{t('admin.saveError', '저장에 실패했습니다. 다시 시도해 주세요.')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="database-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>{t('admin.note', '안내')}</strong>
          <p>{t('admin.databaseNote', '프로덕션 데이터베이스 관리를 위해 pgAdmin, Prisma Studio 또는 커스텀 Prisma 쿼리를 사용하세요.')}</p>
        </div>
      </div>

      <style>{`
        .database-container {
          padding: 1rem;
        }

        .database-header {
          margin-bottom: 2rem;
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

        .db-overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .db-overview-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .db-overview-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
        }

        .db-overview-card.primary::before { background: #3b82f6; }
        .db-overview-card.success::before { background: #22c55e; }
        .db-overview-card.info::before { background: #06b6d4; }
        .db-overview-card.warning::before { background: #f59e0b; }

        .overview-icon {
          font-size: 2rem;
        }

        .overview-content {
          display: flex;
          flex-direction: column;
        }

        .overview-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .overview-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .tables-section {
          margin-bottom: 2rem;
        }

        .tables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .table-card {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
        }

        .table-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .table-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .table-icon {
          font-size: 1.25rem;
        }

        .table-name {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .table-count {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .table-bar {
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .table-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .table-percentage {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-align: right;
        }

        .distribution-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
        }

        .distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .distribution-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .dist-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 100px;
        }

        .dist-icon {
          font-size: 1rem;
        }

        .dist-name {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .dist-bar-container {
          flex: 1;
          height: 24px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          overflow: hidden;
        }

        .dist-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;
        }

        .dist-count {
          min-width: 70px;
          text-align: right;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .connection-section {
          margin-bottom: 2rem;
        }

        .connection-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }

        .connection-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.connected {
          background: #22c55e;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-label {
          font-weight: 600;
          color: #22c55e;
        }

        .connection-info {
          color: var(--text-secondary);
        }

        .connection-details {
          display: flex;
          gap: 2rem;
        }

        .connection-detail {
          display: flex;
          flex-direction: column;
        }

        .detail-key {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .detail-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .pool-config-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-left: 4px solid #3b82f6;
        }

        .pool-config-title {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .pool-config-desc {
          margin: 0 0 1.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .pool-slider-container {
          margin-bottom: 1.5rem;
        }

        .pool-slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .pool-slider-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .pool-slider-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .pool-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--border);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .pool-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          transition: transform 0.2s ease;
        }

        .pool-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .pool-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .pool-slider-range {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .pool-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .pool-save-btn {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pool-save-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .pool-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pool-cancel-btn {
          padding: 0.75rem 1.5rem;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pool-cancel-btn:hover {
          background: var(--border);
        }

        .restart-notice {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          color: #f59e0b;
          font-size: 0.9rem;
        }

        .error-notice {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.9rem;
        }

        .notice-icon {
          font-size: 1.25rem;
        }

        .database-note {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          border-radius: 8px;
        }

        .database-note .note-icon {
          font-size: 1.5rem;
        }

        .database-note .note-content {
          flex: 1;
        }

        .database-note .note-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .database-note .note-content p {
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
          .db-overview-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .tables-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .distribution-item {
            flex-wrap: wrap;
          }

          .dist-label {
            min-width: 80px;
          }

          .connection-details {
            flex-direction: column;
            gap: 1rem;
          }

          .pool-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

