import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamAPI } from '../lib/teamApi';
import { Team, SharedEvent } from '../types/team';

export default function TeamView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  // Form states
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [newMember, setNewMember] = useState({ email: '', role: 'MEMBER' });
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
  });

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamAPI.getMyTeams,
  });

  const { data: teamEvents } = useQuery({
    queryKey: ['teamEvents', selectedTeamId],
    queryFn: () => teamAPI.getTeamEvents(selectedTeamId!),
    enabled: !!selectedTeamId,
  });

  const createTeamMutation = useMutation({
    mutationFn: teamAPI.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateTeamModal(false);
      setNewTeam({ name: '', description: '' });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, email, role }: { teamId: string; email: string; role: string }) =>
      teamAPI.addMember(teamId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowAddMemberModal(false);
      setNewMember({ email: '', role: 'MEMBER' });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: any }) =>
      teamAPI.createEvent(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamEvents', selectedTeamId] });
      setShowCreateEventModal(false);
      setNewEvent({ title: '', description: '', startAt: '', endAt: '', location: '' });
    },
  });

  const selectedTeam = teams?.find((t) => t.id === selectedTeamId);

  if (isLoadingTeams) return <div className="loading">{t('common.loading', '로딩 중...')}</div>;

  return (
    <div className="team-view">
      <div className="team-sidebar">
        <div className="sidebar-header">
          <h2>{t('teams.title', '내 팀')}</h2>
          <button onClick={() => setShowCreateTeamModal(true)} className="btn btn-sm btn-primary">
            +
          </button>
        </div>
        <ul className="team-list">
          {teams?.map((team) => (
            <li
              key={team.id}
              className={`team-item ${selectedTeamId === team.id ? 'active' : ''}`}
              onClick={() => setSelectedTeamId(team.id)}
            >
              <div className="team-name">{team.name}</div>
              <div className="team-meta">
                {team.members.length} {t('teams.members', '멤버')}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="team-content">
        {selectedTeam ? (
          <>
            <div className="team-header">
              <div>
                <h1>{selectedTeam.name}</h1>
                <p>{selectedTeam.description}</p>
              </div>
              <div className="team-actions">
                <button onClick={() => setShowAddMemberModal(true)} className="btn btn-secondary">
                  {t('teams.addMember', '멤버 초대')}
                </button>
                <button onClick={() => setShowCreateEventModal(true)} className="btn btn-primary">
                  {t('teams.createEvent', '일정 추가')}
                </button>
              </div>
            </div>

            <div className="team-members-section">
              <h3>{t('teams.members', '멤버')}</h3>
              <div className="members-grid">
                {selectedTeam.members.map((member) => (
                  <div key={member.id} className="member-card">
                    <div className="member-avatar">{member.user.name[0]}</div>
                    <div className="member-info">
                      <div className="member-name">{member.user.name}</div>
                      <div className="member-role">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="team-events-section">
              <h3>{t('teams.events', '팀 일정')}</h3>
              <div className="events-list">
                {teamEvents?.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-date">
                      {new Date(event.startAt).toLocaleDateString()}
                    </div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <p>{event.description}</p>
                      <div className="event-meta">
                        <span>📍 {event.location || 'Online'}</span>
                        <span>👤 {event.author.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {teamEvents?.length === 0 && (
                  <p className="empty-state">{t('teams.noEvents', '예정된 일정이 없습니다.')}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-selection">
            <p>{t('teams.selectTeam', '팀을 선택하거나 새로운 팀을 만들어보세요.')}</p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTeamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('teams.createTeam', '새 팀 만들기')}</h2>
            <div className="form-group">
              <label>{t('common.name', '이름')}</label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('common.description', '설명')}</label>
              <textarea
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => createTeamMutation.mutate(newTeam)}
                className="btn btn-primary"
                disabled={!newTeam.name}
              >
                {t('common.create', '생성')}
              </button>
              <button onClick={() => setShowCreateTeamModal(false)} className="btn btn-secondary">
                {t('common.cancel', '취소')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('teams.addMember', '멤버 초대')}</h2>
            <div className="form-group">
              <label>{t('common.email', '이메일')}</label>
              <input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('teams.role', '권한')}</label>
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                onClick={() =>
                  addMemberMutation.mutate({
                    teamId: selectedTeam.id,
                    email: newMember.email,
                    role: newMember.role,
                  })
                }
                className="btn btn-primary"
                disabled={!newMember.email}
              >
                {t('common.invite', '초대')}
              </button>
              <button onClick={() => setShowAddMemberModal(false)} className="btn btn-secondary">
                {t('common.cancel', '취소')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .team-view {
          display: flex;
          height: calc(100vh - 64px);
          background: var(--bg-primary);
        }

        .team-sidebar {
          width: 300px;
          border-right: 1px solid var(--border-color);
          padding: 1.5rem;
          background: var(--bg-secondary);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .team-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .team-item {
          padding: 1rem;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 0.5rem;
          transition: background 0.2s;
        }

        .team-item:hover {
          background: var(--bg-tertiary);
        }

        .team-item.active {
          background: var(--primary-light);
          border: 1px solid var(--primary);
        }

        .team-name {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .team-meta {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .team-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .team-actions {
          display: flex;
          gap: 1rem;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .member-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .member-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .event-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          gap: 1.5rem;
        }

        .event-date {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--primary);
          min-width: 100px;
        }

        .event-meta {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .empty-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
