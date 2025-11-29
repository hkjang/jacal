import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function AdoptionStats() {
  const { t } = useTranslation();

  const { data: adoption, isLoading } = useQuery({
    queryKey: ['admin', 'adoption'],
    queryFn: adminAPI.getAdoptionStats,
    refetchInterval: 30000,
  });

  if (isLoading || !adoption) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  const features = [
    { name: 'Calendar', icon: '📅', data: adoption.calendar, color: 'var(--primary)' },
    { name: 'Tasks', icon: '✅', data: adoption.tasks, color: 'var(--success)' },
    { name: 'Habits', icon: '🎯', data: adoption.habits, color: 'var(--warning)' },
    { name: 'Teams', icon: '👥', data: adoption.teams, color: '#9b59b6' },
  ];

  return (
    <div className="admin-section">
      <h2>{t('admin.adoption', '기능 사용률')}</h2>
      <p className="section-description">Feature adoption rates across the platform</p>

      <div className="adoption-grid">
        {features.map((feature) => (
          <div key={feature.name} className="adoption-card">
            <div className="adoption-header">
              <span className="adoption-icon">{feature.icon}</span>
              <h3>{feature.name}</h3>
            </div>
            
            <div className="adoption-stats">
              <div className="stat-row">
                <span className="stat-label">Users:</span>
                <span className="stat-value">{feature.data.users || feature.data.count || 0}</span>
              </div>
              {feature.data.adoptionRate !== undefined && (
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${feature.data.adoptionRate}%`,
                      backgroundColor: feature.color 
                    }}
                  />
                  <span className="progress-label">{feature.data.adoptionRate}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h3>Adoption Summary</h3>
        <ul>
          <li>Calendar is the most adopted feature with <strong>{adoption.calendar.adoptionRate}%</strong> of users</li>
          <li>Tasks are being used by <strong>{adoption.tasks.users}</strong> users</li>
          <li>Habit tracking has <strong>{adoption.habits.adoptionRate}%</strong> adoption</li>
          <li><strong>{adoption.teams.count}</strong> teams have been created</li>
        </ul>
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

        .adoption-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .adoption-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
        }

        .adoption-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .adoption-icon {
          font-size: 2rem;
        }

        .adoption-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .adoption-stats {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
        }

        .progress-container {
          position: relative;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          height: 32px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 8px;
        }

        .progress-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: bold;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .summary-section {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
        }

        .summary-section h3 {
          margin: 0 0 1rem 0;
        }

        .summary-section ul {
          margin: 0;
          padding-left: 1.5rem;
          color: var(--text-secondary);
        }

        .summary-section li {
          margin-bottom: 0.5rem;
        }

        .loading {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
