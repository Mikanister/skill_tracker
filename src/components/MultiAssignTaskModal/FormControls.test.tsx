import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

import { FormControls, type FormControlsProps } from './FormControls';

describe('FormControls', () => {
  afterEach(() => {
    cleanup();
  });

  const renderControls = (overrides: Partial<FormControlsProps> = {}) => {
    const props: FormControlsProps = {
      title: 'Initial title',
      difficulty: 3,
      isPriority: false,
      description: 'Initial description',
      error: null,
      onTitleChange: vi.fn(),
      onDifficultyChange: vi.fn(),
      onPriorityChange: vi.fn(),
      onDescriptionChange: vi.fn(),
      ...overrides
    };

    const view = render(<FormControls {...props} />);

    return { props, ...view };
  };

  it('calls change handlers for each control', async () => {
    const { props } = renderControls();

    const titleInput = screen.getByPlaceholderText('Вкажіть назву');
    fireEvent.change(titleInput, { target: { value: 'Updated' } });
    expect(props.onTitleChange).toHaveBeenLastCalledWith('Updated');

    const difficultySelect = screen.getByLabelText('Складність');
    fireEvent.change(difficultySelect, { target: { value: '5' } });
    expect(props.onDifficultyChange).toHaveBeenCalledWith(5);

    const priorityCheckbox = screen.getByRole('checkbox', { name: 'Пріоритетно' });
    fireEvent.click(priorityCheckbox);
    expect(props.onPriorityChange).toHaveBeenCalledWith(true);

    const descriptionArea = screen.getByPlaceholderText('Додайте короткий опис');
    fireEvent.change(descriptionArea, { target: { value: 'New description' } });
    expect(props.onDescriptionChange).toHaveBeenLastCalledWith('New description');
  });

  it('renders provided error message', () => {
    renderControls({ error: 'Вкажіть назву задачі.' });

    expect(screen.getByText('Вкажіть назву задачі.')).toBeInTheDocument();
  });

  it('lists all difficulty options', () => {
    renderControls();

    const select = screen.getByLabelText('Складність') as HTMLSelectElement;
    const values = Array.from(select.options).map(option => Number(option.value));
    expect(values).toEqual([1, 2, 3, 4, 5]);
  });
});
