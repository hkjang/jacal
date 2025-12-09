import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../../lib/adminApi';



export default function GeneralConfig() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['site', 'users', 'uploads']));
  const [hasChanges, setHasChanges] = useState(false);
  const [config, setConfig] = useState({
    siteName: 'Jacal',
    siteUrl: 'https://jacal.app',
    defaultLanguage: 'ko',
    timezone: 'Asia/Seoul',
    allowRegistration: true,
    requireEmailVerification: false,
    maxUploadSizeMB: 10,
  });
  const [originalConfig, setOriginalConfig] = useState(config);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminAPI.getSettings,
  });

  useEffect(() => {
    if (settingsData) {
      const newConfig = {
        siteName: settingsData.siteName || 'Jacal',
        siteUrl: settingsData.siteUrl || 'https://jacal.app',
        defaultLanguage: settingsData.defaultLanguage || 'ko',
        timezone: settingsData.timezone || 'Asia/Seoul',
        allowRegistration: settingsData.allowRegistration ?? true,
        requireEmailVerification: settingsData.requireEmailVerification ?? false,
        maxUploadSizeMB: settingsData.maxUploadSizeMB || 10,
      };
      setConfig(newConfig);
      setOriginalConfig(newConfig);
    }
  }, [settingsData]);

  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
  }, [config, originalConfig]);

  const updateMutation = useMutation({
    mutationFn: adminAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setOriginalConfig(config);
      setHasChanges(false);
      alert(t('admin.settingsSaved', '설정이 저장되었습니다'));
    },
    onError: (error: any) => {
      alert(t('admin.saveFailed', '저장 실패: ') + error.response?.data?.error);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(config);
  };

  const handleReset = () => {
    setConfig(originalConfig);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading', '로딩 중...')}</div>;
  }



  return (
    <div className="general-config-container">
      <div className="config-header">
        <div className="header-content">
          <h2>{t('admin.general', '일반 설정')}</h2>
          <p className="header-description">{t('admin.generalDesc', '애플리케이션 전역 설정 관리')}</p>
        </div>
        {hasChanges && (
          <div className="unsaved-badge">
            <span className="unsaved-dot"></span>
            {t('admin.unsavedChanges', '저장되지 않은 변경사항')}
          </div>
        )}
      </div>

      {/* Configuration Sections */}
      <div className="config-sections">
        {/* Site Settings */}
        <div className="config-section">
          <button
            className={`section-header ${expandedSections.has('site') ? 'expanded' : ''}`}
            onClick={() => toggleSection('site')}
          >
            <div className="section-header-left">
              <span className="section-icon">🌐</span>
              <span className="section-title">{t('admin.siteSettings', '사이트 설정')}</span>
            </div>
            <span className="section-arrow">{expandedSections.has('site') ? '▼' : '▶'}</span>
          </button>

          {expandedSections.has('site') && (
            <div className="section-content">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  {t('admin.siteName', '사이트 이름')}
                </label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  className="form-input"
                  placeholder="Jacal"
                />
                <span className="form-hint">{t('admin.siteNameHint', '사이트 헤더와 이메일에 표시됩니다')}</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔗</span>
                  {t('admin.siteUrl', '사이트 URL')}
                </label>
                <input
                  type="text"
                  value={config.siteUrl}
                  onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://jacal.app"
                />
                <span className="form-hint">{t('admin.siteUrlHint', '이메일 링크와 리다이렉트에 사용됩니다')}</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌍</span>
                    {t('admin.defaultLanguage', '기본 언어')}
                  </label>
                  <select
                    value={config.defaultLanguage}
                    onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value })}
                    className="form-select"
                  >
                    <option value="ko">한국어 (Korean)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🕐</span>
                    {t('admin.timezone', '시간대')}
                  </label>
                  <select
                    value={config.timezone}
                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="form-select"
                  >
                    <option value="Asia/Seoul">Asia/Seoul (KST, UTC+9)</option>
                    <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                    <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Settings */}
        <div className="config-section">
          <button
            className={`section-header ${expandedSections.has('users') ? 'expanded' : ''}`}
            onClick={() => toggleSection('users')}
          >
            <div className="section-header-left">
              <span className="section-icon">👥</span>
              <span className="section-title">{t('admin.userSettings', '사용자 설정')}</span>
            </div>
            <span className="section-arrow">{expandedSections.has('users') ? '▼' : '▶'}</span>
          </button>

          {expandedSections.has('users') && (
            <div className="section-content">
              <div className="toggle-group">
                <div className="toggle-info">
                  <span className="toggle-icon">🚪</span>
                  <div className="toggle-text">
                    <span className="toggle-label">{t('admin.allowRegistration', '회원가입 허용')}</span>
                    <span className="toggle-hint">{t('admin.allowRegistrationHint', '새로운 사용자의 회원가입을 허용합니다')}</span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.allowRegistration}
                    onChange={(e) => setConfig({ ...config, allowRegistration: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-group">
                <div className="toggle-info">
                  <span className="toggle-icon">✉️</span>
                  <div className="toggle-text">
                    <span className="toggle-label">{t('admin.requireEmailVerification', '이메일 인증 필수')}</span>
                    <span className="toggle-hint">{t('admin.requireEmailHint', '신규 사용자는 이메일 인증 후 이용 가능합니다')}</span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.requireEmailVerification}
                    onChange={(e) => setConfig({ ...config, requireEmailVerification: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Upload Settings */}
        <div className="config-section">
          <button
            className={`section-header ${expandedSections.has('uploads') ? 'expanded' : ''}`}
            onClick={() => toggleSection('uploads')}
          >
            <div className="section-header-left">
              <span className="section-icon">📤</span>
              <span className="section-title">{t('admin.uploadSettings', '업로드 설정')}</span>
            </div>
            <span className="section-arrow">{expandedSections.has('uploads') ? '▼' : '▶'}</span>
          </button>

          {expandedSections.has('uploads') && (
            <div className="section-content">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📦</span>
                  {t('admin.maxUploadSize', '최대 업로드 크기')}
                </label>
                <div className="size-selector">
                  {[5, 10, 20, 50].map((size) => (
                    <button
                      key={size}
                      className={`size-option ${config.maxUploadSizeMB === size ? 'selected' : ''}`}
                      onClick={() => setConfig({ ...config, maxUploadSizeMB: size })}
                    >
                      {size} MB
                    </button>
                  ))}
                </div>
                <span className="form-hint">{t('admin.maxUploadHint', '파일당 최대 업로드 크기를 설정합니다')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="config-actions">
        <button
          className="action-btn secondary"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          ↩️ {t('admin.reset', '되돌리기')}
        </button>
        <button
          className="action-btn primary"
          onClick={handleSave}
          disabled={updateMutation.isPending || !hasChanges}
        >
          {updateMutation.isPending ? (
            <>⏳ {t('common.saving', '저장 중...')}</>
          ) : (
            <>💾 {t('admin.save', '설정 저장')}</>
          )}
        </button>
      </div>

      {/* Note */}
      <div className="config-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>{t('admin.note', '안내')}</strong>
          <p>{t('admin.settingsNote', '설정은 애플리케이션 전체에 적용됩니다. 변경사항은 저장 후 즉시 반영됩니다.')}</p>
        </div>
      </div>

      <style>{`
        .general-config-container {
          padding: 1rem;
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-description {
          margin: 0;
          color: var(--text-secondary);
        }

        .unsaved-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 20px;
          font-size: 0.85rem;
          color: #f59e0b;
        }

        .unsaved-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .config-sections {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .config-section {
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .section-header:hover {
          background: rgba(var(--primary-rgb), 0.05);
        }

        .section-header.expanded {
          background: rgba(var(--primary-rgb), 0.08);
          border-bottom: 1px solid var(--border);
        }

        .section-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-icon {
          font-size: 1.25rem;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .section-arrow {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .section-content {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .label-icon {
          font-size: 1rem;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .form-hint {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .toggle-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .toggle-group:last-child {
          margin-bottom: 0;
        }

        .toggle-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .toggle-icon {
          font-size: 1.25rem;
          margin-top: 0.125rem;
        }

        .toggle-text {
          display: flex;
          flex-direction: column;
        }

        .toggle-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .toggle-hint {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--border);
          transition: 0.3s;
          border-radius: 28px;
        }

        .toggle-slider::before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background: var(--primary);
        }

        input:checked + .toggle-slider::before {
          transform: translateX(24px);
        }

        .size-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .size-option {
          padding: 0.75rem 1.5rem;
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .size-option:hover {
          border-color: var(--primary);
        }

        .size-option.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .config-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .action-btn.secondary:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }

        .action-btn.primary {
          background: var(--primary);
          color: white;
        }

        .action-btn.primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .config-note {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          border-radius: 8px;
        }

        .config-note .note-icon {
          font-size: 1.5rem;
        }

        .config-note .note-content {
          flex: 1;
        }

        .config-note .note-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .config-note .note-content p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .loading {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .config-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
