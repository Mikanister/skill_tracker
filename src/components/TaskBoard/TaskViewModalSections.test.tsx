import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  TaskDetailsSection,
  TaskHistorySection,
  TaskCommentSection
} from './TaskViewModal/Sections';
import type { TaskActivityEntry } from './taskActivity';
import type { TaskV2Status } from '@/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TaskDetailsSection', () => {
  it('propagates description, priority and difficulty changes', () => {
    const onDescriptionChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onDifficultyChange = vi.fn();

    render(
      <TaskDetailsSection
        descriptionDraft="Initial description"
        onDescriptionChange={onDescriptionChange}
        priorityDraft={false}
        onPriorityChange={onPriorityChange}
        difficultyDraft={3}
        onDifficultyChange={onDifficultyChange}
      />
    );

    const difficultySelect = screen.getByLabelText('Складність задачі');
    const descriptionArea = screen.getByPlaceholderText('Додайте опис задачі');
    const priorityCheckbox = screen.getByLabelText('Позначити як пріоритетну');

    fireEvent.change(difficultySelect, { target: { value: '4' } });
    fireEvent.change(descriptionArea, { target: { value: 'Updated description' } });
    fireEvent.click(priorityCheckbox);

    expect(onDifficultyChange).toHaveBeenCalledWith(4);
    expect(onDescriptionChange).toHaveBeenCalledWith('Updated description');
    expect(onPriorityChange).toHaveBeenCalledWith(true);
  });
});

describe('TaskHistorySection', () => {
  const statusLabels: Record<TaskV2Status, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    validation: 'Validation',
    done: 'Done',
    archived: 'Archived'
  };

  const formatDateTime = (value?: number) => (value ? `at-${value}` : '—');

  it('renders status entries with formatted labels and timestamps', () => {
    const entries: TaskActivityEntry[] = [
      {
        type: 'status',
        entry: {
          fromStatus: 'todo',
          toStatus: 'validation',
          changedAt: 123
        }
      }
    ];

    render(
      <TaskHistorySection
        activityEntries={entries}
        statusLabels={statusLabels}
        formatDateTime={formatDateTime}
      />
    );

    expect(screen.getByText('To Do →')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('at-123')).toBeInTheDocument();
  });

  it('uses "Створено" label when fromStatus is null and renders comments', () => {
    const entries: TaskActivityEntry[] = [
      {
        type: 'status',
        entry: {
          fromStatus: null,
          toStatus: 'todo',
          changedAt: undefined as unknown as number
        }
      },
      {
        type: 'comment',
        entry: {
          id: 'c1',
          author: 'Bravo',
          message: 'Looks good',
          createdAt: 999
        }
      }
    ];

    render(
      <TaskHistorySection
        activityEntries={entries}
        statusLabels={statusLabels}
        formatDateTime={formatDateTime}
      />
    );

    expect(screen.getByText('Створено →')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getAllByText('at-999')[0]).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();
  });

  it('renders empty placeholder when there are no entries', () => {
    render(
      <TaskHistorySection
        activityEntries={[]}
        statusLabels={statusLabels}
        formatDateTime={formatDateTime}
      />
    );

    expect(screen.getByText('Записів поки немає.')).toBeInTheDocument();
  });
});

describe('TaskCommentSection', () => {
  it('updates draft and calls onSubmit only when non-blank', () => {
    const onCommentChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TaskCommentSection
        commentDraft=""
        onCommentChange={onCommentChange}
        onSubmit={onSubmit}
      />
    );

    const textarea = screen.getByLabelText('Коментар по задачі');
    const submitButton = screen.getByRole('button', { name: 'Залишити коментар' });

    expect(submitButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '  New comment  ' } });
    expect(onCommentChange).toHaveBeenCalledWith('  New comment  ');

    // re-render with updated draft to simulate parent state update
    cleanup();
    render(
      <TaskCommentSection
        commentDraft="  New comment  "
        onCommentChange={onCommentChange}
        onSubmit={onSubmit}
      />
    );

    const enabledButton = screen.getByRole('button', { name: 'Залишити коментар' });
    expect(enabledButton).not.toBeDisabled();

    fireEvent.click(enabledButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
