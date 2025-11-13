import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LevelEditor } from './LevelEditor';
import { Level } from '@/types';

const buildLevel = (overrides: Partial<Level> = {}): Level => ({
  level: 1,
  title: 'Рівень 1',
  tasks: [],
  ...overrides
});

const buildTask = (overrides: any = {}) => ({
  id: 't1',
  text: 'Задача 1',
  done: false,
  ...overrides
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('LevelEditor', () => {
  it('toggles task completion and calls onChange with updated level', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({
      tasks: [buildTask(), buildTask({ id: 't2', text: 'Задача 2', done: true })]
    });

    render(<LevelEditor level={level} mode="edit" onChange={onChange} />);

    const firstRow = screen.getByText('Задача 1').closest('div') as HTMLElement;
    const firstTaskToggle = within(firstRow).getByRole('checkbox');
    expect(firstTaskToggle).not.toBeChecked();

    await user.click(firstTaskToggle);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated: Level = onChange.mock.calls[0][0];
    expect(updated.tasks[0].done).toBe(true);
    expect(updated.tasks[1].done).toBe(true);
  });

  it('moves task up and down within the list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({
      tasks: [
        buildTask({ id: 't1', text: 'Перша' }),
        buildTask({ id: 't2', text: 'Друга' }),
        buildTask({ id: 't3', text: 'Третя' })
      ]
    });

    render(<LevelEditor level={level} mode="edit" onChange={onChange} />);

    const firstRow = screen.getByText('Перша').closest('li') as HTMLElement;
    const firstRowMoveDown = within(firstRow).getByRole('button', { name: '↓' });

    // move down the first task
    await user.click(firstRowMoveDown);
    expect(onChange).toHaveBeenCalledTimes(1);
    let updated: Level = onChange.mock.calls[0][0];
    expect(updated.tasks.map(t => t.text)).toEqual(['Друга', 'Перша', 'Третя']);

    onChange.mockClear();

    // move down the last task ("Третя") should be no-op
    const lastRow = screen.getByText('Третя').closest('li') as HTMLElement;
    const lastRowMoveDown = within(lastRow).getByRole('button', { name: '↓' });
    await user.click(lastRowMoveDown);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('deletes task and calls onChange with filtered tasks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({
      tasks: [
        buildTask({ id: 't1', text: 'A' }),
        buildTask({ id: 't2', text: 'B' })
      ]
    });

    render(<LevelEditor level={level} mode="edit" onChange={onChange} />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Видалити' });
    await user.click(deleteButtons[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated: Level = onChange.mock.calls[0][0];
    expect(updated.tasks).toHaveLength(1);
    expect(updated.tasks[0].text).toBe('B');
  });

  it('opens TaskModal to create a new task and appends it on save', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({ tasks: [buildTask()] });

    render(<LevelEditor level={level} mode="edit" onChange={onChange} />);

    const addButton = screen.getByRole('button', { name: '+ Завдання' });
    await user.click(addButton);

    // TaskModal should open with create variant
    const titleInput = await screen.findByLabelText('Назва');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.type(titleInput, 'Нове завдання');
    await user.click(saveButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated: Level = onChange.mock.calls[0][0];
    expect(updated.tasks).toHaveLength(2);
    expect(updated.tasks[1].text).toBe('Нове завдання');
  });

  it('opens TaskModal for editing and replaces existing task on save', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({ tasks: [buildTask({ id: 't-edit', text: 'Редагувати мене' })] });

    render(<LevelEditor level={level} mode="edit" onChange={onChange} />);

    const editButton = screen.getByRole('button', { name: 'Редагувати' });
    await user.click(editButton);

    const titleInput = await screen.findByLabelText('Назва');
    const saveButton = screen.getByRole('button', { name: 'Зберегти' });

    await user.clear(titleInput);
    await user.type(titleInput, 'Оновлена задача');
    await user.click(saveButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated: Level = onChange.mock.calls[0][0];
    expect(updated.tasks).toHaveLength(1);
    expect(updated.tasks[0].id).toBe('t-edit');
    expect(updated.tasks[0].text).toBe('Оновлена задача');
  });

  it('renames level via prompt and trims the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({ title: 'Старий заголовок' });

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('  Новий заголовок  ');

    render(<LevelEditor level={level} mode="edit" onChange={onChange} />);

    const renameButton = screen.getByRole('button', { name: 'Перейменувати' });
    await user.click(renameButton);

    expect(promptSpy).toHaveBeenCalledWith('Назва рівня', 'Старий заголовок');
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated: Level = onChange.mock.calls[0][0];
    expect(updated.title).toBe('Новий заголовок');
  });

  it('does not render create button in view mode and still allows toggling', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const level = buildLevel({ tasks: [buildTask()] });

    render(<LevelEditor level={level} mode="view" onChange={onChange} />);
    const row = screen.getByText('Задача 1').closest('div') as HTMLElement;
    const taskToggle = within(row).getByRole('checkbox');
    await user.click(taskToggle);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
