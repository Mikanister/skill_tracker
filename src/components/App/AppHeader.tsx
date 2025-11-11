import React from 'react';
import { Fighter } from '@/types';

type AppHeaderProps = {
  topView: 'skills' | 'fighters';
  onTopViewChange: (view: 'skills' | 'fighters') => void;
  profile: string;
  profiles: string[];
  onSwitchProfile: (profile: string) => void;
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelectFighter: (fighterId: string | null) => void;
  onClearFighter: () => void;
  mode: 'view' | 'edit';
  onToggleMode: () => void;
  theme: string;
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  onResetToSeed: () => void;
  onClearLocalData: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  topView,
  onTopViewChange,
  profile,
  profiles,
  onSwitchProfile,
  fighters,
  selectedFighterId,
  onSelectFighter,
  onClearFighter,
  mode,
  onToggleMode,
  theme,
  onToggleTheme,
  onOpenHelp,
  onResetToSeed,
  onClearLocalData,
  onExportJson,
  onImportJson
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleProfileCreate = () => {
    const name = prompt('Назва профілю');
    if (!name) return;
    onSwitchProfile(name.trim());
  };

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onImportJson(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #eee' }}>
      <strong>SkillRPG (UA)</strong>
      <span style={{ color: '#666' }}>Локальний трекер навичок</span>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onTopViewChange('skills')} style={{ padding: '6px 10px', fontWeight: topView === 'skills' ? 700 : 400 }}>
          Навички
        </button>
        <button onClick={() => onTopViewChange('fighters')} style={{ padding: '6px 10px', fontWeight: topView === 'fighters' ? 700 : 400 }}>
          Бійці
        </button>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: '#666' }}>Профіль</label>
          <select value={profile} onChange={event => onSwitchProfile(event.target.value)} style={{ padding: '6px 8px' }}>
            {profiles.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button onClick={handleProfileCreate} style={{ padding: '6px 10px' }}>
            + Профіль
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: '#666' }}>Боєць</label>
          <select
            value={selectedFighterId ?? ''}
            onChange={event => onSelectFighter(event.target.value || null)}
            style={{ padding: '6px 8px', minWidth: 160 }}
          >
            <option value="">— не вибрано —</option>
            {fighters.map(fighter => (
              <option key={fighter.id} value={fighter.id}>
                {fighter.name}
              </option>
            ))}
          </select>
          {selectedFighterId && (
            <button onClick={onClearFighter} style={{ padding: '6px 10px' }}>
              Очистити
            </button>
          )}
        </div>

        <button onClick={onToggleMode} style={{ padding: '6px 10px' }}>
          {mode === 'view' ? 'Режим редагування' : 'Режим перегляду'}
        </button>
        <button onClick={onToggleTheme} style={{ padding: '6px 10px' }}>
          {theme === 'light' ? 'Темна тема' : 'Світла тема'}
        </button>
        <button onClick={onOpenHelp} style={{ padding: '6px 10px' }}>
          Довідка
        </button>
        <button onClick={onResetToSeed} style={{ padding: '6px 10px', background: '#fff3cd', border: '1px solid #ffe69c', borderRadius: 6 }}>
          Скинути до seed
        </button>
        <button onClick={onClearLocalData} style={{ padding: '6px 10px', background: '#ffecec', border: '1px solid #f5c2c7', borderRadius: 6 }}>
          Очистити локальні дані
        </button>
        <button onClick={onExportJson} style={{ padding: '6px 10px' }}>
          Експорт JSON
        </button>
        <label className="no-print" style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
          Імпорт JSON
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportChange}
            style={{ display: 'none' }}
          />
        </label>
        <button onClick={() => window.print()} style={{ padding: '6px 10px' }}>
          Друк
        </button>
      </div>
    </header>
  );
};
