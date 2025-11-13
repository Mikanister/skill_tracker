import React, { createRef } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExportImportSection } from './ExportImportSection';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ExportImportSection', () => {
  it('calls export handlers when buttons are clicked', () => {
    const onExportJson = vi.fn();
    const onExportCsv = vi.fn();
    const onImportChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    render(
      <ExportImportSection
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        onImportChange={onImportChange}
        fileInputRef={fileInputRef}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '📥 Експорт JSON' }));
    fireEvent.click(screen.getByRole('button', { name: '📊 Експорт CSV (бійці)' }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('wires file input and label correctly for import', () => {
    const onExportJson = vi.fn();
    const onExportCsv = vi.fn();
    const onImportChange = vi.fn();
    const fileInputRef = createRef<HTMLInputElement>();

    const { container } = render(
      <ExportImportSection
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        onImportChange={onImportChange}
        fileInputRef={fileInputRef}
      />
    );

    const input = document.querySelector('#import-file') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('file');
    expect(input.accept).toBe('.json');

    // fileInputRef should point to the same element
    expect(fileInputRef.current).toBe(input);

    const file = new File(['{}'], 'data.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onImportChange).toHaveBeenCalledTimes(1);

    // clicking visible import button should not break anything
    const importButton = screen.getByRole('button', { name: '📤 Імпорт JSON' });
    expect(importButton).toBeInTheDocument();
  });
});
