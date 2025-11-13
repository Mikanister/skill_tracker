import React from 'react';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { AssigneeSelector } from '@/components/MultiAssignTaskModal/AssigneeSelector';
import type { Fighter } from '@/types';

afterEach(() => {
  cleanup();
});

describe('AssigneeSelector', () => {
  const fighters: Fighter[] = [
    { id: 'fighter-1', name: 'Alpha', callsign: 'A1' } as Fighter,
    { id: 'fighter-2', name: 'Bravo', fullName: 'Bravo Team' } as Fighter
  ];

  it('renders empty state when no filtered fighters provided', () => {
    const onSearchChange = vi.fn();
    const onToggleFighter = vi.fn();

    render(
      <AssigneeSelector
        search=""
        onSearchChange={onSearchChange}
        filteredFighters={[]}
        selectedFighters={{}}
        onToggleFighter={onToggleFighter}
      />
    );

    expect(screen.getByText('Бійців не знайдено')).toBeInTheDocument();
  });

  it('updates search input and toggles fighters', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onToggleFighter = vi.fn();

    const Wrapper: React.FC = () => {
      const [search, setSearch] = React.useState('');
      const [selected, setSelected] = React.useState<Record<string, boolean>>({ 'fighter-1': true });

      return (
        <AssigneeSelector
          search={search}
          onSearchChange={value => {
            setSearch(value);
            onSearchChange(value);
          }}
          filteredFighters={fighters}
          selectedFighters={selected}
          onToggleFighter={(id, checked) => {
            setSelected(prev => ({ ...prev, [id]: checked }));
            onToggleFighter(id, checked);
          }}
        />
      );
    };

    render(<Wrapper />);

    const section = screen.getByText('Виконавці').closest('section') as HTMLElement;
    const searchInput = within(section).getByPlaceholderText('Пошук бійця');
    await user.type(searchInput, 'bra');
    expect(onSearchChange).toHaveBeenLastCalledWith('bra');

    const alphaOption = within(section).getByLabelText('A1') as HTMLInputElement;
    expect(alphaOption).toBeChecked();

    const bravoCheckbox = screen.getByLabelText('Bravo Team');
    await user.click(bravoCheckbox);
    expect(onToggleFighter).toHaveBeenCalledWith('fighter-2', true);
  });

  it('invokes onSearchChange when typing into search input', () => {
    const onSearchChange = vi.fn();

    render(
      <AssigneeSelector
        search=""
        onSearchChange={onSearchChange}
        filteredFighters={fighters}
        selectedFighters={{}}
        onToggleFighter={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Пошук бійця');
    fireEvent.change(input, { target: { value: 'alp' } });

    expect(onSearchChange).toHaveBeenCalledWith('alp');
  });

  it('falls back to full name and name when callsign missing', () => {
    const mixedFighters: Fighter[] = [
      { id: 'fighter-1', name: 'Charlie', callsign: 'C1' } as Fighter,
      { id: 'fighter-2', name: 'Delta', fullName: 'Delta Unit' } as Fighter,
      { id: 'fighter-3', name: 'Echo' } as Fighter
    ];

    render(
      <AssigneeSelector
        search=""
        onSearchChange={vi.fn()}
        filteredFighters={mixedFighters}
        selectedFighters={{}}
        onToggleFighter={vi.fn()}
      />
    );

    expect(screen.getByLabelText('C1')).toBeInTheDocument();
    expect(screen.getByLabelText('Delta Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Echo')).toBeInTheDocument();
  });
});
