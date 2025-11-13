import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkillBoard } from '@/components/MultiAssignTaskModal/SkillBoard';
import { Category, Fighter, FighterSkillLevels, TaskV2 } from '@/types';

afterEach(() => {
  cleanup();
});

describe('SkillBoard', () => {
  const categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Support',
      skills: [
        { id: 'skill-1', name: 'Medical', description: '', levels: [] },
        { id: 'skill-2', name: 'Logistics', description: '', levels: [] }
      ]
    }
  ];

  const baseFighter: Fighter = {
    id: 'fighter-1',
    name: 'Fallback Name',
    fullName: 'Full Name',
    unit: '',
    status: 'active',
    specialization: '',
    createdAt: 1
  } as Fighter;

  const tasks: TaskV2[] = [];

  it('renders selected skills with xp controls and calls handlers', async () => {
    const onToggleSkill = vi.fn();
    const onSetSkillXp = vi.fn();
    const user = userEvent.setup();

    render(
      <SkillBoard
        categories={categories}
        selectedFighters={[{ ...baseFighter, callsign: undefined }]}
        assigneeSkills={{ 'fighter-1': { 'skill-1': 5 } }}
        fighterSkillLevels={{ 'fighter-1': { 'skill-1': 3 } } as Record<string, FighterSkillLevels>}
        tasks={tasks}
        difficulty={3}
        title="Task title"
        onToggleSkill={onToggleSkill}
        onSetSkillXp={onSetSkillXp}
        allFightersCount={2}
      />
    );

    expect(screen.getByText('Full Name')).toBeInTheDocument();
    const xpInput = screen.getByDisplayValue('5') as HTMLInputElement;
    fireEvent.change(xpInput, { target: { value: '7' } });
    expect(onSetSkillXp).toHaveBeenCalledWith('fighter-1', 'skill-1', 7);

    const checkbox = screen.getByLabelText('Medical');
    await user.click(checkbox);
    expect(onToggleSkill).toHaveBeenCalledWith('fighter-1', 'skill-1', false);

    expect(screen.getByTitle(/анти-експлойт/i)).toBeInTheDocument();
  });

  it('shows skill level badges and defaults to zero when not selected', async () => {
    const onToggleSkill = vi.fn();
    const user = userEvent.setup();

    render(
      <SkillBoard
        categories={categories}
        selectedFighters={[{ ...baseFighter, callsign: undefined, fullName: '', name: 'Only Name' }]}
        assigneeSkills={{}}
        fighterSkillLevels={{}}
        tasks={tasks}
        difficulty={2}
        title="New task"
        onToggleSkill={onToggleSkill}
        onSetSkillXp={vi.fn()}
        allFightersCount={1}
      />
    );

    expect(screen.getByText('Only Name')).toBeInTheDocument();
    const levelBadges = screen.getAllByText(/lvl\s+0/);
    expect(levelBadges.length).toBeGreaterThan(0);
    expect(screen.queryByText(/XP$/i)).not.toBeInTheDocument();

    const logisticsCheckbox = screen.getByLabelText('Logistics');
    await user.click(logisticsCheckbox);
    expect(onToggleSkill).toHaveBeenCalledWith('fighter-1', 'skill-2', true);
  });

  it('prefers fighter callsign and shows existing skill levels', () => {
    render(
      <SkillBoard
        categories={categories}
        selectedFighters={[{ ...baseFighter, id: 'fighter-2', callsign: 'Viper', fullName: 'Victor', name: 'Victor' }]}
        assigneeSkills={{}}
        fighterSkillLevels={{ 'fighter-2': { 'skill-1': 4 } } as Record<string, FighterSkillLevels>}
        tasks={tasks}
        difficulty={3}
        title="Recon"
        onToggleSkill={vi.fn()}
        onSetSkillXp={vi.fn()}
        allFightersCount={2}
      />
    );

    expect(screen.getByText('Viper')).toBeInTheDocument();
    expect(screen.getByText('lvl 4')).toBeInTheDocument();
  });

  it('renders empty hint when no fighters selected', () => {
    render(
      <SkillBoard
        categories={categories}
        selectedFighters={[]}
        assigneeSkills={{}}
        fighterSkillLevels={{}}
        tasks={tasks}
        difficulty={3}
        title="Task"
        onToggleSkill={vi.fn()}
        onSetSkillXp={vi.fn()}
        allFightersCount={3}
      />
    );

    expect(screen.getByText('Додайте хоча б одного виконавця, щоб призначати навички.')).toBeInTheDocument();
  });
});
