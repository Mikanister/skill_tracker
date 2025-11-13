import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { SkillGrid } from './SkillGrid';
import type { Skill } from '@/types';

describe('SkillGrid', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseSkill = (overrides: Partial<Skill> = {}): Skill => ({
    id: 'skill1',
    name: 'Тактика',
    description: '',
    levels: [],
    ...overrides
  } as Skill);

  const createDataTransfer = () => ({
    setData: vi.fn(),
    getData: vi.fn(),
    clearData: vi.fn(),
    dropEffect: 'move',
    effectAllowed: 'all'
  }) as unknown as DataTransfer;

  it('renders empty state and triggers add callback', () => {
    const onAddSkill = vi.fn();

    render(
      <SkillGrid
        skills={[]}
        skillUsage={new Map()}
        draggedSkillId={null}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onOpenSkill={vi.fn()}
        onAddSkill={onAddSkill}
      />
    );

    fireEvent.click(screen.getByTestId('empty-add-skill'));
    expect(onAddSkill).toHaveBeenCalledTimes(1);
  });

  it('displays usage count and max level chip when data provided', () => {
    const skill = baseSkill();
    const usage = new Map<string, { count: number; maxLevel: number }>();
    usage.set(skill.id, { count: 2, maxLevel: 5 });

    render(
      <SkillGrid
        skills={[skill]}
        skillUsage={usage}
        draggedSkillId={null}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onOpenSkill={vi.fn()}
        onAddSkill={vi.fn()}
      />
    );

    expect(screen.getByText('Бійців: 2')).toBeInTheDocument();
    expect(screen.getByText('Макс. рівень 5')).toBeInTheDocument();
  });

  it('calls drag handlers and toggles dragging class', () => {
    const skill = baseSkill();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();

    render(
      <SkillGrid
        skills={[skill]}
        skillUsage={new Map()}
        draggedSkillId={skill.id}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onOpenSkill={vi.fn()}
        onAddSkill={vi.fn()}
      />
    );

    const card = screen.getByRole('button', { name: new RegExp(skill.name) });
    expect(card.classList.contains('is-dragging')).toBe(true);

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card, { dataTransfer });
    expect(onDragStart).toHaveBeenCalledWith(skill.id);

    fireEvent.dragEnd(card, { dataTransfer });
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('opens skill on click and keyboard activation', () => {
    const skill = baseSkill();
    const onOpenSkill = vi.fn();

    render(
      <SkillGrid
        skills={[skill]}
        skillUsage={new Map()}
        draggedSkillId={null}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onOpenSkill={onOpenSkill}
        onAddSkill={vi.fn()}
      />
    );

    const card = screen.getByRole('button', { name: new RegExp(skill.name) });
    fireEvent.click(card);
    expect(onOpenSkill).toHaveBeenCalledWith(skill);

    onOpenSkill.mockClear();
    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onOpenSkill).toHaveBeenCalledWith(skill);
  });
});
