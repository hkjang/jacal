import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, calendarAPI, UserSettings, WebhookConfig } from '../lib/api';
import './Settings.css';
import './PageLayouts.css';
import { useTranslation } from 'react-i18next';
import SettingsOllama from './settings/SettingsOllama';
import SettingsEmail from './settings/SettingsEmail';
import SettingsWebhook from './settings/SettingsWebhook';
import SettingsIntegrations from './settings/SettingsIntegrations';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ollama' | 'webhook' | 'integrations' | 'email'>('ollama');
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: settingsAPI.getSettings,
  });

  // Fetch webhook config
  const { data: webhookConfig } = useQuery<WebhookConfig>({
    queryKey: ['webhookConfig'],
    queryFn: settingsAPI.getWebhookConfig,
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) => settingsAPI.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert(t('common.success', '설정이 저장되었습니다!'));
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: (data: Partial<WebhookConfig>) => settingsAPI.updateWebhookConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhookConfig'] });
      alert(t('settings.webhook.saveSuccess', '웹훅 설정이 저장되었습니다!'));
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: settingsAPI.testWebhook,
    onSuccess: () => {
      alert(t('settings.webhook.testSuccess', '테스트 웹훅이 성공적으로 전송되었습니다!'));
    },
    onError: () => {
      alert(t('settings.webhook.testError', '웹훅 전송 실패. URL을 확인하고 다시 시도하세요.'));
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: settingsAPI.testEmailConnection,
    onSuccess: () => {
      alert(t('settings.email.testSuccess', '이메일 연결 성공!'));
    },
    onError: (error: any) => {
      alert(t('settings.email.testError', '연결 실패: ') + (error.response?.data?.error || error.message));
    },
  });

  const syncEmailMutation = useMutation({
    mutationFn: settingsAPI.syncEmail,
    onSuccess: () => {
      alert(t('settings.email.syncSuccess', '이메일 동기화가 시작되었습니다!'));
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      alert(t('settings.email.syncError', '동기화 실패: ') + (error.response?.data?.error || error.message));
    },
  });

  const handleConnectGoogle = async () => {
    try {
      const { url } = await calendarAPI.getAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth url', error);
      alert(t('settings.integrations.connectError', '구글 캘린더 연결 실패'));
    }
  };

  const handleSyncCalendar = useMutation({
    mutationFn: calendarAPI.sync,
    onSuccess: () => {
      alert(t('settings.integrations.syncSuccess', '캘린더가 성공적으로 동기화되었습니다!'));
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      alert(t('settings.integrations.syncError', '캘린더 동기화 실패'));
    },
  });

  // Check for success/error params in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      alert(t('settings.integrations.connectSuccess', '구글 캘린더가 성공적으로 연결되었습니다!'));
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'error') {
      alert(t('settings.integrations.connectError', '구글 캘린더 연결 실패'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [t]);

  return (
    <div className="settings-container">
      <h1 className="settings-title">{t('settings.title', '설정')}</h1>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'ollama' ? 'active' : ''}`}
          onClick={() => setActiveTab('ollama')}
        >
          {t('settings.tabs.ollama', '🤖 AI 설정')}
        </button>
        <button
          className={`settings-tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          {t('settings.tabs.email', '📧 이메일')}
        </button>
        <button
          className={`settings-tab ${activeTab === 'webhook' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhook')}
        >
          {t('settings.tabs.webhook', '🔗 웹훅')}
        </button>
        <button
          className={`settings-tab ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          {t('settings.tabs.integrations', '📅 연동')}
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'ollama' && (
          <SettingsOllama
            settings={settings}
            onSave={(data) => updateSettingsMutation.mutate(data)}
            isSaving={updateSettingsMutation.isPending}
          />
        )}

        {activeTab === 'email' && (
          <SettingsEmail
            settings={settings}
            onSave={(data) => updateSettingsMutation.mutate(data)}
            isSaving={updateSettingsMutation.isPending}
            testEmailMutation={testEmailMutation}
            syncEmailMutation={syncEmailMutation}
          />
        )}

        {activeTab === 'webhook' && (
          <SettingsWebhook
            webhookConfig={webhookConfig}
            onSave={(data) => updateWebhookMutation.mutate(data)}
            isSaving={updateWebhookMutation.isPending}
            testWebhookMutation={testWebhookMutation}
          />
        )}

        {activeTab === 'integrations' && (
          <SettingsIntegrations
            handleConnectGoogle={handleConnectGoogle}
            handleSyncCalendar={handleSyncCalendar}
          />
        )}
      </div>
    </div>
  );
}
