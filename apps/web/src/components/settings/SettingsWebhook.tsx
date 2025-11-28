import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WebhookConfig } from '../../lib/api';
import { UseMutationResult } from '@tanstack/react-query';

interface SettingsWebhookProps {
  webhookConfig?: WebhookConfig;
  onSave: (data: Partial<WebhookConfig>) => void;
  isSaving: boolean;
  testWebhookMutation: UseMutationResult<void, any, void, unknown>;
}

export default function SettingsWebhook({ webhookConfig, onSave, isSaving, testWebhookMutation }: SettingsWebhookProps) {
  const { t } = useTranslation();
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [newMappingKey, setNewMappingKey] = useState('');
  const [newMappingValue, setNewMappingValue] = useState('');

  useEffect(() => {
    if (webhookConfig) {
      setWebhookEnabled(webhookConfig.enabled);
      setWebhookUrl(webhookConfig.url || '');
      setColumnMapping(webhookConfig.columnMapping || {});
    }
  }, [webhookConfig]);

  const handleSave = () => {
    onSave({
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
    <div className="settings-panel">
      <h2>{t('settings.webhook.title', '웹훅 연동')}</h2>
      <p className="text-secondary">
        {t('settings.webhook.description', '일정이 생성될 때 외부 시스템으로 데이터 전송')}
      </p>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={webhookEnabled}
            onChange={(e) => setWebhookEnabled(e.target.checked)}
          />
          <span>{t('settings.webhook.enable', '웹훅 활성화')}</span>
        </label>
      </div>

      {webhookEnabled && (
        <>
          <div className="form-group">
            <label>{t('settings.webhook.url', '웹훅 URL')}</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-api.com/webhook"
            />
            <small className="text-secondary">
              {t('settings.webhook.urlHelp', '일정 생성 시 POST 요청이 전송될 URL')}
            </small>
          </div>

          <div className="form-group">
            <label>{t('settings.webhook.columnMapping', '컴럼 매핑')}</label>
            <small className="text-secondary mb-sm">
              {t('settings.webhook.columnMappingHelp', '이벤트 필드를 웹훅용 커스텀 필드 이름으로 매핑')}
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
              <select
                value={newMappingKey}
                onChange={(e) => setNewMappingKey(e.target.value)}
                className="mapping-input"
              >
                <option value="">{t('settings.webhook.selectSourceField', '소스 필드 선택')}</option>
                <option value="title">title</option>
                <option value="description">description</option>
                <option value="startAt">startAt</option>
                <option value="endAt">endAt</option>
                <option value="location">location</option>
                <option value="sourceCalendar">sourceCalendar</option>
              </select>
              <span className="mapping-arrow">→</span>
              <input
                type="text"
                value={newMappingValue}
                onChange={(e) => setNewMappingValue(e.target.value)}
                placeholder={t('settings.webhook.targetField', '대상 필드 (예: event_name)')}
                className="mapping-input"
              />
              <button onClick={handleAddMapping} className="btn btn-secondary">
                {t('settings.webhook.addMapping', '매핑 추가')}
              </button>
            </div>

            <small className="text-secondary mt-sm">
              {t('settings.webhook.mappingHelp', '소스 필드를 선택하고 커스텀 대상 필드 이름으로 매핑하세요')}
            </small>
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        className="btn btn-primary"
        disabled={isSaving}
      >
        {isSaving ? t('common.saving', '저장 중...') : t('settings.webhook.saveConfig', '웹훅 설정 저장')}
      </button>

      <button
        onClick={() => testWebhookMutation.mutate()}
        className="btn btn-secondary"
        style={{ marginLeft: '1rem' }}
        disabled={testWebhookMutation.isPending || !webhookEnabled}
      >
        {testWebhookMutation.isPending ? t('settings.webhook.testing', '테스트 중...') : t('settings.webhook.test', '웹훅 테스트')}
      </button>
    </div>
  );
}
