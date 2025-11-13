import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TaskListItem } from './TaskListItem';
import type { Task } from '@/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  text: 'Задача',
  done: false,
  difficulty: 3,
  description: 'Опис',
  ...overrides
});

describe('TaskListItem', () => {
  it('renders task text, difficulty and toggles done via checkbox', () => {
    const onToggle = vi.fn();

    render(
      <TaskListItem
        task={buildTask()}
        mode="edit"
        isFirst={false}
        isLast={false}
        onToggle={onToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    const textNode = screen.getByText(/Задача · ⚙️3/);

    expect(checkbox).not.toBeChecked();
    expect(textNode).toHaveStyle({ textDecoration: 'none' });

    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('strikes through text when task is done', () => {
    render(
      <TaskListItem
        task={buildTask({ done: true })}
        mode="edit"
        isFirst={false}
        isLast={false}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    );

    const textNode = screen.getByText(/Задача · ⚙️3/);
    expect(textNode).toHaveStyle({ textDecoration: 'line-through' });
  });

  it('invokes edit on text click only in edit mode', () => {
    const onEdit = vi.fn();

    const { rerender } = render(
      <TaskListItem
        task={buildTask()}
        mode="edit"
        isFirst={false}
        isLast={false}
        onToggle={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    );

    const textNode = screen.getByText(/Задача · ⚙️3/);
    fireEvent.click(textNode);
    expect(onEdit).toHaveBeenCalledTimes(1);

    rerender(
      <TaskListItem
        task={buildTask()}
        mode="view"
        isFirst={false}
        isLast={false}
        onToggle={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    );

    const textNodeView = screen.getByText(/Задача · ⚙️3/);
    fireEvent.click(textNodeView);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders action buttons only in edit mode and respects first/last flags', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    const { rerender } = render(
      <TaskListItem
        task={buildTask()}
        mode="edit"
        isFirst={true}
        isLast={false}
        onToggle={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );

    const editButton = screen.getByRole('button', { name: 'Редагувати' });
    const deleteButton = screen.getByRole('button', { name: 'Видалити' });
    const upButton = screen.getByRole('button', { name: '↑' });
    const downButton = screen.getByRole('button', { name: '↓' });

    expect(upButton).toBeDisabled();
    expect(downButton).not.toBeDisabled();

    fireEvent.click(editButton);
    fireEvent.click(deleteButton);
    fireEvent.click(upButton);
    fireEvent.click(downButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    // up is disabled for first item
    expect(onMoveUp).not.toHaveBeenCalled();
    expect(onMoveDown).toHaveBeenCalledTimes(1);

    rerender(
      <TaskListItem
        task={buildTask()}
        mode="edit"
        isFirst={false}
        isLast={true}
        onToggle={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );

    const upButton2 = screen.getByRole('button', { name: '↑' });
    const downButton2 = screen.getByRole('button', { name: '↓' });
    expect(upButton2).not.toBeDisabled();
    expect(downButton2).toBeDisabled();

    fireEvent.click(upButton2);
    fireEvent.click(downButton2);

    expect(onMoveUp).toHaveBeenCalledTimes(1);
    // down is disabled for last item, counter should still be 1
    expect(onMoveDown).toHaveBeenCalledTimes(1);

    rerender(
      <TaskListItem
        task={buildTask()}
        mode="view"
        isFirst={false}
        isLast={false}
        onToggle={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );

    expect(screen.queryByRole('button', { name: 'Редагувати' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Видалити' })).toBeNull();
  });
});
