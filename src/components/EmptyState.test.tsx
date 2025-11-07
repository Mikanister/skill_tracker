import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders icon, title, and description', () => {
    render(<EmptyState icon="📄" title="Title" description="Some text" />);

    expect(screen.getByText('📄')).toBeTruthy();
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Some text')).toBeTruthy();
  });

  it('fires action when button clicked', () => {
    const onClick = vi.fn();
    render(<EmptyState icon="📄" title="Title" description="Some text" action={{ label: 'Create', onClick }} />);

    fireEvent.click(screen.getByText('Create'));
    expect(onClick).toHaveBeenCalled();
  });
});
