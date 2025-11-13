import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Skills from './Skills';

const baseActions = {
  addSkill: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  addCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
  moveSkillToCategory: vi.fn()
};

const createMockDataTransfer = (): DataTransfer => {
  const store: Record<string, string> = {};
  const typesStore: string[] = [];

  const setData = vi.fn<DataTransfer['setData']>((format, value) => {
    store[format] = value;
    if (!typesStore.includes(format)) {
      typesStore.push(format);
    }
  });

  const getData = vi.fn<DataTransfer['getData']>(format => store[format] ?? '');

  const clearData = vi.fn<DataTransfer['clearData']>((format?: string) => {
    if (!format) {
      typesStore.splice(0, typesStore.length);
      Object.keys(store).forEach(key => delete store[key]);
      return;
    }

    delete store[format];
    const index = typesStore.indexOf(format);
    if (index >= 0) {
      typesStore.splice(index, 1);
    }
  });

  return {
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [] as unknown as FileList,
    items: {
      length: 0,
      add: vi.fn(),
      clear: vi.fn(),
      remove: vi.fn(),
      [Symbol.iterator]: function* () {
        return;
      }
    } as unknown as DataTransferItemList,
    types: typesStore as readonly string[],
    setData,
    getData,
    clearData,
    setDragImage: vi.fn()
  } as DataTransfer;
};

