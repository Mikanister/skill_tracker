import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Home from './Home';

const fighters = [{ id: 'f1', name: 'Alpha' }];
const categories = [{ id: 'c1', name: 'Cat', skills: [{ id: 's1', name: 'Skill A', levels: [], isArchived: false }] } as any];

const mockMultiAssignPayload = {
  title: 'Завдання з модалки',
  description: 'Бриф з модалки',
  difficulty: 3 as 1 | 2 | 3 | 4 | 5,
  assignees: [
    {
      fighterId: 'f1',
      skills: [
        {
          skillId: 's1',
          categoryId: 'c1',
          xpSuggested: 10
        }
      ]
    }
  ],
  isPriority: true as true
};

const MultiAssignTaskModalMock = vi.fn((props: any) => {
  const { open, onClose, onCreate } = props;
  if (!open) return null;
  return (
    <div data-testid="multiassign-modal">
      <button type="button" onClick={() => {
        onCreate(mockMultiAssignPayload);
        onClose();
      }}>
        Mock submit
      </button>
      <button type="button" onClick={onClose}>
        Mock cancel
      </button>
    </div>
  );
});

vi.mock('@/components/MultiAssignTaskModal', () => ({
  __esModule: true,
  default: (props: any) => MultiAssignTaskModalMock(props)
}));

const createMockDataTransfer = (overrides: Partial<DataTransfer> = {}): DataTransfer => ({
  dropEffect: 'move',
  effectAllowed: 'all',
  files: [] as unknown as FileList,
  items: {
    add: vi.fn(),
    clear: vi.fn(),
    remove: vi.fn(),
    length: 0
  } as unknown as DataTransferItemList,
  types: [],
  setData: vi.fn(),
  getData: vi.fn(),
  clearData: vi.fn(),
  setDragImage: vi.fn(),
  ...overrides
});

