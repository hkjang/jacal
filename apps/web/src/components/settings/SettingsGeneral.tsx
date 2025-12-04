import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '../../hooks/useTheme';

interface SettingsGeneralProps {}

export default function SettingsGeneral({}: SettingsGeneralProps) {
  const { t } = useTranslation();
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: t('settings.theme.light', '라이트'), icon: '☀️' },
    { value: 'dark', label: t('settings.theme.dark', '다크'), icon: '🌙' },
    { value: 'system', label: t('settings.theme.system', '시스템'), icon: '💻' },
  ];

  return (
    <div className="settings-section">
      <h2 className="section-title">{t('settings.general.title', '일반 설정')}</h2>
      <p className="section-description">
        {t('settings.general.description', '앱의 기본 설정을 관리합니다.')}
      </p>

      {/* Theme Selection */}
      <div className="settings-group">
        <h3 className="group-title">{t('settings.theme.title', '테마')}</h3>
        <p className="group-description">
          {t('settings.theme.description', '앱의 외관을 선택합니다.')}
        </p>
        
        <div className="theme-selector">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              className={`theme-option ${theme === option.value ? 'active' : ''}`}
              onClick={() => setTheme(option.value)}
            >
              <span className="theme-icon">{option.icon}</span>
              <span className="theme-label">{option.label}</span>
              {theme === option.value && (
                <span className="theme-check">✓</span>
              )}
            </button>
          ))}
        </div>

        {theme === 'system' && (
          <p className="theme-info">
            {t('settings.theme.currentlyUsing', '현재')}: {effectiveTheme === 'dark' ? '🌙 ' + t('settings.theme.dark', '다크') : '☀️ ' + t('settings.theme.light', '라이트')}
          </p>
        )}
      </div>

      {/* Language Selection - placeholder for future */}
      <div className="settings-group">
        <h3 className="group-title">{t('settings.language.title', '언어')}</h3>
        <p className="group-description">
          {t('settings.language.description', '앱에서 사용할 언어를 선택합니다.')}
        </p>
        
        <select 
          className="language-select"
          defaultValue="ko"
          onChange={(e) => {
            // Language change will be implemented later
            console.log('Language changed to:', e.target.value);
          }}
        >
          <option value="ko">🇰🇷 한국어</option>
          <option value="en">🇺🇸 English</option>
        </select>
      </div>
    </div>
  );
}
