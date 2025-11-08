import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Fighters from './Fighters';

const categories = [
  {
    id: 'cat1',
    name: 'Підготовка',
    skills: [
      { id: 'skill1', name: 'Тактика', levels: [], isArchived: false },
      { id: 'skill2', name: 'Медицина', levels: [], isArchived: false }
    ]
  }
] as any;

const baseProps = {
  addFighter: () => {},
  deleteFighter: () => {}
};

describe('Fighters page', () => {
  it('groups fighters by unit when toggle enabled', async () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' },
      { id: 'f2', name: 'Браво', callsign: 'Браво', unit: '2 ОМБр' }
    ];
    const fighterSkillLevels = {
      f1: { skill1: 1, skill2: 0 },
      f2: { skill1: 0, skill2: 0 }
    } as any;

    render(
      <Fighters
        fighters={fighters as any}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={{ f1: {}, f2: {} }}
        {...baseProps}
      />
    );

    const checkbox = screen.getByLabelText('Групувати за підрозділом');
    expect(screen.queryByText('1 ОМБр')).toBeNull();
    await userEvent.click(checkbox);
    expect(screen.getByText('1 ОМБр')).toBeTruthy();
    expect(screen.getByText('2 ОМБр')).toBeTruthy();
  });

  it('shows status badges for fighter tasks', () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' }
    ];
    const fighterSkillLevels = { f1: { skill1: 0, skill2: 0 } } as any;
    const tasks = [
      { id: 't1', title: 'Робота', status: 'in_progress', assignees: [{ fighterId: 'f1', skills: [] }] },
      { id: 't2', title: 'Перевірка', status: 'validation', assignees: [{ fighterId: 'f1', skills: [] }] }
    ];

    render(
      <Fighters
        fighters={fighters as any}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={{ f1: {} }}
        tasks={tasks as any}
        {...baseProps}
      />
    );

    expect(screen.getByTestId('fighter-badge-in-progress-f1').textContent).toContain('1');
    expect(screen.getByTestId('fighter-badge-validation-f1').textContent).toContain('1');
  });
});
