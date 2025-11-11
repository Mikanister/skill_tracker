import React from 'react';
import clsx from 'clsx';
import { Fighter } from '@/types';

export type AssigneeSelectorProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filteredFighters: Fighter[];
  selectedFighters: Record<string, boolean>;
  onToggleFighter: (fighterId: string, checked: boolean) => void;
};

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  search,
  onSearchChange,
  filteredFighters,
  selectedFighters,
  onToggleFighter
}) => (
  <section className="multiassign-section">
    <div className="skills-header">
      <strong className="text-md text-strong" style={{ flex: 1 }}>Виконавці</strong>
      <input
        placeholder="Пошук бійця"
        value={search}
        onChange={event => onSearchChange(event.target.value)}
        className="search-input"
        style={{ width: 220 }}
      />
    </div>
    <div className="multiassign-assignee-list">
      {filteredFighters.length === 0 ? (
        <span className="text-sm text-muted" style={{ fontStyle: 'italic' }}>Бійців не знайдено</span>
      ) : (
        filteredFighters.map(fighter => (
          <label
            key={fighter.id}
            className={clsx('multiassign-assignee-item', {
              'is-selected': selectedFighters[fighter.id]
            })}
          >
            <input
              type="checkbox"
              checked={!!selectedFighters[fighter.id]}
              onChange={event => onToggleFighter(fighter.id, event.target.checked)}
            />
            <span className="text-sm text-strong">{fighter.callsign || fighter.fullName || fighter.name}</span>
          </label>
        ))
      )}
    </div>
  </section>
);
