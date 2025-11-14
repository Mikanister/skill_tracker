import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TaskModal } from './TaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import MultiAssignTaskModal from './MultiAssignTaskModal';
import { TaskViewModal } from '@/components/TaskBoard/TaskViewModal';
import {
  Category,
  Fighter,
  FighterSkillLevels,
  FighterSkills,
  Skill,
  TaskV2,
  TaskV2Status
} from '@/types';

const sampleSkill = (id: string, name: string): Skill => ({
  id,
  name,
  levels: [
    {
      level: 1,
      title: 'Level 1',
      tasks: []
    }
  ]
});

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Спостереження',
    skills: [sampleSkill('skill-1', 'Спостереження I'), sampleSkill('skill-2', 'Навігація')]
  }
];

const fighter: Fighter = {
  id: 'fighter-1',
  name: 'Alpha',
  fullName: 'Alpha Bravo',
  callsign: 'Alpha'
};

const fighterSkills: Record<string, FighterSkills> = {
  [fighter.id]: {
    'skill-1': true,
    'skill-2': true
  }
};

const fighterSkillLevels: Record<string, FighterSkillLevels> = {
  [fighter.id]: {
    'skill-1': 2,
    'skill-2': 1
  }
};

const statusLabels: Record<TaskV2Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  validation: 'Validation',
  done: 'Done',
  archived: 'Archived'
};

const sampleTask: TaskV2 = {
  id: 'task-1',
  taskNumber: 101,
  title: 'Task Example',
  description: 'Original desc',
  difficulty: 3,
  status: 'todo',
  assignees: [
    {
      fighterId: fighter.id,
      skills: [
        {
          skillId: 'skill-1',
          categoryId: 'cat-1',
          xpSuggested: 10,
          xpApproved: 5
        }
      ]
    }
  ],
  comments: [],
  history: [],
  createdAt: Date.now()
};

const skillIndex = new Map<string, { name: string; categoryId: string }>([
  ['skill-1', { name: 'Спостереження I', categoryId: 'cat-1' }]
]);