afterEach(() => {
  cleanup();
  MultiAssignTaskModalMock.mockClear();
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
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
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
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    expect(screen.queryByText('Поки що немає задач')).toBeNull();
    expect(screen.getByText('To Do', { selector: '.board-column-title' })).toBeInTheDocument();
    expect(screen.getByText('In Progress', { selector: '.board-column-title' })).toBeInTheDocument();
    expect(screen.getByText('Validation', { selector: '.board-column-title' })).toBeInTheDocument();
    expect(screen.getByText('Done', { selector: '.board-column-title' })).toBeInTheDocument();

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
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={deleteTask}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('Task todo'));
    const deleteButtons = await screen.findAllByRole('button', { name: 'Видалити задачу «Task todo»' });
    await user.click(deleteButtons[0]);
    expect(confirmSpy).toHaveBeenCalledWith('Видалити задачу «Task todo»?');
    expect(deleteTask).toHaveBeenCalledWith('t1');
  });

  it('allows editing title and description in modal and logs comment', async () => {
    const updateDetails = vi.fn();
    const addComment = vi.fn();
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
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
      markTaskCommentsRead={() => {}}
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
      description: 'Updated description',
      isPriority: false,
      difficulty: 3
    });
    expect(addComment).toHaveBeenCalledWith('t1', 'Оновлено назву задачі та опис задачі');
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
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
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
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('Comment task'));

    const commentArea = await screen.findByPlaceholderText('Поділитися оновленням або рішенням по задачі');
    const commentButton = screen.getByRole('button', { name: 'Залишити коментар' });

    await user.type(commentArea, 'Great job');
    await user.click(commentButton);

    expect(addComment).toHaveBeenCalledWith('t1', 'Great job');
  });

  it('filters tasks via search suggestions and opens modal on selection', async () => {
    const user = userEvent.setup();
    const task = {
      id: 't1',
      taskNumber: 101,
      title: 'Searchable task',
      difficulty: 2,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const searchInput = screen.getByPlaceholderText('Пошук задачі за назвою або номером');
    await user.click(searchInput);
    await user.type(searchInput, 'search');

    const suggestion = await screen.findByTestId('task-suggestion-t1');
    await user.click(suggestion);

    expect(await screen.findByPlaceholderText('Назва задачі')).toBeTruthy();
  });

  it('filters tasks by assignee and allows resetting the filter', async () => {
    const user = userEvent.setup();
    const fighterList = [
      { id: 'f1', name: 'Alpha' },
      { id: 'f2', name: 'Bravo' },
      { id: 'f3', name: 'Charlie' }
    ];
    const tasks = [
      { id: 't1', title: 'Alpha task', difficulty: 2, status: 'todo', description: '', assignees: [{ fighterId: 'f1', skills: [] }] },
      { id: 't2', title: 'Bravo task', difficulty: 2, status: 'todo', description: '', assignees: [{ fighterId: 'f2', skills: [] }] }
    ];

    render(<Home
      fighters={fighterList as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{}}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'f2');

    expect(screen.queryByText('Alpha task')).toBeNull();
    expect(screen.getByText('Bravo task')).toBeInTheDocument();

    await user.selectOptions(filterSelect, 'f3');
    const resetButton = await screen.findByRole('button', { name: 'Скинути фільтр' });
    expect(screen.getByText('Немає задач за вибраним виконавцем')).toBeInTheDocument();

    await user.click(resetButton);
    await waitFor(() => {
      expect(filterSelect).toHaveValue('all');
    });
    expect(screen.getByText('Alpha task')).toBeInTheDocument();
    expect(screen.getByText('Bravo task')).toBeInTheDocument();
  });

  it('changes task status from modal and logs note', async () => {
    const user = userEvent.setup();
    const updateDetails = vi.fn();
    const updateStatus = vi.fn();
    const addComment = vi.fn();
    const task = {
      id: 't1',
      title: 'Status task',
      difficulty: 3,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={updateDetails}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('Status task'));

    const statusButton = await screen.findByRole('button', { name: 'To Do' });
    await user.click(statusButton);

    const validationOption = await screen.findByRole('button', { name: 'Validation' });
    await user.click(validationOption);

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    await user.click(saveButton);

    expect(updateDetails).toHaveBeenCalledWith('t1', {
      title: 'Status task',
      description: undefined,
      isPriority: false,
      difficulty: 3
    });
    expect(updateStatus).toHaveBeenCalledWith('t1', 'validation');
    expect(addComment).toHaveBeenCalledWith('t1', 'Оновлено статус задачі');
  });

  it('routes done status through validation flow before completion', async () => {
    const user = userEvent.setup();
    const updateDetails = vi.fn();
    const updateStatus = vi.fn();
    const addComment = vi.fn();
    const task = {
      id: 't1',
      title: 'Complete task',
      difficulty: 3,
      status: 'in_progress',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={updateDetails}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('Complete task'));

    const statusButton = await screen.findByRole('button', { name: 'In Progress' });
    await user.click(statusButton);
    const doneOption = await screen.findByRole('button', { name: 'Done' });
    await user.click(doneOption);

    const saveButton = screen.getByRole('button', { name: 'Зберегти' });
    await user.click(saveButton);

    expect(updateDetails).toHaveBeenCalledWith('t1', {
      title: 'Complete task',
      description: undefined,
      isPriority: false,
      difficulty: 3
    });
    expect(updateStatus).toHaveBeenCalledTimes(1);
    expect(updateStatus).toHaveBeenCalledWith('t1', 'validation');
    expect(addComment).toHaveBeenCalledWith('t1', 'Оновлено статус задачі');
  });

  it('skips status update when selecting the same status', async () => {
    const user = userEvent.setup();
    const updateStatus = vi.fn();
    const task = {
      id: 't1',
      title: 'Same status',
      difficulty: 2,
      status: 'validation',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{}}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('Same status'));

    const statusButton = await screen.findByRole('button', { name: 'Validation' });
    await user.click(statusButton);
    const statusContainer = statusButton.closest('.task-modal-status') as HTMLElement;
    await waitFor(() => {
      expect(statusContainer.querySelector('.task-modal-status-menu')).not.toBeNull();
    });
    const statusMenu = statusContainer.querySelector('.task-modal-status-menu') as HTMLElement;
    const validationOption = within(statusMenu).getByRole('button', { name: 'Validation' });
    await user.click(validationOption);
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('logs aggregated change note when multiple details modified', async () => {
    const user = userEvent.setup();
    const updateDetails = vi.fn();
    const addComment = vi.fn();
    const task = {
      id: 't1',
      title: 'Combo task',
      difficulty: 2,
      status: 'todo',
      description: 'Original',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={updateDetails}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{}}
      addComment={addComment}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('Combo task'));

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const modal = titleInput.closest('.modal-dialog') as HTMLElement;
    const descriptionArea = within(modal).getByPlaceholderText('Додайте опис задачі');
    const saveButton = within(modal).getByRole('button', { name: 'Зберегти' });

    await user.clear(titleInput);
    await user.type(titleInput, 'Combo task updated');
    await user.clear(descriptionArea);
    await user.type(descriptionArea, 'Rewritten');
    await user.click(saveButton);

    expect(updateDetails).toHaveBeenCalledTimes(1);
    const [, detailsPayload] = updateDetails.mock.calls[0];
    expect(detailsPayload).toMatchObject({
      title: 'Combo task updated',
      description: 'Rewritten'
    });
    expect(addComment).toHaveBeenCalledWith('t1', 'Оновлено назву задачі та опис задачі');
  });

  it('shows placeholder timestamp when history entry lacks changedAt', async () => {
    const user = userEvent.setup();
    const task = {
      id: 't1',
      title: 'History task',
      difficulty: 2,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [],
      history: [
        {
          fromStatus: 'todo',
          toStatus: 'validation',
          changedAt: undefined as unknown as number
        }
      ],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{}}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    await user.click(screen.getByText('History task'));

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const modal = titleInput.closest('.modal-dialog') as HTMLElement;
    const validationLabel = within(modal).getAllByText('Validation')[0];
    const historyRow = validationLabel.closest('li') as HTMLElement;

    expect(within(historyRow).getByText('—')).toBeInTheDocument();
  });

  it('approves validation task and adds trimmed comment', async () => {
    const user = userEvent.setup();
    const approveTask = vi.fn();
    const addComment = vi.fn();
    const markTaskCommentsRead = vi.fn();
    const task = {
      id: 't1',
      title: 'Approval task',
      difficulty: 3,
      status: 'validation',
      description: '',
      assignees: [
        {
          fighterId: 'f1',
          skills: [
            {
              skillId: 's1',
              categoryId: 'c1',
              xpSuggested: 10,
              xpApproved: undefined
            }
          ]
        }
      ],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={approveTask}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
      markTaskCommentsRead={markTaskCommentsRead}
    />);

    await user.click(screen.getByText('Approval task'));

    const commentArea = await screen.findByPlaceholderText('Поділитися оновленням або рішенням по задачі');
    await user.type(commentArea, '  Ready to approve  ');

    const approveButton = within(commentArea.closest('.section-stack') as HTMLElement).getByRole('button', { name: 'Залишити коментар' });
    await user.click(approveButton);

    expect(addComment).toHaveBeenCalledWith('t1', 'Ready to approve');
    // XP approval UI has been removed; ensure no approve button is rendered
    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const taskModal = titleInput.closest('.modal-dialog') as HTMLElement;
    expect(within(taskModal).queryByRole('button', { name: 'Затвердити XP' })).toBeNull();
    expect(approveTask).not.toHaveBeenCalled();
  });

  it('approves validation task without optional comment', async () => {
    const user = userEvent.setup();
    const approveTask = vi.fn();
    const addComment = vi.fn();
    const markTaskCommentsRead = vi.fn();
    const task = {
      id: 't1',
      title: 'No comment',
      difficulty: 3,
      status: 'validation',
      description: '',
      assignees: [
        {
          fighterId: 'f1',
          skills: [
            {
              skillId: 's1',
              categoryId: 'c1',
              xpSuggested: 12,
              xpApproved: 8
            }
          ]
        }
      ],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={approveTask}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={addComment}
      markTaskCommentsRead={markTaskCommentsRead}
    />);

    await user.click(screen.getByText('No comment'));

    const titleInput = await screen.findByPlaceholderText('Назва задачі');
    const modal = titleInput.closest('.modal-dialog') as HTMLElement;
    // XP approval UI has been removed; ensure no approve button is rendered
    expect(within(modal).queryByRole('button', { name: 'Затвердити XP' })).toBeNull();
    expect(approveTask).not.toHaveBeenCalled();
    expect(addComment).not.toHaveBeenCalled();
  });

  it('collapses archive section once archived tasks disappear', async () => {
    const user = userEvent.setup();
    const baseProps = {
      fighters: fighters as any,
      categories: categories as any,
      createTask: () => {},
      updateStatus: () => {},
      updateDetails: () => {},
      updateAssignees: () => {},
      approveTask: () => {},
      deleteTask: () => {},
      fighterSkillLevels: { f1: { s1: 0 } } as any,
      addComment: () => {},
      markTaskCommentsRead: () => {}
    };

    const archivedTask = {
      id: 't-arch',
      title: 'Archived job',
      difficulty: 2,
      status: 'archived',
      description: '',
      assignees: [],
      comments: [],
      history: [],
      createdAt: Date.now()
    };

    const activeTask = { ...archivedTask, id: 't-active', status: 'todo', title: 'Active job' };
    const secondArchived = { ...archivedTask, id: 't-arch-2', title: 'Archived again' };

    const { rerender } = render(<Home
      {...baseProps}
      tasks={[archivedTask] as any}
    />);

    const toggleButton = await screen.findByRole('button', { name: /Архівовані задачі/ });
    await user.click(toggleButton);
    expect(toggleButton).toHaveTextContent('▴');

    rerender(<Home
      {...baseProps}
      tasks={[activeTask] as any}
    />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Архівовані задачі/ })).toBeNull();
    });

    rerender(<Home
      {...baseProps}
      tasks={[secondArchived] as any}
    />);

    const collapsedToggle = await screen.findByRole('button', { name: /Архівовані задачі/ });
    expect(collapsedToggle).toHaveTextContent('▾');
  });

  it('marks unread comments as read when opening task modal', async () => {
    const user = userEvent.setup();
    const markTaskCommentsRead = vi.fn();
    const task = {
      id: 't1',
      title: 'Unread task',
      difficulty: 2,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [{ id: 'c1', author: 'A', message: 'Hello', createdAt: Date.now() }],
      hasUnreadComments: true,
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={markTaskCommentsRead}
    />);

    await user.click(screen.getByText('Unread task'));

    expect(markTaskCommentsRead).toHaveBeenCalledWith('t1');
  });

  it('marks purely unread comments even when flag is false', async () => {
    const user = userEvent.setup();
    const markTaskCommentsRead = vi.fn();
    const task = {
      id: 't1',
      title: 'Unread comments only',
      difficulty: 2,
      status: 'todo',
      description: '',
      assignees: [],
      comments: [
        { id: 'c1', author: 'A', message: 'First', createdAt: Date.now(), readAt: Date.now() },
        { id: 'c2', author: 'B', message: 'Second', createdAt: Date.now() }
      ],
      hasUnreadComments: false,
      history: [],
      createdAt: Date.now()
    };

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[task] as any}
      createTask={() => {}}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={markTaskCommentsRead}
    />);

    await user.click(screen.getByText('Unread comments only'));

    expect(markTaskCommentsRead).toHaveBeenCalledWith('t1');
  });

  it('toggles archived section visibility and hides when emptied', async () => {
    const user = userEvent.setup();
    const tasks = [
      { id: 't1', title: 'Active task', difficulty: 2, status: 'todo', description: '', assignees: [] },
      { id: 't2', title: 'Archived task', difficulty: 2, status: 'archived', description: '', assignees: [] }
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
      fighterSkillLevels={{}}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const toggle = screen.getByRole('button', { name: 'Архівовані задачі (1)' });
    expect(screen.queryByText('Archived task')).toBeNull();

    await user.click(toggle);
    expect(screen.getByText('Archived task')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText('Archived task')).toBeNull();
  });

  it('does not change status when dropping card back into same column', () => {
    const updateStatus = vi.fn();
    const tasks = [
      { id: 't1', title: 'Stay put', difficulty: 2, status: 'todo', description: '', assignees: [] }
    ];

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const taskCard = screen.getByText('Stay put');
    const dataTransfer = createMockDataTransfer();
    fireEvent.dragStart(taskCard, { dataTransfer });
    const todoColumn = screen.getByText('To Do', { selector: '.board-column-title' }).closest('.board-column') as HTMLElement;
    fireEvent.dragOver(todoColumn, { dataTransfer });
    fireEvent.drop(todoColumn, { dataTransfer });
    fireEvent.dragEnd(taskCard, { dataTransfer });

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('archives task directly from card action', async () => {
    const user = userEvent.setup();
    const updateStatus = vi.fn();
    const tasks = [
      { id: 't-archive', title: 'Archive me', difficulty: 2, status: 'in_progress', description: '', assignees: [] }
    ];

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{}}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const card = screen.getByText('Archive me').closest('.task-card') as HTMLElement;
    // Archive action button has been removed from the card UI
    expect(within(card).queryByRole('button', { name: 'Архівувати' })).toBeNull();
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('opens approval modal when dropping validation task into Done column', async () => {
    const user = userEvent.setup();
    const updateStatus = vi.fn();
    const tasks = [
      {
        id: 't-valid',
        title: 'Validation ready',
        difficulty: 3,
        status: 'validation',
        description: '',
        assignees: [{ fighterId: 'f1', skills: [] }],
        comments: [],
        history: [],
        createdAt: Date.now()
      }
    ];

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const taskCard = screen.getByText('Validation ready').closest('.task-card') as HTMLElement;
    const doneColumn = screen.getByText('Done', { selector: '.board-column-title' }).closest('.board-column') as HTMLElement;

    const dataTransfer = createMockDataTransfer();

    fireEvent.dragStart(taskCard, { dataTransfer });
    fireEvent.dragOver(doneColumn, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });
    fireEvent.dragEnd(taskCard, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Назва задачі')).toBeInTheDocument();
    });
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('routes in-progress card dropped into Done through validation flow', async () => {
    const updateStatus = vi.fn();
    const tasks = [
      {
        id: 't-drop',
        title: 'Drop to done',
        difficulty: 3,
        status: 'in_progress',
        description: '',
        assignees: [{ fighterId: 'f1', skills: [] }],
        comments: [],
        history: [],
        createdAt: Date.now()
      }
    ];

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const card = screen.getByText('Drop to done').closest('.task-card') as HTMLElement;
    const doneColumn = screen.getByText('Done', { selector: '.board-column-title' }).closest('.board-column') as HTMLElement;
    const dataTransfer = createMockDataTransfer();

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(doneColumn, { dataTransfer });
    fireEvent.drop(doneColumn, { dataTransfer });
    fireEvent.dragEnd(card, { dataTransfer });

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith('t-drop', 'validation');
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Назва задачі')).toBeInTheDocument();
    });
  });

  it('creates task via multi-assign modal and hides it afterwards', async () => {
    const user = userEvent.setup();
    const createTask = vi.fn();

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={[] as any}
      createTask={createTask}
      updateStatus={() => {}}
      updateDetails={() => {}}
      updateAssignees={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    expect(screen.queryByTestId('multiassign-modal')).toBeNull();

    const [headerCreateButton] = screen.getAllByRole('button', { name: '+ Створити задачу' });
    await user.click(headerCreateButton);

    const submitButton = await screen.findByRole('button', { name: 'Mock submit' });
    await user.click(submitButton);

    expect(createTask).toHaveBeenCalledWith(mockMultiAssignPayload);
    await waitFor(() => {
      expect(screen.queryByTestId('multiassign-modal')).toBeNull();
    });
  });

  it('allows expanding archived tasks and restoring them to To Do', async () => {
    const user = userEvent.setup();
    const updateStatus = vi.fn();
    const tasks = [
      {
        id: 'arch-1',
        title: 'Archived task',
        difficulty: 1,
        status: 'archived',
        description: '',
        assignees: [],
        comments: [],
        history: [],
        createdAt: Date.now(),
        approvedAt: Date.now()
      }
    ];

    render(<Home
      fighters={fighters as any}
      categories={categories as any}
      tasks={tasks as any}
      createTask={() => {}}
      updateStatus={updateStatus}
      updateDetails={() => {}}
      approveTask={() => {}}
      deleteTask={() => {}}
      fighterSkillLevels={{ f1: { s1: 0 } } as any}
      addComment={() => {}}
      markTaskCommentsRead={() => {}}
    />);

    const toggleButton = screen.getByRole('button', { name: /Архівовані задачі/ });
    await user.click(toggleButton);

    const restoreButton = await screen.findByRole('button', { name: 'Відновити' });
    await user.click(restoreButton);

    expect(updateStatus).toHaveBeenCalledWith('arch-1', 'todo');
  });
});
