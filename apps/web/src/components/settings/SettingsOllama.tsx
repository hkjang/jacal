import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserSettings } from '../../lib/api';

interface SettingsOllamaProps {
  settings?: UserSettings;
  onSave: (data: Partial<UserSettings>) => void;
  isSaving: boolean;
}

export default function SettingsOllama({ settings, onSave, isSaving }: SettingsOllamaProps) {
  const { t } = useTranslation();
  const [ollamaEnabled, setOllamaEnabled] = useState(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434/v1');
  const [ollamaModel, setOllamaModel] = useState('gpt-oss:20b');

  useEffect(() => {
    if (settings) {
      setOllamaEnabled(settings.ollamaEnabled);
      setOllamaBaseUrl(settings.ollamaBaseUrl || 'http://localhost:11434/v1');
      setOllamaModel(settings.ollamaModel || 'gpt-oss:20b');
    }
  }, [settings]);

  const handleSave = () => {
    onSave({
      ollamaEnabled,
      ollamaBaseUrl,
      ollamaModel,
    });
  };

  return (
    <div className="settings-panel">
      <h2>{t('settings.ollama.title', 'Ollama 설정')}</h2>
      <p className="text-secondary">
        {t('settings.ollama.description', '로컬 Ollama 인스턴스를 자연어 처리에 활용하세요')}
      </p>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={ollamaEnabled}
            onChange={(e) => setOllamaEnabled(e.target.checked)}
          />
          <span>{t('settings.ollama.enable', 'Ollama 활성화 (OpenAI 대신 로컬 LLM 사용)')}</span>
        </label>
      </div>

      {ollamaEnabled && (
        <>
          <div className="form-group">
            <label>{t('settings.ollama.baseUrl', 'Ollama 기본 URL')}</label>
            <input
              type="text"
              value={ollamaBaseUrl}
              onChange={(e) => setOllamaBaseUrl(e.target.value)}
              placeholder="http://localhost:11434/v1"
            />
            <small className="text-secondary">
              {t('settings.ollama.baseUrlHelp', 'Ollama 인스턴스의 OpenAI 호환 API 엔드포인트')}
            </small>
          </div>

          <div className="form-group">
            <label>{t('settings.ollama.model', '모델 이름')}</label>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="gpt-oss:20b"
            />
            <small className="text-secondary">
              {t('settings.ollama.modelHelp', '사용할 모델 이름 (예: gpt-oss:20b, llama2, mistral)')}
            </small>
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        className="btn btn-primary"
        disabled={isSaving}
      >
        {isSaving ? t('settings.ollama.saving', '저장 중...') : t('settings.ollama.saveSettings', '설정 저장')}
      </button>
    </div>
  );
}
