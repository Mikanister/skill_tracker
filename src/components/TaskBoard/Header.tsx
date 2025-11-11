import React from 'react';
import { Fighter } from '@/types';

export type TaskBoardHeaderProps = {
  fighters: Fighter[];
  selectedFighterId: string | null;
  onSelectFighter: (id: string | null) => void;
  onCreateClick: () => void;
};

export const TaskBoardHeader: React.FC<TaskBoardHeaderProps> = ({ fighters, selectedFighterId, onSelectFighter, onCreateClick }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <label>Боєць:</label>
    <select
      value={selectedFighterId ?? ''}
      onChange={event => onSelectFighter(event.target.value || null)}
      style={{ padding: '6px 8px' }}
    >
      <option value="">— не вибрано —</option>
      {fighters.map(fighter => (
        <option key={fighter.id} value={fighter.id}>
          {fighter.name}
        </option>
      ))}
    </select>
    <button onClick={onCreateClick} disabled={!selectedFighterId}>
      + Створити задачу
    </button>
  </div>
);
