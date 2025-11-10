import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Skills from './Skills';

const baseActions = {
  addSkill: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  addCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
  moveSkillToCategory: vi.fn()
};

describe('Skills page', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens skill detail modal with statistics when card clicked', async () => {
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [
          { id: 'skill1', name: 'Тактика', description: 'Опис навички' }
        ]
      }
    ] as any;

    const fighters = [
      { id: 'f1', name: 'Петро', callsign: 'Патріот', unit: '1 ОМБр' },
      { id: 'f2', name: 'Іван', callsign: 'Сокіл', unit: '2 ОМБр' }
    ];

    const fighterSkillLevels = {
      f1: { skill1: 2 },
      f2: { skill1: 3 }
    } as any;

    const { rerender } = render(
      <Skills
        categories={categories}
        fighters={fighters as any}
        fighterSkillLevels={fighterSkillLevels}
        {...baseActions}
      />
    );

    await userEvent.click(screen.getByText('Тактика'));

    expect(await screen.findByText('Навичка: Тактика')).toBeTruthy();
    expect(screen.getByDisplayValue('Тактика')).toBeTruthy();
    expect(screen.getByDisplayValue('Опис навички')).toBeTruthy();
    expect(screen.getByText('Бійців володіє')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Середній рівень')).toBeTruthy();
    expect(screen.getByText('lvl 3')).toBeTruthy();

    rerender(<div />); // close portal remnants between tests
  });

  it('shows empty state when category has no skills', () => {
    const categories = [
      {
        id: 'cat-empty',
        name: 'Порожня',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    expect(screen.getByText('У цій категорії поки немає навичок')).toBeTruthy();
    expect(screen.getByTestId('empty-add-skill')).toBeTruthy();
  });
});
