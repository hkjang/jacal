import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function TeamsAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [search, setSearch] = useState('');

  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin', 'teams'],
    queryFn: adminAPI.getAllTeams,
  });

  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers({ limit: 1000 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; ownerId: string }) =>
      adminAPI.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminAPI.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
      setShowEditModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminAPI.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: string; userId: string; role?: string }) =>
      adminAPI.addTeamMember(teamId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
      setShowMemberModal(false);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      adminAPI.removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
    },
  });

  const filteredTeams = teams?.filter((team: any) =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <div>
          <h2>{t('admin.teams', '팀 관리')}</h2>
          <p className="section-description">Manage all teams in the system</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder={t('common.search', '검색...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            + {t('teams.createTeam', '새 팀 만들기')}
          </button>
        </div>
      </div>

      <div className="teams-grid">
        {filteredTeams.map((team: any) => (
          <div key={team.id} className="team-card">
            <div className="card-header">
              <h3>{team.name}</h3>
              <div className="card-actions">
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowEditModal(true);
                  }}
                  className="btn-icon"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete team "${team.name}"?`)) {
                      deleteMutation.mutate(team.id);
                    }
                  }}
                  className="btn-icon"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <p className="team-description">{team.description || 'No description'}</p>

            <div className="team-stats">
              <div className="stat">
                <span className="stat-label">Members</span>
                <span className="stat-value">{team.members.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Events</span>
                <span className="stat-value">{team._count.events}</span>
              </div>
            </div>

            <div className="members-section">
              <div className="section-title">
                <strong>Members</strong>
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowMemberModal(true);
                  }}
                  className="btn-sm btn-secondary"
                >
                  + Add
                </button>
              </div>

              {team.members.slice(0, 5).map((member: any) => (
                <div key={member.userId} className="member-row">
                  <div>
                    <div>{member.user.name}</div>
                    <div className="member-email">{member.user.email}</div>
                  </div>
                  <div className="member-actions">
                    <span className="role-badge">{member.role}</span>
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${member.user.name}?`)) {
                            removeMemberMutation.mutate({ teamId: team.id, userId: member.user.id });
                          }
                        }}
                        className="btn-icon-sm"
                        title="Remove"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {team.members.length > 5 && (
                <div className="more-members">+ {team.members.length - 5} more</div>
              )}
            </div>

            <div className="team-footer">
              <small>Created: {new Date(team.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="empty-state">
          <p>{search ? 'No teams found' : t('common.noData', '데이터가 없습니다.')}</p>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Team</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  ownerId: formData.get('ownerId') as string,
                });
              }}
            >
              <div className="form-group">
                <label>Team Name *</label>
                <input name="name" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" />
              </div>
              <div className="form-group">
                <label>Owner *</label>
                <select name="ownerId" required>
                  <option value="">Select owner...</option>
                  {users?.data?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Team</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: selectedTeam.id,
                  data: {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                  },
                });
              }}
            >
              <div className="form-group">
                <label>Team Name *</label>
                <input name="name" defaultValue={selectedTeam.name} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" defaultValue={selectedTeam.description || ''} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Member to {selectedTeam.name}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addMemberMutation.mutate({
                  teamId: selectedTeam.id,
                  userId: formData.get('userId') as string,
                  role: formData.get('role') as string,
                });
              }}
            >
              <div className="form-group">
                <label>User *</label>
                <select name="userId" required>
                  <option value="">Select user...</option>
                  {users?.data?.filter((user: any) => 
                    !selectedTeam.members.some((m: any) => m.user.id === user.id)
                  ).map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" defaultValue="MEMBER">
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowMemberModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

