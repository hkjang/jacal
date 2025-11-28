import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, calendarAPI, UserSettings, WebhookConfig } from '../lib/api';
import './Settings.css';
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
      alert('Settings saved successfully!');
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: (data: Partial<WebhookConfig>) => settingsAPI.updateWebhookConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhookConfig'] });
      alert('Webhook config saved successfully!');
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: settingsAPI.testWebhook,
    onSuccess: () => {
      alert('Test webhook sent successfully!');
    },
    onError: () => {
      alert('Failed to send test webhook. Check your URL and try again.');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: settingsAPI.testEmailConnection,
    onSuccess: () => {
      alert('Email connection successful!');
    },
    onError: (error: any) => {
      alert(`Connection failed: ${error.response?.data?.error || error.message}`);
    },
  });

  const syncEmailMutation = useMutation({
    mutationFn: settingsAPI.syncEmail,
    onSuccess: () => {
      alert('Email sync triggered successfully!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      alert(`Sync failed: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleConnectGoogle = async () => {
    try {
      const { url } = await calendarAPI.getAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth url', error);
      alert('Failed to start Google connection');
    }
  };

  const handleSyncCalendar = useMutation({
    mutationFn: calendarAPI.sync,
    onSuccess: () => {
      alert('Calendar synced successfully!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      alert('Failed to sync calendar');
    },
  });

  // Check for success/error params in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      alert('Google Calendar connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'error') {
      alert('Failed to connect Google Calendar');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