describe('Skills page', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('opens skill detail modal with statistics when card clicked', async () => {
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [
          { id: 'skill1', name: 'Тактика', description: 'Опис навички' }
        ]
      }
    ] as any;

    const fighters = [
      { id: 'f1', name: 'Петро', callsign: 'Патріот', unit: '1 ОМБр' },
      { id: 'f2', name: 'Іван', callsign: 'Сокіл', unit: '2 ОМБр' }
    ];

    const fighterSkillLevels = {
      f1: { skill1: 2 },
      f2: { skill1: 3 }
    } as any;

    const { rerender } = render(
      <Skills
        categories={categories}
        fighters={fighters as any}
        fighterSkillLevels={fighterSkillLevels}
        {...baseActions}
      />
    );

    await userEvent.click(screen.getByText('Тактика'));

    expect(await screen.findByText('Навичка: Тактика')).toBeTruthy();
    expect(screen.getByDisplayValue('Тактика')).toBeTruthy();
    expect(screen.getByDisplayValue('Опис навички')).toBeTruthy();
    expect(screen.getByText('Бійців володіє')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Середній рівень')).toBeTruthy();
    expect(screen.getByText('lvl 3')).toBeTruthy();

    rerender(<div />); // close portal remnants between tests
  });

  it('shows empty state when category has no skills', () => {
    const categories = [
      {
        id: 'cat-empty',
        name: 'Порожня',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    expect(screen.getByText('У цій категорії поки немає навичок')).toBeTruthy();
    expect(screen.getByTestId('empty-add-skill')).toBeTruthy();
  });

  it('filters skills by search query', async () => {
    const user = userEvent.setup();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [
          { id: 'skill1', name: 'Тактика', description: 'Опис' },
          { id: 'skill2', name: 'Маскування', description: 'Стелс' }
        ]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    const searchInput = screen.getByPlaceholderText('Пошук навички');
    await user.type(searchInput, 'маск');

    expect(screen.getByText('Маскування')).toBeInTheDocument();
    expect(screen.queryByText('Тактика')).not.toBeInTheDocument();
  });

  it('adds a new skill via modal when form is valid', async () => {
    const user = userEvent.setup();
    const addSkill = vi.fn();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        addSkill={addSkill}
        updateSkill={vi.fn()}
        deleteSkill={vi.fn()}
        addCategory={vi.fn()}
        renameCategory={vi.fn()}
        deleteCategory={vi.fn()}
        moveSkillToCategory={vi.fn()}
      />
    );

    const addSkillButton = screen
      .getAllByRole('button', { name: '+ Додати навичку' })
      .find(button => button.classList.contains('btn-primary'));
    expect(addSkillButton).toBeDefined();
    await user.click(addSkillButton!);
    const nameInput = await screen.findByLabelText('Назва');
    await user.type(nameInput, 'Новий курс');
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(addSkill).toHaveBeenCalledWith('cat1', 'Новий курс');
    });
  });

  it('updates an existing skill from view modal', async () => {
    const user = userEvent.setup();
    const updateSkill = vi.fn();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [{ id: 'skill1', name: 'Тактика', description: 'Опис' }]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        addSkill={vi.fn()}
        updateSkill={updateSkill}
        deleteSkill={vi.fn()}
        addCategory={vi.fn()}
        renameCategory={vi.fn()}
        deleteCategory={vi.fn()}
        moveSkillToCategory={vi.fn()}
      />
    );

    await user.click(screen.getByText('Тактика'));
    const nameInput = await screen.findByLabelText('Назва');
    await user.clear(nameInput);
    await user.type(nameInput, 'Тактика 2');
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(updateSkill).toHaveBeenCalledWith(expect.objectContaining({
        id: 'skill1',
        name: 'Тактика 2'
      }));
    });
  });

  it('deletes skill after confirmation from view modal', async () => {
    const user = userEvent.setup();
    const deleteSkill = vi.fn();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [{ id: 'skill1', name: 'Тактика', description: 'Опис' }]
      }
    ] as any;

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        addSkill={vi.fn()}
        updateSkill={vi.fn()}
        deleteSkill={deleteSkill}
        addCategory={vi.fn()}
        renameCategory={vi.fn()}
        deleteCategory={vi.fn()}
        moveSkillToCategory={vi.fn()}
      />
    );

    await user.click(screen.getByText('Тактика'));
    await screen.findByText('Навичка: Тактика');
    await user.click(screen.getByRole('button', { name: 'Видалити' }));

    expect(window.confirm).toHaveBeenCalledWith('Видалити навичку «Тактика»?');
    await waitFor(() => {
      expect(deleteSkill).toHaveBeenCalledWith('skill1');
    });
  });

  it('allows creating and renaming categories via modal', async () => {
    const user = userEvent.setup();
    const addCategory = vi.fn();
    const renameCategory = vi.fn();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        addSkill={vi.fn()}
        updateSkill={vi.fn()}
        deleteSkill={vi.fn()}
        addCategory={addCategory}
        renameCategory={renameCategory}
        deleteCategory={vi.fn()}
        moveSkillToCategory={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: '+ Нова категорія' }));
    const nameInput = await screen.findByLabelText('Назва категорії');
    await user.type(nameInput, 'Розвідка');
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(addCategory).toHaveBeenCalledWith('Розвідка');
    });

    await user.click(screen.getByLabelText('Редагувати категорію «Категорія»'));
    const editInput = await screen.findByLabelText('Назва категорії');
    await user.clear(editInput);
    await user.type(editInput, 'Категорія 2');
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() => {
      expect(renameCategory).toHaveBeenCalledWith('cat1', 'Категорія 2');
    });
  });

  it('deletes category after confirmation from modal', async () => {
    const user = userEvent.setup();
    const deleteCategory = vi.fn();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: []
      }
    ] as any;

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        addSkill={vi.fn()}
        updateSkill={vi.fn()}
        deleteSkill={vi.fn()}
        addCategory={vi.fn()}
        renameCategory={vi.fn()}
        deleteCategory={deleteCategory}
        moveSkillToCategory={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText('Редагувати категорію «Категорія»'));
    await screen.findByLabelText('Назва категорії');
    await user.click(screen.getByRole('button', { name: 'Видалити категорію' }));

    expect(confirmSpy).toHaveBeenCalledWith('Видалити категорію «Категорія»? Всі навички в ній також будуть видалені.');
    await waitFor(() => {
      expect(deleteCategory).toHaveBeenCalledWith('cat1');
    });
  });

  it('moves skill to another category via drag and drop', async () => {
    const user = userEvent.setup();
    const moveSkillToCategory = vi.fn();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія 1',
        skills: [{ id: 'skill1', name: 'Тактика', description: '' }]
      },
      {
        id: 'cat2',
        name: 'Категорія 2',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        addSkill={vi.fn()}
        updateSkill={vi.fn()}
        deleteSkill={vi.fn()}
        addCategory={vi.fn()}
        renameCategory={vi.fn()}
        deleteCategory={vi.fn()}
        moveSkillToCategory={moveSkillToCategory}
      />
    );

    const skillCard = screen.getByRole('button', { name: /Тактика/ });
    const targetCategoryButton = screen
      .getAllByRole('button', { name: /Категорія 2/ })
      .find(element => element.classList.contains('skills-category-btn')) as HTMLButtonElement | undefined;

    expect(targetCategoryButton).toBeDefined();
    const categoryButton = targetCategoryButton!;

    const dataTransfer = createMockDataTransfer();
    fireEvent.dragStart(skillCard, { dataTransfer });
    fireEvent.dragOver(categoryButton, { dataTransfer });
    fireEvent.drop(categoryButton, { dataTransfer });
    fireEvent.dragEnd(skillCard);

    await waitFor(() => {
      expect(moveSkillToCategory).toHaveBeenCalledWith('skill1', 'cat2');
    });
  });

  it('shows fallback stats when no fighters own the skill', async () => {
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [
          { id: 'skill1', name: 'Тактика', description: 'Опис навички' }
        ]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    await userEvent.click(screen.getByText('Тактика'));

    expect(await screen.findByText('Навичка: Тактика')).toBeTruthy();
    expect(screen.getByText('Поки що немає даних')).toBeInTheDocument();
    expect(screen.getByText('Ніхто не володіє цією навичкою.')).toBeInTheDocument();
  });

  it('highlights drop target category during drag over', async () => {
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія 1',
        skills: [{ id: 'skill1', name: 'Тактика', description: '' }]
      },
      {
        id: 'cat2',
        name: 'Категорія 2',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    const skillCard = screen.getByRole('button', { name: /Тактика/ });
    const targetButton = screen
      .getAllByRole('button', { name: /Категорія 2/ })
      .find(element => element.classList.contains('skills-category-btn')) as HTMLButtonElement | undefined;

    expect(targetButton).toBeDefined();
    const categoryButton = targetButton!;
    const dataTransfer = createMockDataTransfer();

    dataTransfer.setData('text/plain', 'skill1');
    fireEvent.dragStart(skillCard, { dataTransfer });
    expect(categoryButton.classList.contains('is-drop-target')).toBe(false);

    fireEvent.dragOver(categoryButton, { dataTransfer });
    await waitFor(() => {
      expect(categoryButton.classList.contains('is-drop-target')).toBe(true);
    });

    fireEvent.dragLeave(categoryButton, { dataTransfer });
    await waitFor(() => {
      expect(categoryButton.classList.contains('is-drop-target')).toBe(false);
    });

    fireEvent.dragEnd(skillCard, { dataTransfer });
  });

  it('opens create skill modal from header button', async () => {
    const user = userEvent.setup();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: []
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    const addButton = screen
      .getAllByRole('button', { name: '+ Додати навичку' })
      .find(button => button.closest('.skills-header'));
    expect(addButton).toBeDefined();
    await user.click(addButton!);

    expect(await screen.findByLabelText('Назва')).toBeInTheDocument();
  });

  it('displays usage count and max level on skill cards', async () => {
    const fighters = [
      { id: 'f1', name: 'Alpha' },
      { id: 'f2', name: 'Bravo' }
    ];
    const fighterSkillLevels = {
      f1: { skill1: 3 },
      f2: { skill1: 5 }
    } as any;
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [{ id: 'skill1', name: 'Тактика', description: '' }]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={fighters as any}
        fighterSkillLevels={fighterSkillLevels}
        {...baseActions}
      />
    );

    const usageChip = await screen.findByText('Бійців: 2');
    expect(usageChip).toBeInTheDocument();
    expect(screen.getByText('Макс. рівень 5')).toBeInTheDocument();
  });

  it('marks skill card as dragging when drag starts', () => {
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [{ id: 'skill1', name: 'Тактика', description: '' }]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    const skillCard = screen.getByRole('button', { name: /Тактика/ });
    expect(skillCard.classList.contains('is-dragging')).toBe(false);

    fireEvent.dragStart(skillCard, { dataTransfer: createMockDataTransfer() });
    expect(skillCard.classList.contains('is-dragging')).toBe(true);

    fireEvent.dragEnd(skillCard, { dataTransfer: createMockDataTransfer() });
    expect(skillCard.classList.contains('is-dragging')).toBe(false);
  });

  it('switches categories via sidebar and updates visible skills', async () => {
    const user = userEvent.setup();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія 1',
        skills: [
          { id: 'skill1', name: 'Тактика', description: '' },
          { id: 'skill2', name: 'Маскування', description: '' }
        ]
      },
      {
        id: 'cat2',
        name: 'Категорія 2',
        skills: [{ id: 'skill3', name: 'Стрілець', description: '' }]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    const cat1Button = screen
      .getAllByRole('button', { name: /Категорія 1/ })
      .find(element => element.classList.contains('skills-category-btn'))!;
    expect(cat1Button.classList.contains('is-selected')).toBe(true);
    expect(screen.getByText('Тактика')).toBeInTheDocument();
    expect(screen.getByText('Маскування')).toBeInTheDocument();

    const categoryButtons = screen.getAllByRole('button', { name: /Категорія 2/ });
    const targetButton = categoryButtons.find(button => button.classList.contains('skills-category-btn'))!;
    await user.click(targetButton);

    expect(targetButton.classList.contains('is-selected')).toBe(true);
    expect(cat1Button.classList.contains('is-selected')).toBe(false);
    expect(screen.getByText('Стрілець')).toBeInTheDocument();
    expect(screen.queryByText('Тактика')).not.toBeInTheDocument();
  });

  it('updates header skill count when filtering via search', async () => {
    const user = userEvent.setup();
    const categories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [
          { id: 'skill1', name: 'Тактика', description: '' },
          { id: 'skill2', name: 'Маскування', description: '' }
        ]
      }
    ] as any;

    render(
      <Skills
        categories={categories}
        fighters={[] as any}
        fighterSkillLevels={{}}
        {...baseActions}
      />
    );

    expect(screen.getByText('2 навичок у категорії')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Пошук навички');
    await user.type(searchInput, 'маск');

    expect(await screen.findByText('Маскування')).toBeInTheDocument();
    expect(screen.queryByText('Тактика')).not.toBeInTheDocument();
    expect(screen.getByText('1 навичок у категорії')).toBeInTheDocument();

    await user.clear(searchInput);
    expect(await screen.findByText('2 навичок у категорії')).toBeInTheDocument();
  });
});
