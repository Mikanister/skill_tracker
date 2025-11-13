import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import { downloadJSON, downloadCSV, importFromJSON, type ExportData } from '@/lib/export';
import type {
  Fighter,
  FighterSkillLevels,
  FighterXpLedger,
  SkillTree,
  TaskV2
} from '@/types';

vi.mock('@/lib/export', () => ({
  downloadJSON: vi.fn(),
  downloadCSV: vi.fn(),
  importFromJSON: vi.fn()
}));

const createSkillLevels = (levels: FighterSkillLevels) => levels;
const createXpLedger = (ledger: FighterXpLedger) => ledger;
const createTask = (task: TaskV2) => task;

const tree: SkillTree = {
  version: 1,
  categories: [
    {
      id: 'cat',
      name: 'Категорія',
      skills: [
        {
          id: 'skill',
          name: 'Навичка',
          levels: []
        }
      ]
    }
  ]
};

const fighters: Fighter[] = [
  { id: 'f1', name: 'Alpha', callsign: 'A', rank: 'Сержант', unit: '1 ОМБр' }
];

const fighterSkillLevels: Record<string, FighterSkillLevels> = {
  f1: createSkillLevels({ skill: 2 })
};

const xpLedger: Record<string, FighterXpLedger> = {
  f1: createXpLedger({ skill: 120 })
};

const tasks: TaskV2[] = [
  createTask({ id: 't1', title: 'Task', difficulty: 3, status: 'todo', assignees: [], createdAt: Date.now() })
];

const createProps = () => ({
  tree,
  fighters,
  fighterSkillLevels,
  xpLedger,
  tasks,
  setFighters: vi.fn(),
  setFighterSkillLevels: vi.fn(),
  setXpLedger: vi.fn(),
  setTasks: vi.fn(),
  onReset: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
});

const withFileReader = (callback: () => Promise<void> | void) => {
  const OriginalFileReader = window.FileReader;

  function MockFileReader(this: { onload: ((event: ProgressEvent<FileReader>) => void) | null }) {
    this.onload = null;
  }

  MockFileReader.prototype.readAsText = function (file: Blob) {
    new Response(file).text().then(text => {
      this.onload?.({ target: { result: text } } as ProgressEvent<FileReader>);
    });
  };

  window.FileReader = MockFileReader as unknown as typeof FileReader;

  const result = callback();
  return Promise.resolve(result).finally(() => {
    window.FileReader = OriginalFileReader;
  });
};

describe('Settings import/export and stats', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('exports data to JSON and CSV when buttons clicked', async () => {
    const user = userEvent.setup();
    const props = createProps();
    render(<Settings {...props} />);

    await user.click(screen.getByRole('button', { name: '📥 Експорт JSON' }));
    expect(downloadJSON).toHaveBeenCalledWith(
      {
        tree,
        fighters,
        fighterSkillLevels,
        xpLedger,
        tasksV2: tasks
      },
      expect.stringMatching(/^skillrpg-backup-\d{4}-\d{2}-\d{2}\.json$/)
    );
    expect(props.toast.success).toHaveBeenCalledWith('Дані експортовано в JSON');

    await user.click(screen.getByRole('button', { name: '📊 Експорт CSV (бійці)' }));
    expect(downloadCSV).toHaveBeenCalledWith(
      fighters,
      xpLedger,
      tree.categories,
      expect.stringMatching(/^skillrpg-fighters-\d{4}-\d{2}-\d{2}\.csv$/)
    );
    expect(props.toast.success).toHaveBeenCalledWith('Бійці експортовані в CSV');
  });

  it('shows stats section values', () => {
    render(<Settings {...createProps()} />);

    expect(screen.getByText('Бійців')).toBeInTheDocument();
    expect(screen.getByText('Категорій')).toBeInTheDocument();
    expect(screen.getByText('Навичок')).toBeInTheDocument();
    expect(screen.getByText('Задач')).toBeInTheDocument();
  });

  it('imports JSON payload and sets state when confirmed', async () => {
    await withFileReader(async () => {
      const importedData: ExportData = {
        tree,
        fighters: [{ id: 'f2', name: 'Bravo' }],
        fighterSkillLevels: { f2: createSkillLevels({ skill: 1 }) },
        xpLedger: { f2: createXpLedger({ skill: 60 }) },
        tasksV2: [
          createTask({ id: 't2', title: 'Imported task', difficulty: 2, status: 'todo', assignees: [], createdAt: Date.now() })
        ],
        version: 1,
        exportedAt: Date.now()
      };
      vi.mocked(importFromJSON).mockReturnValue(importedData);
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const props = createProps();

      render(<Settings {...props} />);

      const fileInput = document.querySelector('#import-file') as HTMLInputElement;
      const file = new File([JSON.stringify(importedData)], 'import.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      expect(props.setFighters).toHaveBeenCalledWith(importedData.fighters);
      expect(props.setFighterSkillLevels).toHaveBeenCalledWith(importedData.fighterSkillLevels);
      expect(props.setXpLedger).toHaveBeenCalledWith(importedData.xpLedger);
      expect(props.setTasks).toHaveBeenCalledWith(importedData.tasksV2);
      expect(props.toast.success).toHaveBeenCalledWith('Дані імпортовано');
    });
  });

  it('shows import error toast when payload invalid', async () => {
    await withFileReader(async () => {
      vi.mocked(importFromJSON).mockReturnValue(null);
      const props = createProps();
      render(<Settings {...props} />);

      const fileInput = document.querySelector('#import-file') as HTMLInputElement;
      const file = new File(['{}'], 'bad.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(props.toast.error).toHaveBeenCalledWith('Помилка імпорту: неправильний формат');
      });
    });
  });

  it('clears confirmation value after blur and refocus', async () => {
    const user = userEvent.setup();
    const props = createProps();
    render(<Settings {...props} />);

    const input = screen.getByPlaceholderText('Введіть DELETE');
    await user.type(input, 'WRONG');

    expect(input).toHaveValue('WRONG');

    input.blur();
    await user.click(input);
    expect(input).toHaveValue('');
  });
});
