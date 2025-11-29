import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function TeamsAdmin() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['admin', 'teams', page, limit, search],
    queryFn: () => adminAPI.getTeams({ page, limit, search }),
  });

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.teams', '팀')}</h2>
          <p className="section-description">All teams in the system</p>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder={t('common.search', '검색...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="teams-grid">
        {teamsData?.data?.map((team: any) => (
          <div key={team.id} className="team-card">
            <h3>{team.name}</h3>
            <p className="team-description">{team.description || 'No description'}</p>
            
            <div className="team-stats">
              <div className="stat">
                <span className="stat-label">Members:</span>
                <span className="stat-value">{team.members.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Events:</span>
                <span className="stat-value">{team._count.events}</span>
              </div>
            </div>

            <div className="members-list">
              <strong>Members:</strong>
              {team.members.slice(0, 5).map((member: any) => (
                <div key={member.userId} className="member-item">
                  <span>{member.user.name}</span>
                  <span className="role-badge">{member.role}</span>
                </div>
              ))}
              {team.members.length > 5 && (
                <div className="more-members">
                  + {team.members.length - 5} more members
                </div>
              )}
            </div>

            <div className="team-footer">
              <small>Created: {new Date(team.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
        ))}
      </div>

      {(!teamsData?.data || teamsData.data.length === 0) && (
        <div className="empty-state">
          <p>{t('common.noData', '데이터가 없습니다.')}</p>
        </div>
      )}

      {teamsData?.meta && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.prev', '이전')}
          </button>
          <span>
            {page} / {teamsData.meta.totalPages || 1}
          </span>
          <button
            disabled={page >= teamsData.meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="btn btn-sm btn-secondary"
          >
            {t('common.next', '다음')}
          </button>
        </div>
      )}

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

        .section-description {
          color: var(--text-secondary);
          margin: 0;
        }

        .search-input {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          min-width: 250px;
        }

        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .team-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .team-card h3 {
          margin: 0 0 0.5rem 0;
          color: var(--primary);
        }

        .team-description {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .team-stats {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
        }

        .members-list {
          margin: 1rem 0;
        }

        .members-list strong {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .member-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .more-members {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-secondary);
          padding: 0.5rem;
        }

        .role-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          background: var(--primary-bg);
          color: var(--primary);
          font-weight: 600;
        }

        .team-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .team-footer small {
          color: var(--text-secondary);
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
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
          margin-top: 2rem;
        }
        
        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }
        
        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 4px;
        }
        
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
