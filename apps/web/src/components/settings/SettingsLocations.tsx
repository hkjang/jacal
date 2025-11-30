import { UserSettings } from '../../lib/api';

interface SettingsLocationsProps {
  settings?: UserSettings;
  onSave: (data: Partial<UserSettings>) => void;
  isSaving: boolean;
}

export default function SettingsLocations({ settings, onSave, isSaving }: SettingsLocationsProps) {
  const [newLocation, setNewLocation] = useState('');
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (settings?.savedLocations) {
      setLocations(settings.savedLocations);
    }
  }, [settings]);

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    if (locations.includes(newLocation.trim())) {
      alert('이 위치는 이미 추가되었습니다.');
      return;
    }
    const updated = [...locations, newLocation.trim()];
    setLocations(updated);
    setNewLocation('');
  };

  const handleDeleteLocation = (index: number) => {
    const updated = locations.filter((_, i) => i !== index);
    setLocations(updated);
  };

  const handleSave = () => {
    onSave({ savedLocations: locations });
  };

  return (
    <div className="settings-section">
      <h2>📍 저장된 위치</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        자주 사용하는 위치를 미리 등록하면 일정 생성 시 빠르게 선택할 수 있습니다.
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
            placeholder="위치 이름을 입력하세요 (예: 회의실 A)"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <button
            type="button"
            onClick={handleAddLocation}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            추가
          </button>
        </div>

        {locations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {locations.map((location, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span>📍 {location}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteLocation(index)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            저장된 위치가 없습니다. 위 입력창에서 위치를 추가하세요.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
