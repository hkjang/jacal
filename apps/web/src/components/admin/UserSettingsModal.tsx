import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../lib/adminApi';
import './UserSettingsModal.css';

interface UserSettingsModalProps {
  user: any;
  onClose: () => void;
}

type TabType = 'ai' | 'email' | 'webhook' | 'integrations' | 'locations';

export default function UserSettingsModal({ user, onClose }: UserSettingsModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('ai');

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'user-settings', user.id],
    queryFn: () => adminAPI.getUserSettings(user.id),
  });

  // Fetch webhook config
  const { data: webhookConfig, isLoading: webhookLoading } = useQuery({
    queryKey: ['admin', 'user-webhook', user.id],
    queryFn: () => adminAPI.getUserWebhook(user.id),
  });

  // Fetch integrations
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['admin', 'user-integrations', user.id],
    queryFn: () => adminAPI.getUserIntegrations(user.id),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updateUserSettings(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-settings', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.settingsUpdated', '설정이 업데이트되었습니다.'));
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updateUserWebhook(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-webhook', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.webhookUpdated', '웹훅 설정이 업데이트되었습니다.'));
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => adminAPI.deleteUserIntegration(user.id, integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-integrations', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('admin.integrationDeleted', '연동이 삭제되었습니다.'));
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
    if (columnMappingStr) {
      try {
        columnMapping = JSON.parse(columnMappingStr);
      } catch (err) {
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

  const handleLocationsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const locationsStr = formData.get('savedLocations') as string;
    
    let savedLocations = [];
    if (locationsStr) {
      try {
        savedLocations = JSON.parse(locationsStr);
      } catch (err) {
        alert(t('admin.invalidJSON', '잘못된 JSON 형식입니다.'));
        return;
      }
    }

    updateSettingsMutation.mutate({
      savedLocations,
    });
  };

  if (settingsLoading || webhookLoading || integrationsLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading">{t('common.loading', '로딩 중...')}</div>
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
          <button onClick={onClose} className="close-btn">✕</button>
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
                <label>
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
                <button type="submit" className="btn btn-primary">
                  {t('common.save', '저장')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="pop3Enabled"
                    defaultChecked={settings?.pop3Enabled || false}
                  />
                  {t('admin.enablePOP3', 'POP3 활성화')}
                </label>
              </div>
              <div className="form-group">
                <label>{t('admin.pop3Host', 'POP3 호스트')}</label>
                <input
                  type="text"
                  name="pop3Host"
                  defaultValue={settings?.pop3Host || ''}
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
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="pop3Tls"
                    defaultChecked={settings?.pop3Tls ?? true}
                  />
                  {t('admin.pop3Tls', 'TLS 사용')}
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {t('common.save', '저장')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'webhook' && (
            <form onSubmit={handleWebhookSubmit}>
              <div className="form-group">
                <label>
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
                <button type="submit" className="btn btn-primary">
                  {t('common.save', '저장')}
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
                    {integrations.map((integration: any) => (
                      <tr key={integration.id}>
                        <td><span className="provider-badge">{integration.provider}</span></td>
                        <td>{integration.providerId}</td>
                        <td>{new Date(integration.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => {
                              if (confirm(t('admin.confirmDeleteIntegration', '이 연동을 삭제하시겠습니까?'))) {
                                deleteIntegrationMutation.mutate(integration.id);
                              }
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            {t('common.delete', '삭제')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">{t('admin.noIntegrations', '연동된 계정이 없습니다.')}</p>
              )}
            </div>
          )}

          {activeTab === 'locations' && (
            <form onSubmit={handleLocationsSubmit}>
              <div className="form-group">
                <label>{t('admin.savedLocations', '저장된 위치 (JSON 배열)')}</label>
                <textarea
                  name="savedLocations"
                  defaultValue={settings?.savedLocations ? JSON.stringify(settings.savedLocations, null, 2) : '[]'}
                  rows={8}
                  placeholder='["서울 강남구", "서울 종로구"]'
                />
                <small className="help-text">
                  {t('admin.locationsHelp', '위치 목록을 JSON 배열 형식으로 입력하세요.')}
                </small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {t('common.save', '저장')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
