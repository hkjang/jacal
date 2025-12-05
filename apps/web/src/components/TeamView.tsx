import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamAPI } from '../lib/teamApi';

type Tab = 'events' | 'members' | 'settings';

export default function TeamView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form states
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [inviteData, setInviteData] = useState({ email: '', role: 'MEMBER' });
  const [editTeamData, setEditTeamData] = useState({ name: '', description: '' });

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
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateTeamModal(false);
      setNewTeam({ name: '', description: '' });
      setSelectedTeamId(newTeam.id);
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      teamAPI.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      alert(t('teams.updated', '팀 정보가 수정되었습니다.'));
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: teamAPI.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setSelectedTeamId(null);
      alert(t('teams.deleted', '팀이 삭제되었습니다.'));
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, email, role }: { teamId: string; email: string; role: string }) =>
      teamAPI.addMember(teamId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'MEMBER' });
      alert(t('teams.invited', '멤버를 초대했습니다.'));
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to invite member');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamAPI.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      alert(t('teams.memberRemoved', '멤버가 제외되었습니다.'));
    },
  });

  const selectedTeam = teams?.find((t) => t.id === selectedTeamId);
  const canManage = true; // Simplified for now, backend checks permissions

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
              onClick={() => {
                setSelectedTeamId(team.id);
                setEditTeamData({ name: team.name, description: team.description || '' });
                setActiveTab('events');
              }}
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
                <p className="team-description">{selectedTeam.description}</p>
              </div>
              <div className="team-actions">
                <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
                  {t('teams.inviteMember', '멤버 초대')}
                </button>
              </div>
            </div>

            <div className="team-tabs">
              <button
                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                {t('teams.events', '일정')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                {t('teams.members', '멤버')} ({selectedTeam.members.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                {t('teams.settings', '설정')}
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'events' && (
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
                    <div className="empty-state">
                      <p>{t('teams.noEvents', '예정된 일정이 없습니다.')}</p>
                      <p className="sub-text">{t('teams.createEventHint', '캘린더에서 팀 일정을 추가해보세요.')}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'members' && (
                <div className="members-list">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="member-row">
                      <div className="member-info">
                        <div className="member-avatar">{member.user.name[0]}</div>
                        <div>
                          <div className="member-name">{member.user.name}</div>
                          <div className="member-email">{member.user.email}</div>
                        </div>
                      </div>
                      <div className="member-role-badge">{member.role}</div>
                      {canManage && member.role !== 'OWNER' && (
                        <button
                          onClick={() => {
                            if (confirm(t('teams.confirmRemoveMember', '이 멤버를 제외하시겠습니까?'))) {
                              removeMemberMutation.mutate({ teamId: selectedTeam.id, userId: member.user.id });
                            }
                          }}
                          className="btn btn-sm btn-danger-text"
                        >
                          {t('common.remove', '제외')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="team-settings">
                  <div className="settings-section">
                    <h3>{t('teams.editTeam', '팀 정보 수정')}</h3>
                    <div className="form-group">
                      <label>{t('common.name', '이름')}</label>
                      <input
                        type="text"
                        value={editTeamData.name}
                        onChange={(e) => setEditTeamData({ ...editTeamData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('common.description', '설명')}</label>
                      <textarea
                        value={editTeamData.description}
                        onChange={(e) => setEditTeamData({ ...editTeamData, description: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={() => updateTeamMutation.mutate({ id: selectedTeam.id, data: editTeamData })}
                      className="btn btn-primary"
                    >
                      {t('common.save', '저장')}
                    </button>
                  </div>

                  <div className="settings-section danger-zone">
                    <h3>{t('teams.dangerZone', '위험 구역')}</h3>
                    <p>{t('teams.deleteWarning', '팀을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.')}</p>
                    <button
                      onClick={() => {
                        if (confirm(t('teams.confirmDelete', '정말로 이 팀을 삭제하시겠습니까?'))) {
                          deleteTeamMutation.mutate(selectedTeam.id);
                        }
                      }}
                      className="btn btn-danger"
                    >
                      {t('teams.deleteTeam', '팀 삭제')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-selection">
            <div className="empty-content">
              <h3>{t('teams.welcome', '팀 협업을 시작하세요')}</h3>
              <p>{t('teams.selectTeam', '팀을 선택하거나 새로운 팀을 만들어보세요.')}</p>
              <button onClick={() => setShowCreateTeamModal(true)} className="btn btn-primary btn-lg">
                {t('teams.createTeam', '새 팀 만들기')}
              </button>
            </div>
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
                autoFocus
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
              <button onClick={() => setShowCreateTeamModal(false)} className="btn btn-secondary">
                {t('common.cancel', '취소')}
              </button>
              <button
                onClick={() => createTeamMutation.mutate(newTeam)}
                className="btn btn-primary"
                disabled={!newTeam.name}
              >
                {t('common.create', '생성')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('teams.inviteMember', '멤버 초대')}</h2>
            <div className="form-group">
              <label>{t('common.email', '이메일')}</label>
              <input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="user@example.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>{t('teams.role', '권한')}</label>
              <select
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowInviteModal(false)} className="btn btn-secondary">
                {t('common.cancel', '취소')}
              </button>
              <button
                onClick={() =>
                  addMemberMutation.mutate({
                    teamId: selectedTeam.id,
                    email: inviteData.email,
                    role: inviteData.role,
                  })
                }
                className="btn btn-primary"
                disabled={!inviteData.email}
              >
                {t('common.invite', '초대')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .team-view {
          display: flex;
          height: 100%;
          background: var(--bg-primary);
        }

        .team-sidebar {
          width: 280px;
          border-right: 1px solid var(--border-color);
          padding: 1.5rem;
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .sidebar-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .team-list {
          list-style: none;
          padding: 0;
          margin: 0;
          overflow-y: auto;
        }

        .team-item {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 0.25rem;
          transition: all 0.2s;
        }

        .team-item:hover {
          background: var(--bg-tertiary);
        }

        .team-item.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .team-name {
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .team-meta {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .team-content {
          flex: 1;
          padding: 2rem 3rem;
          overflow-y: auto;
          background: var(--bg-primary);
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .team-header h1 {
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
        }

        .team-description {
          color: var(--text-secondary);
          margin: 0;
        }

        .team-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 2rem;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          color: var(--text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
          font-weight: 500;
        }

        .event-card {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          gap: 1.5rem;
          border: 1px solid var(--border-color);
        }

        .event-date {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--primary);
          min-width: 100px;
          text-align: center;
          padding-right: 1.5rem;
          border-right: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .member-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          background: white;
        }
        
        .member-row:last-child {
          border-bottom: none;
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 1rem;
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
          font-size: 1.2rem;
        }

        .member-name {
          font-weight: 600;
        }

        .member-email {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .member-role-badge {
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .settings-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          margin-bottom: 2rem;
        }

        .settings-section h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .danger-zone {
          border-color: #ffcccc;
          background: #fff5f5;
        }

        .danger-zone h3 {
          color: #dc3545;
          border-bottom-color: #ffcccc;
        }

        .empty-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
        }

        .empty-content {
          text-align: center;
        }

        .empty-content h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .empty-content p {
          margin-bottom: 2rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .modal-content {
          background: var(--color-surface, white);
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
        }
        
        .btn-danger:hover {
          background: #c82333;
        }

        .btn-danger-text {
          color: #dc3545;
          background: none;
          border: 1px solid #dc3545;
        }

        .btn-danger-text:hover {
          background: #dc3545;
          color: white;
        }
      `}</style>
    </div>
  );
}
