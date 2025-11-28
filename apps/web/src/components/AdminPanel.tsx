import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../lib/adminApi';
import { User } from '../types/admin';
import AdminStats from './admin/AdminStats';
import AdminUserList from './admin/AdminUserList';
import AdminUserEditModal from './admin/AdminUserEditModal';

export default function AdminPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminAPI.getUsers,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminAPI.getStats,
  });

  const updateUserMutation = useMutation({
    mutationFn: adminAPI.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditMode(false);
      setSelectedUser(null);
      alert(t('admin.userUpdated', '사용자가 업데이트되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.updateFailed', '업데이트 실패: ') + error.response?.data?.error);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setSelectedUser(null);
      alert(t('admin.userDeleted', '사용자가 삭제되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.response?.data?.error);
    },
  });

  const handleSaveUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      timezone: selectedUser.timezone,
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditMode(true);
  };

  if (usersLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-panel">
      <h1>{t('admin.title', '관리자 패널')}</h1>

      <AdminStats stats={stats} />

      <AdminUserList
        users={users}
        onEditUser={handleEditUser}
        deleteUserMutation={deleteUserMutation}
      />

      {editMode && selectedUser && (
        <AdminUserEditModal
          user={selectedUser}
          onSave={handleSaveUser}
          onCancel={() => setEditMode(false)}
          onChange={setSelectedUser}
          isSaving={updateUserMutation.isPending}
        />
      )}

      <style>{`
        .admin-panel {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
