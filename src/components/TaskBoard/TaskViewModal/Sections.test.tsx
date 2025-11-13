import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';

import {
  TaskDetailsSection,
  TaskHistorySection,
  TaskCommentSection
} from '@/components/TaskBoard/TaskViewModal/Sections';
import type { TaskActivityEntry } from '@/components/TaskBoard/taskActivity';
import type { TaskV2Status } from '@/types';

afterEach(() => {
  cleanup();
});

describe('TaskViewModal Sections', () => {
  it('edits task details via inputs', async () => {
    const user = userEvent.setup();

    const Wrapper: React.FC = () => {
      const [description, setDescription] = React.useState('Initial description');
      const [priority, setPriority] = React.useState(false);
      const [difficulty, setDifficulty] = React.useState<1 | 2 | 3 | 4 | 5>(3);

      return (
        <TaskDetailsSection
          descriptionDraft={description}
          onDescriptionChange={setDescription}
          priorityDraft={priority}
          onPriorityChange={setPriority}
          difficultyDraft={difficulty}
          onDifficultyChange={setDifficulty}
        />
      );
    };

    render(<Wrapper />);

    const section = screen.getByText('Основна інформація').closest('section') as HTMLElement;
    const difficultySelect = within(section).getByRole('combobox');
    await user.selectOptions(difficultySelect, '5');
    expect(difficultySelect).toHaveValue('5');

    const descriptionArea = within(section).getByPlaceholderText('Додайте опис задачі');
    await user.clear(descriptionArea);
    await user.type(descriptionArea, 'Updated');
    expect(descriptionArea).toHaveValue('Updated');

    const priorityCheckbox = within(section).getByLabelText('Позначити як пріоритетну');
    await user.click(priorityCheckbox);
    expect(priorityCheckbox).toBeChecked();
  });

  it('renders activity history entries and empty placeholder', () => {
    const entries: TaskActivityEntry[] = [
      {
        type: 'status',
        entry: {
          fromStatus: null,
          toStatus: 'in_progress',
          changedAt: 100
        }
      },
      {
        type: 'comment',
        entry: {
          id: 'comment-1',
          author: 'Team Lead',
          message: 'Reviewed',
          createdAt: 200
        }
      }
    ];

    const statusLabels: Record<TaskV2Status, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      validation: 'Validation',
      done: 'Done',
      archived: 'Archived'
    };

    const formatDateTime = vi.fn(value => (value ? `ts-${value}` : '—'));

    const { rerender } = render(
      <TaskHistorySection
        activityEntries={entries}
        statusLabels={statusLabels}
        formatDateTime={formatDateTime}
      />
    );

    expect(screen.getByText('Створено →')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('ts-100')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText('ts-200')).toBeInTheDocument();

    rerender(
      <TaskHistorySection
        activityEntries={[]}
        statusLabels={statusLabels}
        formatDateTime={formatDateTime}
      />
    );

    expect(screen.getByText('Записів поки немає.')).toBeInTheDocument();
  });

  it('controls comment input and submit availability', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    const Wrapper: React.FC<{ initial?: string }> = ({ initial = '  ' }) => {
      const [draft, setDraft] = React.useState(initial);
      return (
        <TaskCommentSection
          commentDraft={draft}
          onCommentChange={value => setDraft(value)}
          onSubmit={handleSubmit}
        />
      );
    };

    const { rerender } = render(<Wrapper />);

    const textarea = screen.getByLabelText('Коментар по задачі');
    const submitButton = screen.getByRole('button', { name: 'Залишити коментар' });
    expect(submitButton).toBeDisabled();

    await user.type(textarea, 'Progress updated');
    expect(textarea).toHaveValue('  Progress updated');
    expect(submitButton).not.toBeDisabled();

    rerender(<Wrapper initial="Ready" />);

    const submitReady = screen.getByRole('button', { name: 'Залишити коментар' });
    expect(submitReady).not.toBeDisabled();
    await user.click(submitReady);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
