import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TaskModal } from './TaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import MultiAssignTaskModal from './MultiAssignTaskModal';
import {
  Category,
  Fighter,
  FighterSkillLevels,
  FighterSkills,
  Skill
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
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Вкажіть назву'), 'Патрулювання території');
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
  });
});
