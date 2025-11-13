import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MultiAssignTaskModal from '@/components/MultiAssignTaskModal/MultiAssignTaskModal';
import { useMultiAssignForm } from '@/hooks/useMultiAssignForm';
import type { FighterSkillLevels, TaskV2Assignee } from '@/types';

vi.mock('@/hooks/useMultiAssignForm');
vi.mock('@/components/MultiAssignTaskModal/SkillBoard', () => {
  const SkillBoardMock = vi.fn(() => null);
  return { SkillBoard: SkillBoardMock };
});

// eslint-disable-next-line import/first
import { SkillBoard } from '@/components/MultiAssignTaskModal/SkillBoard';

const useMultiAssignFormMock = vi.mocked(useMultiAssignForm);
const SkillBoardMock = vi.mocked(SkillBoard);

const baseHookState = () => ({
  title: 'Task title',
  description: '',
  difficulty: 3 as 1 | 2 | 3 | 4 | 5,
  isPriority: false,
  search: '',
  error: null as string | null,
  selectedFighters: {} as Record<string, boolean>,
  assigneeSkills: {} as Record<string, Record<string, number>>,
  filteredFighters: [] as any[],
  selectedFighterList: [] as any[],
  setTitle: vi.fn(),
  setDescription: vi.fn(),
  setDifficulty: vi.fn(),
  setIsPriority: vi.fn(),
  setSearch: vi.fn(),
  toggleFighter: vi.fn(),
  toggleSkill: vi.fn(),
  setSkillXp: vi.fn(),
  submit: vi.fn(),
  reset: vi.fn(),
  clearError: vi.fn()
});

const fighters = [{ id: 'fighter-1', name: 'Alpha' } as any];
const categories = [{ id: 'cat-1', name: 'Support', skills: [] }] as any[];
const fighterSkillLevels = {} as Record<string, FighterSkillLevels>;

function createSuccessPayload(): { title: string; assignees: TaskV2Assignee[] } {
  return {
    title: 'Task title',
    assignees: [
      {
        fighterId: 'fighter-1',
        skills: []
      }
    ]
  };
}

afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

describe('MultiAssignTaskModal behaviour', () => {
  it('clears error and closes when cancel is clicked', async () => {
    const user = userEvent.setup();
    const clearError = vi.fn();

    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      clearError
    });

    const onClose = vi.fn();

    render(
      <MultiAssignTaskModal
        open
        onClose={onClose}
        fighters={fighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Скасувати' }));

    expect(clearError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close or reset when submit returns null', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockReturnValue(null);
    const reset = vi.fn();

    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      submit,
      reset
    });

    const onClose = vi.fn();
    const onCreate = vi.fn();

    render(
      <MultiAssignTaskModal
        open
        onClose={onClose}
        fighters={fighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={onCreate}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Створити задачу' });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits payload, resets and closes when submit succeeds', async () => {
    const user = userEvent.setup();
    const payload = createSuccessPayload();
    const submit = vi.fn().mockReturnValue(payload);
    const reset = vi.fn();
    const clearError = vi.fn();

    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      submit,
      reset,
      clearError
    });

    const onCreate = vi.fn();
    const onClose = vi.fn();

    render(
      <MultiAssignTaskModal
        open
        onClose={onClose}
        fighters={fighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={onCreate}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Створити задачу' }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(payload);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clears existing error on title change and via modal close button', async () => {
    const user = userEvent.setup();
    const setTitle = vi.fn();
    const clearError = vi.fn();

    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      error: 'Validation failed',
      setTitle,
      clearError
    });

    const onClose = vi.fn();

    render(
      <MultiAssignTaskModal
        open
        onClose={onClose}
        fighters={fighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={vi.fn()}
      />
    );

    const titleInput = screen.getByPlaceholderText('Вкажіть назву');
    fireEvent.change(titleInput, { target: { value: 'Updated title' } });

    expect(setTitle).toHaveBeenCalledWith('Updated title');
    expect(clearError).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: '✕' }));

    expect(clearError).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not clear error when none present on title change', () => {
    const setTitle = vi.fn();
    const clearError = vi.fn();

    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      setTitle,
      clearError
    });

    render(
      <MultiAssignTaskModal
        open
        onClose={vi.fn()}
        fighters={fighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Вкажіть назву'), { target: { value: 'Renamed' } });

    expect(setTitle).toHaveBeenCalledWith('Renamed');
    expect(clearError).not.toHaveBeenCalled();
  });

  it('disables submit button when title is empty', () => {
    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      title: '',
      submit: vi.fn()
    });

    const onCreate = vi.fn();

    render(
      <MultiAssignTaskModal
        open
        onClose={vi.fn()}
        fighters={fighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={onCreate}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Створити задачу' });
    expect(submitButton).toBeDisabled();
  });

  it('passes mapped fighters and counts to SkillBoard', () => {
    const extendedFighters = [
      { id: 'fighter-1', name: 'Alpha' },
      { id: 'fighter-2', name: 'Bravo' }
    ] as any[];

    useMultiAssignFormMock.mockReturnValue({
      ...baseHookState(),
      selectedFighters: { 'fighter-1': true, 'fighter-2': false },
      assigneeSkills: {},
      filteredFighters: [],
      selectedFighterList: []
    });

    render(
      <MultiAssignTaskModal
        open
        onClose={vi.fn()}
        fighters={extendedFighters}
        categories={categories}
        fighterSkillLevels={fighterSkillLevels}
        tasks={[]}
        onCreate={vi.fn()}
      />
    );

    expect(SkillBoardMock).toHaveBeenCalled();
    const props = SkillBoardMock.mock.calls.at(-1)?.[0];
    expect(props?.selectedFighters).toEqual([{ id: 'fighter-1', name: 'Alpha' }]);
    expect(props?.allFightersCount).toBe(extendedFighters.length);
  });
});
