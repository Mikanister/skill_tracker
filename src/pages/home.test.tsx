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
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
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
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
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
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={deleteTask}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
    />);

    await user.click(screen.getByText('Task todo'));
    const deleteButtons = await screen.findAllByRole('button', { name: 'Видалити задачу «Task todo»' });
    await user.click(deleteButtons[0]);
    expect(confirmSpy).toHaveBeenCalledWith('Видалити задачу «Task todo»?');
    expect(deleteTask).toHaveBeenCalledWith('t1');
  });

  it('allows editing title and description in modal and saves changes', async () => {
    const updateDetails = vi.fn();
    const task = {
      id: 't1',
      title: 'Initial title',
      difficulty: 3,
      status: 'todo',
      description: 'Initial description',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };
    const user = userEvent.setup();

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={updateDetails}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
    />);

    await user.click(screen.getByText('Initial title'));

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const descriptionArea = screen.getByPlaceholderText('Додайте опис задачі');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.clear(descriptionArea);
    await user.type(descriptionArea, 'Updated description');
    await user.click(saveButton);

    expect(updateDetails).toHaveBeenCalledWith('t1', {
      title: 'Updated title',
      description: 'Updated description'
    });
  });

  it('disables saving when title is empty', async () => {
    const updateDetails = vi.fn();
    const task = {
      id: 't1',
      title: 'Keep title',
      difficulty: 2,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };
    const user = userEvent.setup();

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={updateDetails}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
    />);

    await user.click(screen.getByText('Keep title'));

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.clear(titleInput);

    expect(saveButton).to.have.property('disabled', true);
    expect(updateDetails).not.toHaveBeenCalled();
  });

  it('allows adding comments from modal', async () => {
    const addComment = vi.fn();
    const task = {
      id: 't1',
      title: 'Comment task',
      difficulty: 2,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };
    const user = userEvent.setup();

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
    />);

    await user.click(screen.getByText('Comment task'));

    const commentArea = await screen.findByPlaceholderText('Поділитися оновленням або рішенням по задачі');
    const commentButton = screen.getByRole('button', { name: 'Залишити коментар' });

    await user.type(commentArea, 'Great job');
    await user.click(commentButton);

    expect(addComment).toHaveBeenCalledWith('t1', 'Great job');
  });
});
