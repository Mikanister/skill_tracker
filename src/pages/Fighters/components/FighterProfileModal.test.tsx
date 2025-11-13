import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Category, Fighter, FighterSkillLevels, TaskV2, TaskV2Status } from '@/types';
import { FighterProfileModal } from './FighterProfileModal';

const taskStatusLabels: Record<TaskV2Status, string> = {
  todo: 'У черзі',
  in_progress: 'В роботі',
  validation: 'На перевірці',
  done: 'Завершено',
  archived: 'Архів'
};

const fighter: Fighter = {
  id: 'fighter-1',
  name: 'Петро Петренко',
  fullName: 'Петренко Петро Петрович',
  callsign: 'Петрик',
  rank: 'Сержант',
  position: 'Командир відділення',
  unit: '1 ОМБр',
  notes: 'Потребує нагадування про щотижневі тренування.'
};

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Тактичні навички',
    skills: [
      { id: 'skill-1', name: 'Розвідка', levels: [], isArchived: false },
      { id: 'skill-2', name: 'Медицина', levels: [], isArchived: false }
    ]
  }
];

const fighterSkillLevels: Record<string, FighterSkillLevels> = {
  'fighter-1': {
    'skill-1': 3,
    'skill-2': 0
  }
};

const xpLedger = {
  'fighter-1': {
    'skill-1': 240,
    'skill-2': 0
  }
};

const tasks: TaskV2[] = [
  {
    id: 'task-1',
    title: 'Оборона позиції',
    description: '',
    difficulty: 3,
    assignees: [],
    status: 'done',
    createdAt: 1,
    approvedAt: 2,
    history: [],
    comments: []
  }
];

const recentTasks: TaskV2[] = [
  {
    id: 'task-2',
    title: 'Патрулювання сектору',
    description: '',
    difficulty: 2,
    assignees: [],
    status: 'in_progress',
    createdAt: 3,
    history: [],
    comments: []
  }
];

afterEach(() => {
  cleanup();
});

describe('FighterProfileModal', () => {
  it('renders fighter profile details and toggles category collapse', async () => {
    const user = userEvent.setup();

    const Wrapper: React.FC = () => {
      const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
      return (
        <FighterProfileModal
          open
          fighter={fighter}
          categories={categories}
          fighterSkillLevels={fighterSkillLevels}
          xpLedger={xpLedger}
          tasks={tasks}
          recentTasks={recentTasks}
          taskStatusSummary={{ todo: 1, in_progress: 2, validation: 0, done: 3, archived: 0 }}
          activeSkillCount={1}
          totalXp={240}
          taskStatusLabels={taskStatusLabels}
          formatDateTime={value => (value ? `at-${value}` : '—')}
          search=""
          collapsed={collapsed}
          onToggleCategory={categoryId => setCollapsed(prev => ({ ...prev, [categoryId]: !prev[categoryId] }))}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          onNavigate={vi.fn()}
          onSearchChange={vi.fn()}
        />
      );
    };

    render(<Wrapper />);

    expect(screen.getByText('Профіль: Петрик')).toBeInTheDocument();
    expect(screen.getByText('Загальна інформація')).toBeInTheDocument();
    expect(screen.getByText('Активні скіли:')).toBeInTheDocument();
    expect(screen.getByText(/Накопичено XP:/)).toBeInTheDocument();

    expect(screen.getByText('Розвідка')).toBeInTheDocument();
    expect(screen.getByText('lvl 3')).toBeInTheDocument();
    expect(screen.getByText('Не призначено')).toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: 'Згорнути' });
    await user.click(toggleButton);
    expect(screen.getByRole('button', { name: 'Розгорнути' })).toBeInTheDocument();
    expect(screen.queryByText('Розвідка')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Розгорнути' }));
    expect(screen.getByText('Розвідка')).toBeInTheDocument();
  });

  it('fires navigation, delete, search, close and toggle callbacks', async () => {
    const user = userEvent.setup();

    const onClose = vi.fn();
    const onDelete = vi.fn();
    const onNavigate = vi.fn();
    const onSearchChange = vi.fn();
    const onToggleCategory = vi.fn();

    render(
      <FighterProfileModal
        open
        fighter={fighter}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={xpLedger}
        tasks={tasks}
        recentTasks={recentTasks}
        taskStatusSummary={{ todo: 1, in_progress: 2, validation: 0, done: 3, archived: 0 }}
        activeSkillCount={1}
        totalXp={240}
        taskStatusLabels={taskStatusLabels}
        formatDateTime={value => (value ? `at-${value}` : '—')}
        search=""
        collapsed={{}}
        onToggleCategory={onToggleCategory}
        onClose={onClose}
        onDelete={onDelete}
        onNavigate={onNavigate}
        onSearchChange={onSearchChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Наступний →' }));
    expect(onNavigate).toHaveBeenCalledWith('next');

    await user.click(screen.getByRole('button', { name: '← Попередній' }));
    expect(onNavigate).toHaveBeenCalledWith('prev');

    await user.click(screen.getByRole('button', { name: 'Видалити' }));
    expect(onDelete).toHaveBeenCalledTimes(1);

    const searchInput = screen.getByPlaceholderText('Пошук скіла');
    await user.type(searchInput, 'мед');
    expect(onSearchChange.mock.calls.map(call => call[0])).toEqual(['м', 'е', 'д']);

    await user.click(screen.getByRole('button', { name: 'Згорнути' }));
    expect(onToggleCategory).toHaveBeenCalledWith('cat-1');

    await user.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
