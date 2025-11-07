import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Home from './Home';

const fighters = [{ id: 'f1', name: 'Alpha' }];
const categories = [{ id: 'c1', name: 'Cat', skills: [{ id: 's1', name: 'Skill A', levels: [], isArchived: false }] } as any];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Home', () => {
  it('shows empty state when there are no tasks', () => {
    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
    />);

    expect(screen.getByText('Поки що немає задач')).toBeTruthy();
    expect(screen.getByText('Створіть першу задачу, щоб відстежувати прогрес бійців.')).toBeTruthy();
  });

  it('renders kanban columns with tasks in correct buckets', () => {
    const tasks = [
      { id: 't1', title: 'Task todo', difficulty: 2, status: 'todo', description: '', assignees: [] },
      { id: 't2', title: 'Task progress', difficulty: 3, status: 'in_progress', description: '', assignees: [] },
      { id: 't3', title: 'Task validation', difficulty: 4, status: 'validation', description: '', assignees: [] },
      { id: 't4', title: 'Task done', difficulty: 5, status: 'done', description: '', assignees: [] }
    ];

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
    />);

    expect(screen.queryByText('Поки що немає задач')).toBeNull();
    expect(screen.getByText('To Do')).toBeTruthy();
    expect(screen.getByText('In Progress')).toBeTruthy();
    expect(screen.getByText('Validation')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();

    expect(screen.getByText('Task todo')).toBeTruthy();
    expect(screen.getByText('Task progress')).toBeTruthy();
    expect(screen.getByText('Task validation')).toBeTruthy();
    expect(screen.getByText('Task done')).toBeTruthy();
  });

  it('calls deleteTask after confirmation when delete button clicked', async () => {
    const confirmSpy = vi.fn().mockReturnValue(true);
    vi.stubGlobal('confirm', confirmSpy);
    const deleteTask = vi.fn();
    const tasks = [
      { id: 't1', title: 'Task todo', difficulty: 2, status: 'todo', description: '', assignees: [] }
    ];

    const user = userEvent.setup();

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={() => {}}
      approveTask={() => {}}
      deleteTask={deleteTask}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
    />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Видалити задачу «Task todo»' });
    await user.click(deleteButtons[0]);
    expect(confirmSpy).toHaveBeenCalledWith('Видалити задачу «Task todo»?');
    expect(deleteTask).toHaveBeenCalledWith('t1');
  });
});
