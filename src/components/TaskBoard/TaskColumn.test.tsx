import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { TaskColumn } from '@/components/TaskBoard/TaskColumn';
import type { TaskV2 } from '@/types';

afterEach(() => {
  cleanup();
});

describe('TaskColumn', () => {
  const baseTasks: TaskV2[] = [
    { id: 't1', title: 'Task 1', status: 'todo' } as TaskV2,
    { id: 't2', title: 'Task 2', status: 'todo' } as TaskV2,
    { id: 't3', title: 'Task 3', status: 'todo' } as TaskV2
  ];

  const renderColumn = (override: Partial<React.ComponentProps<typeof TaskColumn>> = {}) => {
    const defaultProps: React.ComponentProps<typeof TaskColumn> = {
      status: 'todo',
      title: 'To Do',
      tasks: baseTasks,
      expanded: false,
      visibleLimit: 1,
      isDropTarget: false,
      onToggleExpand: vi.fn(),
      onDragEnter: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn(),
      renderTask: task => <div data-testid={`task-${task.id}`}>{task.title}</div>
    };

    const props = { ...defaultProps, ...override };
    const view = render(<TaskColumn {...props} />);
    return { props, ...view };
  };

  it('limits rendered tasks and toggles expand button', async () => {
    const user = userEvent.setup();
    const { props } = renderColumn();

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTestId('task-t1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-t2')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: 'Показати ще 2' });
    await user.click(expandButton);
    expect(props.onToggleExpand).toHaveBeenCalledWith('todo');
  });

  it('displays all tasks when expanded and hides toggle', () => {
    renderColumn({ expanded: true });

    expect(screen.getByTestId('task-t1')).toBeInTheDocument();
    expect(screen.getByTestId('task-t2')).toBeInTheDocument();
    expect(screen.getByTestId('task-t3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Показати ще/i })).toBeNull();
  });

  it('hides expand button when all tasks already visible without expansion', () => {
    renderColumn({ visibleLimit: 5 });

    expect(screen.queryByRole('button', { name: /Показати ще/i })).toBeNull();
  });

  it('handles drag interactions and drop target styling', () => {
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    const onDrop = vi.fn();

    const { container } = renderColumn({ isDropTarget: true, onDragEnter, onDragLeave, onDrop });
    const column = container.firstChild as HTMLElement;

    expect(column).toHaveClass('board-column', 'drop-target');

    fireEvent.dragOver(column);
    expect(onDragEnter).toHaveBeenCalledWith('todo');

    fireEvent.dragLeave(column);
    expect(onDragLeave).toHaveBeenCalledTimes(1);

    fireEvent.drop(column);
    expect(onDrop).toHaveBeenCalledWith('todo');
  });
});