const renderTaskViewModal = (overrides: {
  task?: TaskV2;
  onClose?: () => void;
  onDelete?: (taskId: string) => void;
  onSaveDetails?: (taskId: string, payload: any) => void;
  onAddComment?: (taskId: string, message: string) => void;
  onStatusChange?: (task: TaskV2, status: TaskV2Status) => void;
  onUpdateAssignees?: (taskId: string, fighterIds: string[]) => void;
} = {}) => {
  const {
    task = sampleTask,
    onClose = vi.fn(),
    onDelete = vi.fn(),
    onSaveDetails = vi.fn(),
    onAddComment = vi.fn(),
    onStatusChange = vi.fn(),
    onUpdateAssignees = vi.fn()
  } = overrides;

  const Wrapper: React.FC = () => {
    const [approved, setApproved] = React.useState<Record<string, Record<string, number>>>({});
    const [commentDraft, setCommentDraft] = React.useState('');
    const [titleDraft, setTitleDraft] = React.useState('');
    const [descriptionDraft, setDescriptionDraft] = React.useState('');
    const [priorityDraft, setPriorityDraft] = React.useState(false);

    return (
      <TaskViewModal
        task={task}
        fighters={[fighter]}
        tasks={[task]}
        skillIndex={skillIndex}
        approved={approved}
        setApproved={setApproved}
        commentDraft={commentDraft}
        setCommentDraft={setCommentDraft}
        titleDraft={titleDraft}
        setTitleDraft={setTitleDraft}
        descriptionDraft={descriptionDraft}
        setDescriptionDraft={setDescriptionDraft}
        priorityDraft={priorityDraft}
        setPriorityDraft={setPriorityDraft}
        onClose={onClose}
        onDelete={onDelete}
        onSaveDetails={onSaveDetails}
        onUpdateAssignees={onUpdateAssignees}
        onAddComment={onAddComment}
        onStatusChange={onStatusChange}
        statusLabels={statusLabels}
        formatDateTime={() => 'formatted'}
      />
    );
  };

  const user = userEvent.setup();
  return {
    user,
    onClose,
    onDelete,
    onSaveDetails,
    onAddComment,
    onStatusChange,
    ...render(<Wrapper />)
  };
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TaskModal', () => {
  it('disables save while title is empty and triggers save with trimmed values', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<TaskModal open onClose={onClose} onSave={onSave} />);

    const saveButton = screen.getByRole('button', { name: /зберегти/i });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Назва'), '  Нова задача  ');
    await user.type(screen.getByLabelText('Опис'), 'Деталі по завданню');
    await user.selectOptions(screen.getByLabelText('Складність'), '4');

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({
      text: 'Нова задача',
      description: 'Деталі по завданню',
      difficulty: 4,
      done: false
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CreateTaskModal', () => {
  it('requires title and skill selection before creating new task', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreate = vi.fn();

    render(
      <CreateTaskModal
        open
        onClose={onClose}
        fighter={fighter}
        categories={categories}
        fighterSkills={fighterSkills}
        onCreate={onCreate}
      />
    );

    const createButton = screen.getByRole('button', { name: /створити/i });

    await user.click(createButton);
    expect(screen.getByText('Вкажіть назву задачі.')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Опишіть задачу'), ' Розвідка позицій ');
    await user.clear(screen.getByLabelText('XP за задачу'));
    await user.type(screen.getByLabelText('XP за задачу'), '12');

    await user.click(createButton);
    expect(screen.getByText('Оберіть хоча б одну навичку.')).toBeInTheDocument();

    const skillCheckbox = await screen.findByLabelText(/спостереження i/i);
    await user.click(skillCheckbox);

    await user.click(createButton);

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      title: 'Розвідка позицій',
      description: '',
      difficulty: 3,
      links: [
        {
          skillId: 'skill-1',
          categoryId: 'cat-1',
          xp: 12
        }
      ]
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MultiAssignTaskModal', () => {
  it('validates assignee selection and submits composed payload', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreate = vi.fn();

    const { container } = render(
      <MultiAssignTaskModal
        open
        onClose={onClose}
        fighters={[fighter]}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={onCreate}
      />
    );

    const submitButton = screen.getByRole('button', { name: /створити задачу/i });
    const titleInput = screen.getByPlaceholderText('Вкажіть назву');
    expect(submitButton).toBeDisabled();

    await user.type(titleInput, 'Патрулювання території');
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(screen.getByText('Оберіть виконавців та додайте їм навички.')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/alpha/i));

    await waitFor(() => {
      expect(container.querySelector('.multiassign-skill-line input[type="checkbox"]')).toBeTruthy();
    });
    const skillCheckbox = container.querySelector('.multiassign-skill-line input[type="checkbox"]') as HTMLInputElement;
    await user.click(skillCheckbox);

    await user.click(submitButton);

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      title: 'Патрулювання території',
      assignees: [
        {
          fighterId: fighter.id,
          skills: [expect.objectContaining({ skillId: 'skill-1' })]
        }
      ]
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Оберіть виконавців та додайте їм навички.')).not.toBeInTheDocument();
    expect(titleInput).toHaveValue('');
    expect(submitButton).toBeDisabled();
  });

  it('clears validation error when modal is closed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MultiAssignTaskModal
        open
        onClose={onClose}
        fighters={[fighter]}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', { name: /створити задачу/i });

    await user.type(screen.getByPlaceholderText('Вкажіть назву'), 'Розвідка');
    await user.click(submitButton);
    expect(await screen.findByText('Оберіть виконавців та додайте їм навички.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /скасувати/i }));

    await waitFor(() => {
      expect(screen.queryByText('Оберіть виконавців та додайте їм навички.')).not.toBeInTheDocument();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('TaskViewModal', () => {
  it('saves details and triggers status change when status updated', async () => {
    const onSaveDetails = vi.fn();
    const onStatusChange = vi.fn();
    const { user } = renderTaskViewModal({ onSaveDetails, onStatusChange });

    await screen.findByPlaceholderText('Назва задачі');

    const statusButton = screen.getByRole('button', { name: 'To Do' });
    await user.click(statusButton);

    const validationOption = await screen.findByRole('button', { name: 'Validation' });
    await user.click(validationOption);

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);

    expect(onSaveDetails).toHaveBeenCalledWith('task-1', expect.objectContaining({
      title: 'Task Example',
      description: 'Original desc',
      isPriority: false,
      difficulty: 3,
      changeNotes: expect.arrayContaining(['статус задачі'])
    }));
    expect(onStatusChange).toHaveBeenCalledWith(sampleTask, 'validation');
  });

  it('submits new comment and clears draft', async () => {
    const onAddComment = vi.fn();
    const { user } = renderTaskViewModal({ onAddComment });

    await screen.findByPlaceholderText('Назва задачі');
    const commentArea = await screen.findByPlaceholderText('Поділитися оновленням або рішенням по задачі');

    await user.type(commentArea, 'New update');
    await user.click(screen.getByRole('button', { name: 'Залишити коментар' }));

    expect(onAddComment).toHaveBeenCalledWith('task-1', 'New update');
    await waitFor(() => {
      expect(commentArea).toHaveValue('');
    });
  });

  it('prevents saving when title becomes empty', async () => {
    const onSaveDetails = vi.fn();
    const { user } = renderTaskViewModal({ onSaveDetails });

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.clear(titleInput);

    expect(saveButton).toBeDisabled();
    expect(onSaveDetails).not.toHaveBeenCalled();
  });

  it('initialises approved XP map from assignee data', async () => {
    const task: TaskV2 = {
      ...sampleTask,
      assignees: [
        {
          fighterId: fighter.id,
          skills: [
            {
              skillId: 'skill-1',
              categoryId: 'cat-1',
              xpSuggested: 12,
              xpApproved: 18
            }
          ]
        },
        {
          fighterId: 'fighter-2',
          skills: [
            {
              skillId: 'skill-2',
              categoryId: 'cat-1',
              xpSuggested: 7,
              xpApproved: undefined
            }
          ]
        }
      ]
    };

    const setApproved = vi.fn();

    render(<TaskViewModal
      task={task}
      fighters={[fighter, { id: 'fighter-2', name: 'Bravo', fullName: 'Bravo', callsign: 'BR' }]}
      tasks={[task]}
      skillIndex={new Map([['skill-1', { name: 'Спостереження I', categoryId: 'cat-1' }], ['skill-2', { name: 'Навігація', categoryId: 'cat-1' }]])}
      approved={{}}
      setApproved={setApproved}
      commentDraft=""
      setCommentDraft={vi.fn()}
      titleDraft={task.title}
      setTitleDraft={vi.fn()}
      descriptionDraft={task.description ?? ''}
      setDescriptionDraft={vi.fn()}
      priorityDraft={false}
      setPriorityDraft={vi.fn()}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onSaveDetails={vi.fn()}
      onUpdateAssignees={vi.fn()}
      onAddComment={vi.fn()}
      onStatusChange={vi.fn()}
      onApproveTask={vi.fn()}
      statusLabels={statusLabels}
      formatDateTime={() => 'formatted'}
    />);

    await waitFor(() => {
      expect(setApproved).toHaveBeenCalledWith({
        [fighter.id]: { 'skill-1': 18 },
        'fighter-2': { 'skill-2': 7 }
      });
    });
  });

  it('does not delete when confirmation is rejected', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDelete = vi.fn();
    const { user } = renderTaskViewModal({ onDelete });

    await screen.findByPlaceholderText('Назва задачі');
    const deleteButton = screen.getByRole('button', { name: 'Видалити задачу «Task Example»' });

    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Видалити задачу «Task Example»?');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('captures description, priority, and difficulty changes in save payload', async () => {
    const onSaveDetails = vi.fn();
    const { user } = renderTaskViewModal({ onSaveDetails });

    const descriptionArea = await screen.findByPlaceholderText('Додайте опис задачі');
    const priorityCheckbox = screen.getByLabelText('Позначити як пріоритетну');
    const difficultySelect = screen.getByLabelText('Складність задачі');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.clear(descriptionArea);
    await user.type(descriptionArea, 'Updated description');
    await user.click(priorityCheckbox);
    await user.selectOptions(difficultySelect, '4');
    expect(difficultySelect).toHaveValue('4');

    await user.click(saveButton);

    expect(onSaveDetails).toHaveBeenCalledWith('task-1', expect.objectContaining({
      description: 'Updated description',
      isPriority: true,
      difficulty: 4,
      changeNotes: expect.arrayContaining(['опис задачі', 'складність задачі'])
    }));
  });

  it('closes status menu on outside click', async () => {
    const { user } = renderTaskViewModal();

    await screen.findByPlaceholderText('Назва задачі');

    await user.click(screen.getByRole('button', { name: 'To Do' }));
    expect(screen.getByRole('button', { name: 'In Progress' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'In Progress' })).not.toBeInTheDocument();
    });
  });

  it('records title change without triggering status change', async () => {
    const onSaveDetails = vi.fn();
    const onStatusChange = vi.fn();
    const { user } = renderTaskViewModal({ onSaveDetails, onStatusChange });

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.type(titleInput, ' updated');
    await user.click(saveButton);

    expect(onSaveDetails).toHaveBeenCalledWith('task-1', expect.objectContaining({
      title: 'Task Example updated',
      changeNotes: expect.arrayContaining(['назву задачі'])
    }));
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('renders task history and comment activity entries', async () => {
    const historyTask: TaskV2 = {
      ...sampleTask,
      status: 'validation',
      history: [{ fromStatus: 'todo', toStatus: 'done', changedAt: 1700000000000 }],
      comments: [{ id: 'c1', author: 'Bravo', message: 'Looks good', createdAt: 1700000001000 }]
    };

    renderTaskViewModal({ task: historyTask });

    expect(await screen.findByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();
    expect(screen.queryByText('Записів поки немає.')).toBeNull();
  });

  it('confirms deletion before calling onDelete', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDelete = vi.fn();
    const { user } = renderTaskViewModal({ onDelete });

    await screen.findByPlaceholderText('Назва задачі');

    const deleteButton = screen.getByRole('button', { name: 'Видалити задачу «Task Example»' });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Видалити задачу «Task Example»?');
    expect(onDelete).toHaveBeenCalledWith('task-1');
  });

  it('initialises drafts with defaults when task fields missing', async () => {
    const sparseTask: TaskV2 = {
      ...sampleTask,
      description: undefined,
      difficulty: undefined,
      assignees: [
        {
          fighterId: fighter.id,
          skills: [
            {
              skillId: 'skill-1',
              categoryId: 'cat-1',
              xpSuggested: 7,
              xpApproved: undefined
            }
          ]
        }
      ]
    };

    const { rerender } = renderTaskViewModal({ task: sampleTask });

    expect(await screen.findByPlaceholderText('Назва задачі')).toHaveValue('Task Example');
    expect(screen.getByPlaceholderText('Додайте опис задачі')).toHaveValue('Original desc');

    rerender(<></>);

    renderTaskViewModal({ task: sparseTask });

    const descriptionArea = await screen.findByPlaceholderText('Додайте опис задачі');
    expect(descriptionArea).toHaveValue('');
    expect(screen.getByLabelText('Складність задачі')).toHaveValue('3');

    const statusToggle = screen.getByRole('button', { name: 'To Do' });
    await userEvent.click(statusToggle);
    await userEvent.click(screen.getByRole('button', { name: 'Validation' }));
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
  });

  it('does not submit comment when message is blank after trimming', async () => {
    const onAddComment = vi.fn();
    const { user } = renderTaskViewModal({ onAddComment });

    const commentArea = await screen.findByPlaceholderText('Поділитися оновленням або рішенням по задачі');
    await user.type(commentArea, '   ');
    await user.click(screen.getByRole('button', { name: 'Залишити коментар' }));

    expect(onAddComment).not.toHaveBeenCalled();
  });
});
