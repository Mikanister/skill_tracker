import React from 'react';
import { TaskV2, TaskV2Status } from '@/types';

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  searchSuggestions: TaskV2[];
  onSuggestionSelect: (taskId: string) => void;
  statusLabels: Record<TaskV2Status, string>;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  searchFocused,
  onFocusChange,
  searchSuggestions,
  onSuggestionSelect,
  statusLabels
}) => {
  const showSuggestions = (searchFocused || searchQuery.trim().length > 0) && searchSuggestions.length > 0;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        value={searchQuery}
        onChange={event => onSearchChange(event.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        placeholder="Пошук задачі за назвою або номером"
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-panel)',
          color: 'var(--fg)',
          fontSize: 14,
          boxShadow: 'var(--shadow-sm)'
        }}
      />
      {showSuggestions && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: 8,
            listStyle: 'none',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gap: 6,
            zIndex: 20,
            maxHeight: 260,
            overflow: 'auto'
          }}
        >
          {searchSuggestions.map(suggestion => (
            <li
              key={suggestion.id}
              data-testid={`task-suggestion-${suggestion.id}`}
              onMouseDown={event => {
                event.preventDefault();
                onSuggestionSelect(suggestion.id);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                background: 'var(--surface-panel)'
              }}
            >
              <span style={{ display: 'grid' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>#{suggestion.taskNumber ?? '—'}</span>
                <span style={{ fontWeight: 600 }}>{suggestion.title}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{statusLabels[suggestion.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
