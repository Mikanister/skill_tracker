import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FighterCard } from './FighterCard';
import type { Category, Fighter, FighterSkillLevels } from '@/types';

afterEach(() => {
  cleanup();
});

describe('FighterCard', () => {
  const categories: Category[] = [
    {
      id: 'cat1',
      name: 'Базові',
      skills: [
        { id: 'skillA', name: 'Тактика', levels: [], isArchived: false },
        { id: 'skillB', name: 'Розвідка', levels: [], isArchived: false },
        { id: 'skillC', name: 'Директорія', levels: [], isArchived: false },
        { id: 'skillD', name: 'Медицина', levels: [], isArchived: false }
      ]
    }
  ];

  const fighter: Fighter = {
    id: 'fighter1',
    name: 'Петро Петренко',
    callsign: 'Петрик',
    fullName: 'Петренко Петро Петрович',
    rank: 'Солдат'
  };

  const fighterSkillLevels: Record<string, FighterSkillLevels> = {
    fighter1: {
      skillA: 1,
      skillB: 2,
      skillC: 3,
      skillD: 1
    }
  };

  it('shows top three skills sorted by XP and badges for task summary', () => {
    const xpLedger = {
      fighter1: {
        skillA: 50,
        skillB: 200,
        skillC: 150,
        skillD: 25
      }
    };

    render(
      <FighterCard
        fighter={fighter}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={xpLedger}
        tasksSummary={{ inProgress: 2, validation: 1 }}
        onOpenProfile={() => {}}
      />
    );

    expect(screen.getByText('Розвідка')).toBeInTheDocument();
    expect(screen.getByText('Директорія')).toBeInTheDocument();
    expect(screen.getByText('Тактика')).toBeInTheDocument();
    expect(screen.queryByText('Медицина')).not.toBeInTheDocument();

    expect(screen.getByTestId('fighter-badge-in-progress-fighter1').textContent).toContain('2');
    expect(screen.getByTestId('fighter-badge-validation-fighter1').textContent).toContain('1');
  });

  it('opens profile on click and keyboard activation', async () => {
    const xpLedger = { fighter1: {} };
    const onOpen = vi.fn();
    const user = userEvent.setup();

    render(
      <FighterCard
        fighter={fighter}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={xpLedger}
        tasksSummary={{ inProgress: 0, validation: 0 }}
        onOpenProfile={onOpen}
      />
    );

    const card = screen.getByRole('button', { name: /петрик/i });

    await user.click(card);
    expect(onOpen).toHaveBeenCalledWith('fighter1');

    onOpen.mockClear();
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith('fighter1');

    onOpen.mockClear();
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(onOpen).toHaveBeenCalledWith('fighter1');
  });
});
