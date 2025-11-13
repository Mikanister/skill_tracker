import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SectionCard } from './SectionCard';

afterEach(() => {
  cleanup();
});

describe('SectionCard', () => {
  it('renders string title and description with default variant', () => {
    render(
      <SectionCard title="Заголовок" description="Опис">
        <div data-testid="content">Вміст</div>
      </SectionCard>
    );

    const heading = screen.getByText('Заголовок');
    const section = heading.closest('section');
    expect(section).toBeTruthy();
    if (!section) return;

    expect(section.className.split(' ')).toContain('section-card');
    expect(section.className.split(' ')).not.toContain('section-card--danger');

    expect(screen.getByText('Заголовок')).toHaveClass('text-md', 'text-strong');
    expect(screen.getByText('Опис')).toHaveClass('text-sm', 'text-muted');
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders custom React nodes for title and description', () => {
    render(
      <SectionCard
        title={<h3 data-testid="custom-title">Custom</h3>}
        description={<span data-testid="custom-description">Desc</span>}
      >
        <span>Body</span>
      </SectionCard>
    );

    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    expect(screen.getByTestId('custom-description')).toBeInTheDocument();
  });

  it('applies danger variant and custom className', () => {
    render(
      <SectionCard title="Danger" variant="danger" className="extra-class">
        <span>Body</span>
      </SectionCard>
    );

    const heading = screen.getByText('Danger');
    const section = heading.closest('section') as HTMLElement;
    expect(section).toBeTruthy();

    const classes = section.className.split(' ');
    expect(classes).toContain('section-card');
    expect(classes).toContain('section-card--danger');
    expect(classes).toContain('extra-class');
  });

  it('omits description block when description is not provided', () => {
    render(
      <SectionCard title="Без опису">
        <span>Body</span>
      </SectionCard>
    );

    const heading = screen.getByText('Без опису');
    const sectionHeading = heading.closest('.section-heading') as HTMLElement;
    expect(sectionHeading).toBeTruthy();

    // only title should be inside heading when description is missing
    const paragraphs = sectionHeading.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });
});
