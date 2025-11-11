import React from 'react';
import { Level, Mode } from '@/types';

type LevelHeaderProps = {
  level: Level;
  mode: Mode;
  onRename: () => void;
};

export const LevelHeader: React.FC<LevelHeaderProps> = ({ level, mode, onRename }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <strong>
      Рівень {level.level}: {level.title}
    </strong>
    {mode === 'edit' && (
      <button onClick={onRename} style={{ padding: '4px 8px' }}>
        Перейменувати
      </button>
    )}
  </div>
);
