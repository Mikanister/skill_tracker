import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormControls } from '@/components/MultiAssignTaskModal/FormControls';
import { AssigneeSelector } from '@/components/MultiAssignTaskModal/AssigneeSelector';

describe('FormControls', () => {
  it('invokes callbacks when fields change and shows error message', async () => {
    const onTitleChange = vi.fn();
    const onDifficultyChange = vi.fn();
    const onPriorityChange = vi.fn();
    const onDescriptionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FormControls
        title="Initial title"
        difficulty={3}
        isPriority={false}
        description="Initial description"
        error="Validation failed"
        onTitleChange={onTitleChange}
        onDifficultyChange={onDifficultyChange}
        onPriorityChange={onPriorityChange}
        onDescriptionChange={onDescriptionChange}
      />
    );

    const titleInput = screen.getByPlaceholderText('Вкажіть назву');
    fireEvent.change(titleInput, { target: { value: 'Updated title' } });

    const difficultySelect = screen.getByLabelText('Складність');
    await user.selectOptions(difficultySelect, '4');

    const priorityCheckbox = screen.getByLabelText('Пріоритетно');
    await user.click(priorityCheckbox);

    const descriptionArea = screen.getByPlaceholderText('Додайте короткий опис');
    fireEvent.change(descriptionArea, { target: { value: 'Updated description' } });

    expect(onTitleChange).toHaveBeenLastCalledWith('Updated title');
    expect(onDifficultyChange).toHaveBeenCalledWith(4);
    expect(onPriorityChange).toHaveBeenCalledWith(true);
    expect(onDescriptionChange).toHaveBeenLastCalledWith('Updated description');
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
  });

  it('toggles priority off and renders without error block when none provided', async () => {
    cleanup();
    const onPriorityChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FormControls
        title="Initial title"
        difficulty={2}
        isPriority
        description=""
        error={null}
        onTitleChange={vi.fn()}
        onDifficultyChange={vi.fn()}
        onPriorityChange={onPriorityChange}
        onDescriptionChange={vi.fn()}
      />
    );

    const priorityCheckbox = screen.getByLabelText('Пріоритетно');
    expect(priorityCheckbox).toBeChecked();

    await user.click(priorityCheckbox);

    expect(onPriorityChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('AssigneeSelector', () => {
  const fighters = [
    { id: 'f1', name: 'Alpha', callsign: 'A1' },
    { id: 'f2', name: 'Bravo', callsign: 'B2' }
  ] as any;

  it('triggers search and toggle callbacks', async () => {
    const onSearchChange = vi.fn();
    const onToggleFighter = vi.fn();
    const user = userEvent.setup();

    render(
      <AssigneeSelector
        search=""
        onSearchChange={onSearchChange}
        filteredFighters={fighters}
        selectedFighters={{ f1: true, f2: false }}
        onToggleFighter={onToggleFighter}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Пошук бійця'), { target: { value: 'alp' } });
    expect(onSearchChange).toHaveBeenCalledWith('alp');

    const alphaCheckbox = screen.getByLabelText('A1');
    await user.click(alphaCheckbox);
    expect(onToggleFighter).toHaveBeenCalledWith('f1', false);
  });

  it('renders full name and name fallbacks and propagates raw search value', async () => {
    cleanup();
    const onSearchChange = vi.fn();
    const onToggleFighter = vi.fn();
    const user = userEvent.setup();

    render(
      <AssigneeSelector
        search="  "
        onSearchChange={onSearchChange}
        filteredFighters={[
          { id: 'f3', callsign: undefined, fullName: 'Full Display', name: 'Fallback' },
          { id: 'f4', callsign: undefined, fullName: '', name: 'Only Name' }
        ] as any}
        selectedFighters={{ f3: false, f4: true }}
        onToggleFighter={onToggleFighter}
      />
    );

    expect(screen.getByLabelText('Full Display')).not.toBeChecked();
    const onlyNameCheckbox = screen.getByLabelText('Only Name');
    expect(onlyNameCheckbox).toBeChecked();

    await user.click(onlyNameCheckbox);
    expect(onToggleFighter).toHaveBeenCalledWith('f4', false);

    const searchInput = screen.getByPlaceholderText('Пошук бійця');
    fireEvent.change(searchInput, { target: { value: '  beta' } });
    expect(onSearchChange).toHaveBeenLastCalledWith('  beta');
  });

  it('renders empty state when no fighters match', () => {
    render(
      <AssigneeSelector
        search="no"
        onSearchChange={vi.fn()}
        filteredFighters={[]}
        selectedFighters={{}}
        onToggleFighter={vi.fn()}
      />
    );

    expect(screen.getByText('Бійців не знайдено')).toBeInTheDocument();
  });
});
