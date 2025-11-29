import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function ServerLogs() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin', 'logs', page, limit, search, level],
    queryFn: () => adminAPI.getLogs({ page, limit, search, level }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'var(--danger)';
      case 'warn': return 'var(--warning)';
      case 'info': return 'var(--primary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.logs', '서버 로그')}</h2>
          <p className="section-description">Recent server logs and events</p>
        </div>
        <div className="header-actions">
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('admin.allLevels', '모든 레벨')}</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </select>
          <input
            type="text"
            placeholder={t('common.search', '검색...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="logs-container">
        {isLoading ? (
          <div className="loading">{t('common.loading', '로딩 중...')}</div>
        ) : (
          <>
            {logsData?.data?.map((log: any, index: number) => (
              <div key={index} className="log-entry">
                <span className="log-timestamp">{new Date(log.timestamp).toLocaleString()}</span>
                <span 
                  className="log-level" 
                  style={{ color: getLevelColor(log.level) }}
                >
                  [{log.level.toUpperCase()}]
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            
            {(!logsData?.data || logsData.data.length === 0) && (
              <div className="empty-state">
                <p>{t('common.noData', '데이터가 없습니다.')}</p>
              </div>
            )}
          </>
        )}
      </div>

      {logsData?.meta && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.prev', '이전')}
          </button>
          <span>
            {page} / {logsData.meta.totalPages || 1}
          </span>
          <button
            disabled={page >= logsData.meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.next', '다음')}
          </button>
        </div>
      )}

      <div className="logs-note">
        <p>💡 <strong>Note:</strong> This is a placeholder implementation. In production, integrate with a proper logging service like Winston, Morgan, or a cloud logging solution.</p>
      </div>

      <style>{`
        .admin-section {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .search-input, .filter-select {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .section-description {
          color: var(--text-secondary);
          margin: 0;
        }

        .logs-container {
          background: var(--bg-tertiary);
          border-radius: 8px;
          padding: 1rem;
          min-height: 300px;
          max-height: 600px;
          overflow-y: auto;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .log-entry {
          padding: 0.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 1rem;
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .log-timestamp {
          color: var(--text-secondary);
          min-width: 180px;
        }

        .log-level {
          font-weight: bold;
          min-width: 60px;
        }

        .log-message {
          flex: 1;
          color: var(--text-primary);
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .logs-note {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(255, 165, 0, 0.1);
          border-left: 4px solid var(--warning);
          border-radius: 4px;
        }

        .logs-note p {
          margin: 0;
          color: var(--text-secondary);
        }

        .loading {
          padding: 2rem;
          text-align: center;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }
        
        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
