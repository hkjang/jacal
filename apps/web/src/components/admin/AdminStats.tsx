import { useTranslation } from 'react-i18next';
import { Stats } from '../types/admin';

interface AdminStatsProps {
  stats?: Stats;
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const { t } = useTranslation();

  if (!stats) return null;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>{t('admin.totalUsers', '총 사용자')}</h3>
        <p className="stat-value">{stats.totalUsers}</p>
      </div>
      <div className="stat-card">
        <h3>{t('admin.activeUsers', '활성 사용자')}</h3>
        <p className="stat-value">{stats.activeUsers}</p>
      </div>
      <div className="stat-card">
        <h3>{t('admin.totalEvents', '총 이벤트')}</h3>
        <p className="stat-value">{stats.totalEvents}</p>
      </div>
      <div className="stat-card">
        <h3>{t('admin.totalTasks', '총 작업')}</h3>
        <p className="stat-value">{stats.totalTasks}</p>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
