import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../lib/adminApi';
import './UserSettingsModal.css';

interface UserSettingsModalProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onClose: () => void;
}

interface UserSettings {
  id?: string;
  ollamaEnabled?: boolean;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  pop3Enabled?: boolean;
  pop3Host?: string;
  pop3Port?: number;
  pop3User?: string;
  pop3Password?: string;
  pop3Tls?: boolean;
  savedLocations?: string[];
}

interface WebhookConfig {
  id?: string;
  enabled?: boolean;
  url?: string;
  columnMapping?: Record<string, string>;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  providerId: string;
  createdAt: string;
}

type TabType = 'ai' | 'email' | 'webhook' | 'integrations' | 'locations';

export default function UserSettingsModal({ user, onClose }: UserSettingsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('ai');
  const [newLocation, setNewLocation] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<UserSettings>({
    queryKey: ['admin', 'user-settings', user.id],
    queryFn: () => adminAPI.getUserSettings(user.id),
  });

  // Fetch webhook config
  const { data: webhookConfig, isLoading: webhookLoading, error: webhookError } = useQuery<WebhookConfig>({
    queryKey: ['admin', 'user-webhook', user.id],
    queryFn: () => adminAPI.getUserWebhook(user.id),
  });

  // Fetch integrations
  const { data: integrations, isLoading: integrationsLoading, error: integrationsError } = useQuery<ConnectedAccount[]>({
    queryKey: ['admin', 'user-integrations', user.id],
    queryFn: () => adminAPI.getUserIntegrations(user.id),
  });

  // Initialize locations when settings load
  if (settings?.savedLocations && !locationsLoaded) {
    setLocations(Array.isArray(settings.savedLocations) ? settings.savedLocations : []);
    setLocationsLoaded(true);
  }

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) => adminAPI.updateUserSettings(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-settings', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.settingsUpdated', '설정이 업데이트되었습니다.'));
    },
    onError: (error: Error) => {
      alert(t('admin.updateFailed', '업데이트 실패: ') + error.message);
    },
  });

  const deleteSettingsMutation = useMutation({
    mutationFn: () => adminAPI.deleteUserSettings(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-settings', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setLocations([]);
      setLocationsLoaded(false);
      alert(t('admin.settingsDeleted', '설정이 초기화되었습니다.'));
    },
    onError: (error: Error) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.message);
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: (data: Partial<WebhookConfig>) => adminAPI.updateUserWebhook(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-webhook', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.webhookUpdated', '웹훅 설정이 업데이트되었습니다.'));
    },
    onError: (error: Error) => {
      alert(t('admin.updateFailed', '업데이트 실패: ') + error.message);
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: () => adminAPI.deleteUserWebhook(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-webhook', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.webhookDeleted', '웹훅 설정이 삭제되었습니다.'));
    },
    onError: (error: Error) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.message);
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => adminAPI.deleteUserIntegration(user.id, integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-integrations', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.integrationDeleted', '연동이 삭제되었습니다.'));
    },
    onError: (error: Error) => {
      alert(t('admin.deleteFailed', '삭제 실패: ') + error.message);
    },
  });

  const handleAISubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      ollamaEnabled: formData.get('ollamaEnabled') === 'on',
      ollamaBaseUrl: formData.get('ollamaBaseUrl') as string,
      ollamaModel: formData.get('ollamaModel') as string,
    });
  };

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      pop3Enabled: formData.get('pop3Enabled') === 'on',
      pop3Host: formData.get('pop3Host') as string,
      pop3Port: parseInt(formData.get('pop3Port') as string) || undefined,
      pop3User: formData.get('pop3User') as string,
      pop3Password: formData.get('pop3Password') as string,
      pop3Tls: formData.get('pop3Tls') === 'on',
    });
  };

  const handleWebhookSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const columnMappingStr = formData.get('columnMapping') as string;
    
    let columnMapping = null;
    if (columnMappingStr?.trim()) {
      try {
        columnMapping = JSON.parse(columnMappingStr);
      } catch {
        alert(t('admin.invalidJSON', '잘못된 JSON 형식입니다.'));
        return;
      }
    }

    updateWebhookMutation.mutate({
      enabled: formData.get('enabled') === 'on',
      url: formData.get('url') as string,
      columnMapping,
    });
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSaveLocations = () => {
    updateSettingsMutation.mutate({ savedLocations: locations });
  };

  const handleResetSettings = (type: 'settings' | 'webhook') => {
    if (confirm(t('admin.confirmReset', '정말 설정을 초기화하시겠습니까?'))) {
      if (type === 'settings') {
        deleteSettingsMutation.mutate();
      } else {
        deleteWebhookMutation.mutate();
      }
    }
  };

  const isLoading = settingsLoading || webhookLoading || integrationsLoading;
  const hasError = settingsError || webhookError || integrationsError;
  const isMutating = updateSettingsMutation.isPending || updateWebhookMutation.isPending || 
                     deleteSettingsMutation.isPending || deleteWebhookMutation.isPending ||
                     deleteIntegrationMutation.isPending;

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading">{t('common.loading', '로딩 중...')}</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="error-message">
            {t('common.error', '오류가 발생했습니다.')}
            <button onClick={onClose} className="btn btn-secondary">{t('common.close', '닫기')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('admin.userSettings', '사용자 설정')}</h3>
          <div className="user-info-header">
            <strong>{user.name}</strong>
            <span className="text-muted">{user.email}</span>
          </div>
          <button onClick={onClose} className="close-btn" disabled={isMutating}>✕</button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            {t('admin.aiSettings', 'AI 설정')}
          </button>
          <button
            className={`tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            {t('admin.emailSettings', '이메일 설정')}
          </button>
          <button
            className={`tab ${activeTab === 'webhook' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhook')}
          >
            {t('admin.webhookSettings', '웹훅 설정')}
          </button>
          <button
            className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            {t('admin.integrations', '연동')}
          </button>
          <button
            className={`tab ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            {t('admin.locations', '위치')}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'ai' && (
            <form onSubmit={handleAISubmit}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="ollamaEnabled"
                    defaultChecked={settings?.ollamaEnabled || false}
                  />
                  {t('admin.enableOllama', 'Ollama 활성화')}
                </label>
              </div>
              <div className="form-group">
                <label>{t('admin.ollamaBaseUrl', 'Ollama Base URL')}</label>
                <input
                  type="text"
                  name="ollamaBaseUrl"
                  defaultValue={settings?.ollamaBaseUrl || ''}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.ollamaModel', 'Ollama 모델')}</label>
                <input
                  type="text"
                  name="ollamaModel"
                  defaultValue={settings?.ollamaModel || ''}
                  placeholder="llama2"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => handleResetSettings('settings')}
                  disabled={isMutating}
                >
                  {t('admin.resetSettings', '초기화')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isMutating}>
                  {isMutating ? t('common.saving', '저장 중...') : t('common.save', '저장')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="pop3Enabled"
                    defaultChecked={settings?.pop3Enabled || false}
                  />
                  {t('admin.enablePOP3', 'POP3 활성화')}
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.pop3Host', 'POP3 호스트')}</label>
                  <input
                    type="text"
                    name="pop3Host"
                    defaultValue={settings?.pop3Host || ''}
                    placeholder="pop.gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>{t('admin.pop3Port', 'POP3 포트')}</label>
                  <input
                    type="number"
                    name="pop3Port"
                    defaultValue={settings?.pop3Port || 995}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.pop3User', 'POP3 사용자')}</label>
                  <input
                    type="text"
                    name="pop3User"
                    defaultValue={settings?.pop3User || ''}
                  />
                </div>
                <div className="form-group">
                  <label>{t('admin.pop3Password', 'POP3 비밀번호')}</label>
                  <input
                    type="password"
                    name="pop3Password"
                    defaultValue={settings?.pop3Password || ''}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="pop3Tls"
                    defaultChecked={settings?.pop3Tls ?? true}
                  />
                  {t('admin.pop3Tls', 'TLS 사용')}
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={isMutating}>
                  {isMutating ? t('common.saving', '저장 중...') : t('common.save', '저장')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'webhook' && (
            <form onSubmit={handleWebhookSubmit}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={webhookConfig?.enabled || false}
                  />
                  {t('admin.enableWebhook', '웹훅 활성화')}
                </label>
              </div>
              <div className="form-group">
                <label>{t('admin.webhookUrl', '웹훅 URL')}</label>
                <input
                  type="url"
                  name="url"
                  defaultValue={webhookConfig?.url || ''}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.columnMapping', '컬럼 매핑 (JSON)')}</label>
                <textarea
                  name="columnMapping"
                  defaultValue={webhookConfig?.columnMapping ? JSON.stringify(webhookConfig.columnMapping, null, 2) : ''}
                  rows={6}
                  placeholder='{"title": "event_name", "description": "event_desc"}'
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => handleResetSettings('webhook')}
                  disabled={isMutating}
                >
                  {t('admin.resetWebhook', '초기화')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isMutating}>
                  {isMutating ? t('common.saving', '저장 중...') : t('common.save', '저장')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'integrations' && (
            <div className="integrations-list">
              <h4>{t('admin.connectedAccounts', '연동된 계정')}</h4>
              {integrations && integrations.length > 0 ? (
                <table className="integrations-table">
                  <thead>
                    <tr>
                      <th>{t('admin.provider', '제공자')}</th>
                      <th>{t('admin.providerId', '계정 ID')}</th>
                      <th>{t('admin.connectedAt', '연동일')}</th>
                      <th>{t('common.actions', '작업')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((integration) => (
                      <tr key={integration.id}>
                        <td><span className="provider-badge">{integration.provider}</span></td>
                        <td className="provider-id">{integration.providerId}</td>
                        <td>{new Date(integration.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => {
                              if (confirm(t('admin.confirmDeleteIntegration', '이 연동을 삭제하시겠습니까?'))) {
                                deleteIntegrationMutation.mutate(integration.id);
                              }
                            }}
                            className="btn btn-sm btn-danger"
                            disabled={deleteIntegrationMutation.isPending}
                          >
                            {t('common.delete', '삭제')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted empty-message">{t('admin.noIntegrations', '연동된 계정이 없습니다.')}</p>
              )}
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="locations-editor">
              <h4>{t('admin.savedLocations', '저장된 위치')}</h4>
              
              <div className="location-add">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder={t('admin.newLocationPlaceholder', '새 위치 입력...')}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                />
                <button 
                  type="button" 
                  onClick={handleAddLocation} 
                  className="btn btn-secondary"
                  disabled={!newLocation.trim()}
                >
                  {t('common.add', '추가')}
                </button>
              </div>

              <ul className="locations-list">
                {locations.length === 0 ? (
                  <li className="empty-message">{t('admin.noLocations', '저장된 위치가 없습니다.')}</li>
                ) : (
                  locations.map((location, index) => (
                    <li key={index} className="location-item">
                      <span className="location-icon">📍</span>
                      <span className="location-text">{location}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(index)}
                        className="btn-remove"
                        title={t('common.delete', '삭제')}
                      >
                        ✕
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleSaveLocations} 
                  className="btn btn-primary"
                  disabled={isMutating}
                >
                  {isMutating ? t('common.saving', '저장 중...') : t('common.save', '저장')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

