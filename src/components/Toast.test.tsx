import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { ToastContainer, useToast } from './Toast';

describe('ToastContainer', () => {
  const baseToast = { id: '1', message: 'Hello', type: 'info' as const };
  let dismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dismiss = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders toasts and dismiss button', () => {
    vi.useFakeTimers();
    render(<ToastContainer toasts={[baseToast]} onDismiss={dismiss} />);

    expect(screen.getByText('Hello')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Закрити сповіщення' }));
    act(() => {
      vi.runAllTimers();
    });
    expect(dismiss).toHaveBeenCalledWith('1');
  });

  it('renders action button when provided', () => {
    const action = vi.fn();
    render(<ToastContainer toasts={[{ ...baseToast, id: '2', action: { label: 'Undo', onClick: action } }]} onDismiss={dismiss} />);

    fireEvent.click(screen.getByText('Undo'));
    expect(action).toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalledWith('2');
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    render(<ToastContainer toasts={[{ ...baseToast, duration: 1000 }]} onDismiss={dismiss} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(dismiss).toHaveBeenCalledWith('1');
  });
});

describe('useToast hook', () => {
  function TestComponent() {
    const toast = useToast();
    return (
      <div>
        <button onClick={() => toast.success('Saved', { duration: 0 })}>Show</button>
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    );
  }

  it('adds and dismisses toast via hook', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Show'));
    expect(screen.getByText('Saved')).toBeTruthy();

    const closeButtons = screen.getAllByRole('button', { name: 'Закрити сповіщення' });
    fireEvent.click(closeButtons[0]);
    await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
  });
});
