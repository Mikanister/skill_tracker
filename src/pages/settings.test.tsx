import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Settings from './Settings';

vi.mock('../lib/export', () => ({
  downloadJSON: vi.fn(),
  downloadCSV: vi.fn(),
  importFromJSON: vi.fn()
}));

const { downloadJSON } = await import('../lib/export');

describe('Settings page', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    tree: { categories: [{ id: 'cat', name: 'Категорія', skills: [] }] } as any,
    fighters: [] as any,
    fighterSkillLevels: {} as any,
    xpLedger: {} as any,
    tasks: [] as any,
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
  };

  it('requires typing DELETE before reset is enabled and calls onReset', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    render(<Settings {...defaultProps} />);

    const resetButton = screen.getByRole('button', { name: '🗑️ Скинути всі дані' });
    expect(resetButton).to.have.property('disabled', true);

    const input = screen.getByPlaceholderText('Введіть DELETE');
    await user.type(input, 'DELETE');
    expect(resetButton).to.have.property('disabled', false);

    await user.click(resetButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(defaultProps.onReset).toHaveBeenCalled();
  });

  it('allows exporting before reset for safety reminder', async () => {
    const user = userEvent.setup();
    render(<Settings {...defaultProps} />);

    const exportReminderButton = screen.getByRole('button', { name: 'Експортувати зараз' });
    await user.click(exportReminderButton);

    expect(downloadJSON).toHaveBeenCalledOnce();
    expect(defaultProps.toast.success).toHaveBeenCalledWith('Дані експортовано в JSON');
  });
});
