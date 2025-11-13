import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SkillProgress } from './SkillProgress';

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<any>('@/utils');
  return {
    ...actual,
    xpThresholdForLevel: vi.fn((level: number) => level * 10)
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SkillProgress', () => {
  it('renders basic progress and XP to next level', () => {
    // level=2 -> currentThreshold=20, nextLevel=3 -> nextThreshold=30
    // xp=25 -> rawProgress=5/10 => 50%
    render(
      <SkillProgress
        name="Medical"
        level={2}
        xp={25}
        maxLevel={5}
        accent="teal"
      />
    );

    expect(screen.getByText('Medical')).toBeInTheDocument();
    expect(screen.getByText('lvl 2')).toBeInTheDocument();
    expect(screen.getByText('25 XP')).toBeInTheDocument();
    expect(screen.getByText('5 XP до lvl 3')).toBeInTheDocument();
  });

  it('clamps progress and shows MAX label at max level', () => {
    // level above maxLevel should be capped
    render(
      <SkillProgress
        name="Navigation"
        level={10}
        xp={200}
        maxLevel={5}
        accent="violet"
      />
    );

    expect(screen.getByText('lvl 5')).toBeInTheDocument();
    expect(screen.getByText('200 XP')).toBeInTheDocument();
    expect(screen.getByText('MAX рівень')).toBeInTheDocument();
  });

  it('shows disabled state with italic label and no xp-to-next text', () => {
    render(
      <SkillProgress
        name="Signals"
        level={0}
        xp={0}
        disabled
      />
    );

    expect(screen.getByText('Signals')).toBeInTheDocument();
    expect(screen.queryByText(/XP до lvl/)).toBeNull();
    expect(screen.getByText('Не призначено')).toBeInTheDocument();
  });

  it('uses compact layout when compact flag is set', () => {
    const { container } = render(
      <SkillProgress
        name="Recon"
        level={1}
        xp={15}
        compact
      />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
    // compact mode reduces padding; we just assert style contains compact padding substring
    expect(root.getAttribute('style')).toContain('4px 0');
  });
});
