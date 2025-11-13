import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useModalState } from '@/hooks/useModalState';

describe('useModalState', () => {
  it('initialises from provided defaults', () => {
    const { result } = renderHook(() => useModalState(true, 'payload'));

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('payload');
  });

  it('opens modal with optional payload', () => {
    const { result } = renderHook(() => useModalState<string>(false));

    act(() => {
      result.current.open('new payload');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('new payload');
  });

  it('closes modal without removing payload', () => {
    const { result } = renderHook(() => useModalState(true, { id: 1 }));

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toEqual({ id: 1 });
  });

  it('toggles modal respecting next flag and optional payload', () => {
    const { result } = renderHook(() => useModalState(false, 'base'));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('base');

    act(() => {
      result.current.toggle(false, 'forced payload');
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBe('forced payload');

    act(() => {
      result.current.toggle(undefined, undefined);
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('forced payload');
  });

  it('sets data using updater function and direct value', () => {
    const { result } = renderHook(() => useModalState(true, { count: 1 }));

    act(() => {
      result.current.setData(prev => ({ count: (prev?.count ?? 0) + 1 }));
    });
    expect(result.current.data).toEqual({ count: 2 });

    act(() => {
      result.current.setData({ count: 10 });
    });
    expect(result.current.data).toEqual({ count: 10 });
  });

  it('toggles to explicit state with payload and retains closure', () => {
    const { result } = renderHook(() => useModalState(false, 'base'));

    act(() => {
      result.current.toggle(true, 'opened');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('opened');

    act(() => {
      result.current.toggle(true);
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('allows setData updater to clear payload to undefined', () => {
    const { result } = renderHook(() => useModalState(true, 'payload'));

    act(() => {
      result.current.setData(() => undefined);
    });
    expect(result.current.data).toBeUndefined();
  });
});
