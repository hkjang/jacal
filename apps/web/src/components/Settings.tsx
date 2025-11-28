import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, UserSettings, WebhookConfig } from '../lib/api';
import './Settings.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'ollama' | 'webhook'>('ollama');
  const queryClient = useQueryClient();

  // Ollama settings state
  const [ollamaEnabled, setOllamaEnabled] = useState(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434/v1');
  const [ollamaModel, setOllamaModel] = useState('gpt-oss:20b');

  // Webhook settings state
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [newMappingKey, setNewMappingKey] = useState('');
  const [newMappingValue, setNewMappingValue] = useState('');

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

  // Update settings when data loads
  useEffect(() => {
    if (settings) {
      setOllamaEnabled(settings.ollamaEnabled);
      setOllamaBaseUrl(settings.ollamaBaseUrl || 'http://localhost:11434/v1');
      setOllamaModel(settings.ollamaModel || 'gpt-oss:20b');
    }
  }, [settings]);

  useEffect(() => {
    if (webhookConfig) {
      setWebhookEnabled(webhookConfig.enabled);
      setWebhookUrl(webhookConfig.url || '');
      setColumnMapping(webhookConfig.columnMapping || {});
    }
  }, [webhookConfig]);

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

  const handleSaveOllama = () => {
    updateSettingsMutation.mutate({
      ollamaEnabled,
      ollamaBaseUrl,
      ollamaModel,
    });
  };

  const handleSaveWebhook = () => {
    updateWebhookMutation.mutate({
      enabled: webhookEnabled,
      url: webhookUrl,
      columnMapping,
    });
  };

  const handleAddMapping = () => {
    if (newMappingKey && newMappingValue) {
      setColumnMapping({ ...columnMapping, [newMappingKey]: newMappingValue });
      setNewMappingKey('');
      setNewMappingValue('');
    }
  };

  const handleRemoveMapping = (key: string) => {
    const updated = { ...columnMapping };
    delete updated[key];
    setColumnMapping(updated);
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Settings</h1>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'ollama' ? 'active' : ''}`}
          onClick={() => setActiveTab('ollama')}
        >
          🤖 AI Configuration
        </button>
        <button
          className={`settings-tab ${activeTab === 'webhook' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhook')}
        >
          🔗 Webhook Integration
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'ollama' && (
          <div className="settings-panel">
            <h2>Ollama Configuration</h2>
            <p className="text-secondary">
              Configure your local Ollama instance for natural language processing
            </p>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={ollamaEnabled}
                  onChange={(e) => setOllamaEnabled(e.target.checked)}
                />
                <span>Enable Ollama (use local LLM instead of OpenAI)</span>
              </label>
            </div>

            {ollamaEnabled && (
              <>
                <div className="form-group">
                  <label>Ollama Base URL</label>
                  <input
                    type="text"
                    value={ollamaBaseUrl}
                    onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                  />
                  <small className="text-secondary">
                    The OpenAI-compatible API endpoint of your Ollama instance
                  </small>
                </div>

                <div className="form-group">
                  <label>Model Name</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="gpt-oss:20b"
                  />
                  <small className="text-secondary">
                    The model name to use (e.g., gpt-oss:20b, llama2, mistral)
                  </small>
                </div>
              </>
            )}

            <button
              onClick={handleSaveOllama}
              className="btn btn-primary"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        {activeTab === 'webhook' && (
          <div className="settings-panel">
            <h2>Webhook Integration</h2>
            <p className="text-secondary">
              Send event data to external systems when events are created
            </p>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={webhookEnabled}
                  onChange={(e) => setWebhookEnabled(e.target.checked)}
                />
                <span>Enable Webhook</span>
              </label>
            </div>

            {webhookEnabled && (
              <>
                <div className="form-group">
                  <label>Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-api.com/webhook"
                  />
                  <small className="text-secondary">
                    POST requests will be sent to this URL when events are created
                  </small>
                </div>

                <div className="form-group">
                  <label>Column Mapping</label>
                  <small className="text-secondary mb-sm">
                    Map event fields to custom field names for your webhook
                  </small>

                  <div className="mapping-list">
                    {Object.entries(columnMapping).map(([key, value]) => (
                      <div key={key} className="mapping-item">
                        <span className="mapping-key">{key}</span>
                        <span className="mapping-arrow">→</span>
                        <span className="mapping-value">{value}</span>
                        <button
                          onClick={() => handleRemoveMapping(key)}
                          className="btn-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mapping-add">
                    <input
                      type="text"
                      value={newMappingKey}
                      onChange={(e) => setNewMappingKey(e.target.value)}
                      placeholder="Source field (e.g., title)"
                      className="mapping-input"
                    />
                    <span className="mapping-arrow">→</span>
                    <input
                      type="text"
                      value={newMappingValue}
                      onChange={(e) => setNewMappingValue(e.target.value)}
                      placeholder="Target field (e.g., event_name)"
                      className="mapping-input"
                    />
                    <button onClick={handleAddMapping} className="btn btn-secondary">
                      Add
                    </button>
                  </div>

                  <small className="text-secondary mt-sm">
                    Available fields: title, description, startAt, endAt, location
                  </small>
                </div>
              </>
            )}

            <button
              onClick={handleSaveWebhook}
              className="btn btn-primary"
              disabled={updateWebhookMutation.isPending}
            >
              {updateWebhookMutation.isPending ? 'Saving...' : 'Save Webhook Config'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
