import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';

export default function GeneralConfig() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    siteName: 'Jacal',
    siteUrl: 'https://jacal.app',
    defaultLanguage: 'ko',
    timezone: 'Asia/Seoul',
    allowRegistration: true,
    requireEmailVerification: false,
    maxUploadSizeMB: 10,
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminAPI.getSettings,
  });

  useEffect(() => {
    if (settingsData) {
      setConfig({
        siteName: settingsData.siteName || 'Jacal',
        siteUrl: settingsData.siteUrl || 'https://jacal.app',
        defaultLanguage: settingsData.defaultLanguage || 'ko',
        timezone: settingsData.timezone || 'Asia/Seoul',
        allowRegistration: settingsData.allowRegistration ?? true,
        requireEmailVerification: settingsData.requireEmailVerification ?? false,
        maxUploadSizeMB: settingsData.maxUploadSizeMB || 10,
      });
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: adminAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      alert(t('admin.settingsSaved', '설정이 저장되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.saveFailed', '저장 실패: ') + error.response?.data?.error);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(config);
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }

  return (
    <div className="admin-section">
      <h2>{t('admin.general', '일반 설정')}</h2>
      <p className="section-description">General application settings and configuration</p>

      <div className="config-form">
        <div className="form-group">
          <label>Site Name</label>
          <input
            type="text"
            value={config.siteName}
            onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Site URL</label>
          <input
            type="text"
            value={config.siteUrl}
            onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Default Language</label>
            <select
              value={config.defaultLanguage}
              onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value })}
              className="form-select"
            >
              <option value="en">English</option>
              <option value="ko">Korean (한국어)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <select
              value={config.timezone}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              className="form-select"
            >
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.allowRegistration}
              onChange={(e) => setConfig({ ...config, allowRegistration: e.target.checked })}
            />
            <span>Allow new user registration</span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.requireEmailVerification}
              onChange={(e) => setConfig({ ...config, requireEmailVerification: e.target.checked })}
            />
            <span>Require email verification for new users</span>
          </label>
        </div>

        <div className="form-group">
          <label>Max Upload Size</label>
          <select
            value={config.maxUploadSizeMB}
            onChange={(e) => setConfig({ ...config, maxUploadSizeMB: parseInt(e.target.value) })}
            className="form-select"
          >
            <option value={5}>5 MB</option>
            <option value={10}>10 MB</option>
            <option value={20}>20 MB</option>
            <option value={50}>50 MB</option>
          </select>
        </div>

        <button 
          className="save-button" 
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? t('common.saving', '저장 중...') : '💾 Save Settings'}
        </button>
      </div>

      <div className="note">
        <p>💡 <strong>Note:</strong> Settings are applied globally to the application.</p>
      </div>

      <style>{`
        .admin-section {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .section-description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .config-form {
          background: var(--bg-tertiary);
          padding: 2rem;
          border-radius: 8px;
          max-width: 800px;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: normal;
        }

        .checkbox-label input[type="checkbox"] {
          width: 1.2rem;
          height: 1.2rem;
          cursor: pointer;
        }

        .save-button {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }

        .save-button:hover {
          opacity: 0.9;
        }
        
        .save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .note {
          padding: 1rem;
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
        }

        .note p {
          margin: 0;
          color: var(--text-secondary);
        }
        
        .loading {
          padding: 2rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
