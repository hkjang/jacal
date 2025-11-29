import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function BackupManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: backupsData, isLoading } = useQuery({
    queryKey: ['admin', 'backups', page, limit],
    queryFn: () => adminAPI.getBackups({ page, limit }),
  });

  const createBackupMutation = useMutation({
    mutationFn: adminAPI.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      alert(t('admin.backupCreated', '백업이 생성되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.backupFailed', '백업 생성 실패: ') + error.response?.data?.error);
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: adminAPI.deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      alert(t('admin.backupDeleted', '백업이 삭제되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.response?.data?.error);
    },
  });

  const handleBackupNow = () => {
    if (confirm(t('admin.confirmBackup', '지금 백업을 생성하시겠습니까?'))) {
      createBackupMutation.mutate();
    }
  };

  const handleDeleteBackup = (id: string) => {
    if (confirm(t('admin.confirmDelete', '정말 삭제하시겠습니까?'))) {
      deleteBackupMutation.mutate(id);
    }
  };

  const lastBackup = backupsData?.data?.[0]?.createdAt 
    ? new Date(backupsData.data[0].createdAt) 
    : null;

  return (
    <div className="admin-section">
      <h2>{t('admin.backups', '백업 관리')}</h2>
      <p className="section-description">Database backup management and restoration</p>

      <div className="backup-info">
        <div className="info-card">
          <div className="info-icon">💾</div>
          <div className="info-content">
            <h3>Last Backup</h3>
            <p className="info-value">{lastBackup ? lastBackup.toLocaleString() : 'None'}</p>
            <p className="info-subtext">
              {lastBackup 
                ? `${Math.floor((Date.now() - lastBackup.getTime()) / 60000)} minutes ago`
                : 'No backups yet'}
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🔄</div>
          <div className="info-content">
            <h3>Backup Schedule</h3>
            <p className="info-value">Manual</p>
            <p className="info-subtext">Triggered by admin</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📦</div>
          <div className="info-content">
            <h3>Total Backups</h3>
            <p className="info-value">{backupsData?.meta?.total || 0}</p>
            <p className="info-subtext">Stored in database</p>
          </div>
        </div>
      </div>

      <div className="backup-actions">
        <button 
          className="backup-button" 
          onClick={handleBackupNow}
          disabled={createBackupMutation.isPending}
        >
          {createBackupMutation.isPending ? '⏳ Creating...' : '🔄 Create Backup Now'}
        </button>
      </div>

      <div className="backup-history">
        <h3>Backup History</h3>
        {isLoading ? (
          <div className="loading">{t('common.loading', '로딩 중...')}</div>
        ) : (
          <>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupsData?.data?.map((backup: any) => (
                  <tr key={backup.id}>
                    <td>{new Date(backup.createdAt).toLocaleString()}</td>
                    <td>{(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                    <td>
                      <span className={`status-badge ${backup.status}`}>
                        {backup.status === 'success' ? '✅ Success' : '❌ Failed'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn">⬇️ Download</button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={deleteBackupMutation.isPending}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(!backupsData?.data || backupsData.data.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      {t('common.noData', '데이터가 없습니다.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {backupsData?.meta && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-sm btn-secondary"
                >
                  {t('common.prev', '이전')}
                </button>
                <span>
                  {page} / {backupsData.meta.totalPages || 1}
                </span>
                <button
                  disabled={page >= backupsData.meta.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-sm btn-secondary"
                >
                  {t('common.next', '다음')}
                </button>
              </div>
            )}
          </>
        )}
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

        .backup-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .info-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          gap: 1rem;
        }

        .info-icon {
          font-size: 2.5rem;
        }

        .info-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .info-value {
          font-size: 1.3rem;
          font-weight: bold;
          margin: 0 0 0.25rem 0;
          color: var(--primary);
        }

        .info-subtext {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .backup-actions {
          margin-bottom: 2rem;
        }

        .backup-button {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
        }

        .backup-button:hover {
          opacity: 0.9;
        }
        
        .backup-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .backup-history {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .backup-history h3 {
          margin: 0 0 1rem 0;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
        }

        .history-table th,
        .history-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .history-table th {
          background: rgba(0, 0, 0, 0.2);
          font-weight: 600;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .status-badge.success {
          background: var(--success-bg);
          color: var(--success);
        }

        .action-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          margin-right: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .action-btn:hover {
          background: var(--bg-tertiary);
        }
        
        .delete-btn {
          color: var(--danger);
          border-color: var(--danger);
        }
        
        .delete-btn:hover {
          background: var(--danger-bg);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .text-center {
          text-align: center;
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
