import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function DatabaseManager() {
  const { t } = useTranslation();

  const { data: dbInfo, isLoading } = useQuery({
    queryKey: ['admin', 'database-stats'],
    queryFn: adminAPI.getDatabaseStats,
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const tableStats = dbInfo?.tableStats || {};

  return (
    <div className="admin-section">
      <h2>{t('admin.database', '데이터베이스')}</h2>
      <p className="section-description">Database information and management</p>

      <div className="db-info-grid">
        <div className="db-card">
          <div className="db-icon">🗄️</div>
          <div className="db-info">
            <h3>Database Type</h3>
            <p className="db-value">{dbInfo.type}</p>
          </div>
        </div>

        <div className="db-card">
          <div className="db-icon">📦</div>
          <div className="db-info">
            <h3>Database Size</h3>
            <p className="db-value">{dbInfo.size}</p>
          </div>
        </div>

        <div className="db-card">
          <div className="db-icon">📊</div>
          <div className="db-info">
            <h3>Tables</h3>
            <p className="db-value">{dbInfo.tables}</p>
          </div>
        </div>

        <div className="db-card">
          <div className="db-icon">📝</div>
          <div className="db-info">
            <h3>Total Records</h3>
            <p className="db-value">{dbInfo.records.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="db-tables">
        <h3>Database Tables</h3>
        <table className="tables-list">
          <thead>
            <tr>
              <th>Table Name</th>
              <th>Records</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>User</td>
              <td>{tableStats.users ||  0}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Event</td>
              <td>{tableStats.events || 0}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Task</td>
              <td>{tableStats.tasks || 0}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Habit</td>
              <td>{tableStats.habits || 0}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Team</td>
              <td>{tableStats.teams || 0}</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>HabitLog</td>
              <td>{tableStats.habitLogs || 0}</td>
              <td>N/A</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="note">
        <p>💡 <strong>Note:</strong> For production database management, integrate tools like pgAdmin, Prisma Studio, or implement custom Prisma queries for detailed statistics.</p>
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

        .db-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .db-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          gap: 1rem;
        }

        .db-icon {
          font-size: 2.5rem;
        }

        .db-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .db-value {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
          color: var(--primary);
        }

        .db-tables {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .db-tables h3 {
          margin: 0 0 1rem 0;
        }

        .tables-list {
          width: 100%;
          border-collapse: collapse;
        }

        .tables-list th,
        .tables-list td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .tables-list th {
          background: rgba(0, 0, 0, 0.2);
          font-weight: 600;
        }

        .note {
          padding: 1rem;
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
        }

        .note p {
          margin: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
