import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserSettings } from '../../lib/api';
import { UseMutationResult } from '@tanstack/react-query';

interface SettingsEmailProps {
  settings?: UserSettings;
  onSave: (data: Partial<UserSettings>) => void;
  isSaving: boolean;
  testEmailMutation: UseMutationResult<void, any, { host: string; port: number; user: string; password: string; tls: boolean }, unknown>;
  syncEmailMutation: UseMutationResult<void, any, void, unknown>;
}

export default function SettingsEmail({ settings, onSave, isSaving, testEmailMutation, syncEmailMutation }: SettingsEmailProps) {
  const { t } = useTranslation();
  const [pop3Enabled, setPop3Enabled] = useState(false);
  const [pop3Host, setPop3Host] = useState('');
  const [pop3Port, setPop3Port] = useState('995');
  const [pop3User, setPop3User] = useState('');
  const [pop3Password, setPop3Password] = useState('');
  const [pop3Tls, setPop3Tls] = useState(true);

  useEffect(() => {
    if (settings) {
      setPop3Enabled(settings.pop3Enabled || false);
      setPop3Host(settings.pop3Host || '');
      setPop3Port(settings.pop3Port?.toString() || '995');
      setPop3User(settings.pop3User || '');
      setPop3Password(settings.pop3Password || '');
      setPop3Tls(settings.pop3Tls ?? true);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({
      pop3Enabled,
      pop3Host,
      pop3Port: parseInt(pop3Port),
      pop3User,
      pop3Password,
      pop3Tls,
    });
  };

  return (
    <div className="settings-panel">
      <h2>{t('settings.email.title', '이메일 연동')}</h2>
      <p className="text-secondary">
        {t('settings.email.description', 'POP3 이메일을 통해 일정을 자동으로 등록합니다.')}
      </p>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={pop3Enabled}
            onChange={(e) => setPop3Enabled(e.target.checked)}
          />
          <span>{t('settings.email.enable', '이메일 연동 활성화')}</span>
        </label>
      </div>

      {pop3Enabled && (
        <>
          <div className="form-group">
            <label>{t('settings.email.host', 'POP3 호스트')}</label>
            <input
              type="text"
              value={pop3Host}
              onChange={(e) => setPop3Host(e.target.value)}
              placeholder="pop.gmail.com"
            />
          </div>

          <div className="form-group">
            <label>{t('settings.email.port', 'POP3 포트')}</label>
            <input
              type="number"
              value={pop3Port}
              onChange={(e) => setPop3Port(e.target.value)}
              placeholder="995"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={pop3Tls}
                onChange={(e) => setPop3Tls(e.target.checked)}
              />
              <span>{t('settings.email.tls', 'TLS 사용')}</span>
            </label>
          </div>

          <div className="form-group">
            <label>{t('settings.email.user', '사용자 이름 (이메일)')}</label>
            <input
              type="text"
              value={pop3User}
              onChange={(e) => setPop3User(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label>{t('settings.email.password', '비밀번호 (앱 비밀번호)')}</label>
            <input
              type="password"
              value={pop3Password}
              onChange={(e) => setPop3Password(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </>
      )}

      <div className="flex gap-sm">
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? t('common.saving', '저장 중...') : t('common.save', '저장')}
        </button>

        <button
          onClick={() => testEmailMutation.mutate({
            host: pop3Host,
            port: parseInt(pop3Port),
            user: pop3User,
            password: pop3Password,
            tls: pop3Tls
          })}
          className="btn btn-secondary"
          disabled={testEmailMutation.isPending || !pop3Enabled}
        >
          {testEmailMutation.isPending ? t('common.testing', '테스트 중...') : t('common.testConnection', '연결 테스트')}
        </button>

        <button
          onClick={() => syncEmailMutation.mutate()}
          className="btn btn-secondary"
          disabled={syncEmailMutation.isPending || !pop3Enabled}
        >
          {syncEmailMutation.isPending ? t('common.syncing', '동기화 중...') : t('common.syncNow', '지금 동기화')}
        </button>
      </div>
    </div>
  );
}
