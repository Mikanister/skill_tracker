import React from 'react';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SegmentedLevelInput } from '@/components/SegmentedLevelInput';

afterEach(() => {
  cleanup();
});

describe('SegmentedLevelInput', () => {
  it('activates clicked level and toggles off when selecting same segment', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { rerender, getByRole } = render(
      <SegmentedLevelInput value={2} onChange={handleChange} maxLevel={5} accent="blue" size="sm" />
    );

    const segmentThree = getByRole('button', { name: 'Встановити рівень 3' });
    expect(segmentThree).toHaveAttribute('aria-pressed', 'false');

    await user.click(segmentThree);
    expect(handleChange).toHaveBeenCalledWith(3);

    rerender(<SegmentedLevelInput value={3} onChange={handleChange} maxLevel={5} accent="blue" size="sm" />);
    expect(segmentThree).toHaveAttribute('aria-pressed', 'true');

    await user.click(segmentThree);
    expect(handleChange).toHaveBeenLastCalledWith(0);
  });

  it('disables segments above maxLevel and prevents interaction when component disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(<SegmentedLevelInput value={4} onChange={handleChange} maxLevel={3} disabled />);

    const segmentFour = getByRole('button', { name: 'Встановити рівень 4' });
    const segmentTwo = getByRole('button', { name: 'Встановити рівень 2' });

    expect(segmentFour).toBeDisabled();
    expect(segmentFour).toHaveAttribute('aria-pressed', 'false');

    expect(segmentTwo).toBeDisabled();
    expect(segmentTwo).toHaveAttribute('aria-pressed', 'true');

    await user.click(segmentTwo);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('enables segments within maxLevel when not disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(<SegmentedLevelInput value={1} onChange={handleChange} maxLevel={3} />);

    const segmentThree = getByRole('button', { name: 'Встановити рівень 3' });
    const segmentFive = getByRole('button', { name: 'Встановити рівень 5' });

    expect(segmentThree).not.toBeDisabled();
    expect(segmentFive).toBeDisabled();

    await user.click(segmentThree);
    expect(handleChange).toHaveBeenCalledWith(3);
  });
});
