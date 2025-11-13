import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Fighters from './Fighters';

const categories = [
  {
    id: 'cat1',
    name: 'Підготовка',
    skills: [
      { id: 'skill1', name: 'Тактика', levels: [], isArchived: false },
      { id: 'skill2', name: 'Медицина', levels: [], isArchived: false }
    ]
  }
] as any;

const baseProps = {
  addFighter: () => {},
  deleteFighter: () => {},
  tasks: [] as any
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Fighters page', () => {
  it('groups fighters by unit when toggle enabled', async () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' },
      { id: 'f2', name: 'Браво', callsign: 'Браво', unit: '2 ОМБр' }
    ];
    const fighterSkillLevels = {
      f1: { skill1: 1, skill2: 0 },
      f2: { skill1: 0, skill2: 0 }
    } as any;

    render(
      <Fighters
        {...baseProps}
        fighters={fighters as any}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={{ f1: {}, f2: {} }}
      />
    );

    const checkbox = screen.getByLabelText('Групувати за підрозділом');
    expect(screen.queryByText('1 ОМБр')).toBeNull();
    await userEvent.click(checkbox);
    expect(screen.getByText('1 ОМБр')).toBeTruthy();
    expect(screen.getByText('2 ОМБр')).toBeTruthy();
  });

  it('shows status badges for fighter tasks', () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' }
    ];
    const fighterSkillLevels = { f1: { skill1: 0, skill2: 0 } } as any;
    const tasks = [
      { id: 't1', title: 'Робота', status: 'in_progress', assignees: [{ fighterId: 'f1', skills: [] }] },
      { id: 't2', title: 'Перевірка', status: 'validation', assignees: [{ fighterId: 'f1', skills: [] }] }
    ];

    render(
      <Fighters
        {...baseProps}
        fighters={fighters as any}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={{ f1: {} }}
        tasks={tasks as any}
      />
    );

    expect(screen.getByTestId('fighter-badge-in-progress-f1').textContent).toContain('1');
    expect(screen.getByTestId('fighter-badge-validation-f1').textContent).toContain('1');
  });

  it('renders top three skills for fighter based on XP ledger', () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' }
    ];
    const fighterSkillLevels = {
      f1: { skill1: 3, skill2: 2, skill3: 4, skill4: 1 }
    } as any;
    const extendedCategories = [
      {
        id: 'cat1',
        name: 'Категорія',
        skills: [
          { id: 'skill1', name: 'Аналітика', levels: [], isArchived: false },
          { id: 'skill2', name: 'Швидкість', levels: [], isArchived: false },
          { id: 'skill3', name: 'Логістика', levels: [], isArchived: false },
          { id: 'skill4', name: 'Медицина', levels: [], isArchived: false }
        ]
      }
    ] as any;

    render(
      <Fighters
        {...baseProps}
        fighters={fighters as any}
        categories={extendedCategories}
        fighterSkillLevels={fighterSkillLevels}
        xpLedger={{ f1: { skill1: 100, skill2: 250, skill3: 150, skill4: 50 } }}
      />
    );

    const skillChips = screen.getAllByText(/Аналітика|Швидкість|Логістика|Медицина/);
    const texts = skillChips.map(node => node.textContent);
    expect(texts).toContain('Швидкість');
    expect(texts).toContain('Логістика');
    expect(texts).toContain('Аналітика');
    expect(texts).not.toContain('Медицина');
  });

  it('filters fighters by search query and shows empty state when no matches', async () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' },
      { id: 'f2', name: 'Браво', callsign: 'Браво', unit: '2 ОМБр' }
    ];

    render(
      <Fighters
        {...baseProps}
        fighters={fighters as any}
        categories={categories}
        fighterSkillLevels={{} as any}
        xpLedger={{} as any}
      />
    );

    const searchInput = screen.getByPlaceholderText('Пошук бійця');
    await userEvent.type(searchInput, 'Бра');

    expect(screen.queryByText('Альфа')).toBeNull();
    expect(screen.getByText('Браво')).toBeTruthy();

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'zzz');

    expect(await screen.findByText('Не знайдено бійців')).toBeInTheDocument();
  });

  it('opens create fighter modal, validates required fields, and submits new fighter', async () => {
    const addFighter = vi.fn();
    const user = userEvent.setup();

    render(
      <Fighters
        {...baseProps}
        fighters={[] as any}
        categories={categories}
        fighterSkillLevels={{} as any}
        xpLedger={{} as any}
        addFighter={addFighter}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: '+ Додати бійця' });
    expect(addButtons).not.toHaveLength(0);
    await user.click(addButtons[0]);

    const createButton = await screen.findByRole('button', { name: 'Створити' });
    await user.click(createButton);

    const pibErrors = await screen.findAllByText('Вкажіть ПІБ');
    expect(pibErrors.length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText("Прізвище Ім'я По батькові"), 'Петро Петренко');
    await user.type(screen.getByPlaceholderText('Позивний'), 'Петрик');
    await user.type(screen.getByPlaceholderText('Звання'), 'Сержант');
    await user.type(screen.getByPlaceholderText('Посада'), 'Командир відділення');
    await user.type(screen.getByPlaceholderText('Підрозділ'), '1 ОМБр');

    await user.click(createButton);

    expect(addFighter).toHaveBeenCalledTimes(1);
    const [displayName, levelsArg, metaArg] = addFighter.mock.calls[0];
    expect(displayName).toBe('Петрик');
    expect(levelsArg).toMatchObject({ skill1: 0, skill2: 0 });
    expect(metaArg).toEqual({
      fullName: 'Петро Петренко',
      callsign: 'Петрик',
      rank: 'Сержант',
      position: 'Командир відділення',
      unit: '1 ОМБр',
      notes: ''
    });

    await waitFor(() => {
      expect(screen.queryByText('Створити бійця')).toBeNull();
    });
  });

  it('opens profile modal, navigates between fighters, and deletes with confirmation', async () => {
    const fighters = [
      { id: 'f1', name: 'Альфа', callsign: 'Альфа', unit: '1 ОМБр' },
      { id: 'f2', name: 'Браво', callsign: 'Браво', unit: '2 ОМБр' }
    ];
    const deleteFighter = vi.fn();
    const confirmSpy = vi.fn().mockReturnValue(true);
    vi.stubGlobal('confirm', confirmSpy);
    const user = userEvent.setup();

    render(
      <Fighters
        {...baseProps}
        fighters={fighters as any}
        categories={categories}
        fighterSkillLevels={{ f1: {}, f2: {} } as any}
        xpLedger={{} as any}
        deleteFighter={deleteFighter}
      />
    );

    await user.click(screen.getAllByText('Альфа')[0]);

    expect(await screen.findByText('Профіль: Альфа')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Наступний →' }));
    expect(await screen.findByText('Профіль: Браво')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Видалити' }));
    expect(confirmSpy).toHaveBeenCalledWith('Видалити бійця «Браво»?');
    expect(deleteFighter).toHaveBeenCalledWith('f2');

    await waitFor(() => {
      expect(screen.queryByText('Профіль: Браво')).toBeNull();
    });
  });

  it('resets create fighter modal state after cancellation', async () => {
    const user = userEvent.setup();

    render(
      <Fighters
        {...baseProps}
        fighters={[] as any}
        categories={categories}
        fighterSkillLevels={{} as any}
        xpLedger={{} as any}
      />
    );

    const openButtons = screen.getAllByRole('button', { name: '+ Додати бійця' });
    await user.click(openButtons[0]);

    await user.type(screen.getByPlaceholderText("Прізвище Ім'я По батькові"), 'Іван Іваненко');
    await user.type(screen.getByPlaceholderText('Пошук скіла'), 'так');
    const toggleButton = screen.getByRole('button', { name: 'Згорнути' });
    await user.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Розгорнути');

    await user.click(screen.getByRole('button', { name: 'Скасувати' }));
    await waitFor(() => {
      expect(screen.queryByText('Створити бійця')).not.toBeInTheDocument();
    });

    await user.click(openButtons[0]);

    const fullNameInput = await screen.findByPlaceholderText("Прізвище Ім'я По батькові");
    expect(fullNameInput).toHaveValue('');
    expect(screen.getByPlaceholderText('Пошук скіла')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Згорнути' })).toBeInTheDocument();
  });

  it('filters rank suggestions and selects value in create modal', async () => {
    const user = userEvent.setup();

    render(
      <Fighters
        {...baseProps}
        fighters={[] as any}
        categories={categories}
        fighterSkillLevels={{} as any}
        xpLedger={{} as any}
      />
    );

    await user.click(screen.getAllByRole('button', { name: '+ Додати бійця' })[0]);

    const rankInput = await screen.findByPlaceholderText('Звання');
    await user.click(rankInput);
    await user.type(rankInput, 'лейт');

    const suggestion = await screen.findByText('Лейтенант');
    await user.click(suggestion);

    expect(rankInput).toHaveValue('Лейтенант');
    await waitFor(() => {
      expect(screen.queryByText('Лейтенант')).not.toBeInTheDocument();
    });
  });
});
