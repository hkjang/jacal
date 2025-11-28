import { useTranslation } from 'react-i18next';
import { UseMutationResult } from '@tanstack/react-query';

interface SettingsIntegrationsProps {
  handleConnectGoogle: () => void;
  handleSyncCalendar: UseMutationResult<void, any, void, unknown>;
}

export default function SettingsIntegrations({ handleConnectGoogle, handleSyncCalendar }: SettingsIntegrationsProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-panel">
      <h2>{t('settings.integrations.title', '연동')}</h2>
      <p className="text-secondary">
        {t('settings.integrations.description', '외부 서비스를 연결하여 데이터 동기화')}
      </p>

      <div className="card integration-card">
        <div className="flex justify-between items-center">
          <div>
            <h3>{t('settings.integrations.googleCalendar', '구글 캘린더')}</h3>
            <p className="text-sm text-secondary">{t('settings.integrations.googleCalendarDesc', '구글 캘린더에서 일정 동기화')}</p>
          </div>
          <div className="flex gap-sm">
            <button onClick={handleConnectGoogle} className="btn btn-secondary">
              {t('settings.integrations.connect', '연동하기')}
            </button>
            <button 
              onClick={() => handleSyncCalendar.mutate()} 
              className="btn btn-primary"
              disabled={handleSyncCalendar.isPending}
            >
              {handleSyncCalendar.isPending ? t('settings.integrations.syncing', '동기화 중...') : t('settings.integrations.sync', '지금 동기화')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
