import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormState } from './useFormState';

type FormValues = {
  title: string;
  description: string;
  done: boolean;
};

afterEach(() => {
  // nothing special, renderHook cleans up itself
});

describe('useFormState', () => {
  const initialValues: FormValues = {
    title: '',
    description: '',
    done: false
  };

  const validators = {
    title: (value: string) => (value.trim() ? null : 'Title is required'),
    description: (value: string) => (value.length > 10 ? 'Too long' : null)
  } as const;

  it('updates value with validator and manages errors in setValue', () => {
    const { result } = renderHook(() => useFormState(initialValues, validators));

    act(() => {
      result.current.setValue('title', '');
    });
    expect(result.current.values.title).toBe('');
    expect(result.current.errors.title).toBe('Title is required');

    act(() => {
      result.current.setValue('title', ' Hello ');
    });
    expect(result.current.values.title).toBe(' Hello ');
    expect(result.current.errors.title).toBeUndefined();
  });

  it('clears errors for fields without validators in setValue', () => {
    const { result } = renderHook(() => useFormState(initialValues, validators));

    act(() => {
      result.current.setValue('title', '');
    });
    expect(result.current.errors.title).toBe('Title is required');

    // simulate some error on done field
    act(() => {
      (result.current as any).errors.done = 'should not persist';
      result.current.setValue('done', true);
    });

    expect(result.current.values.done).toBe(true);
    expect(result.current.errors.done).toBeUndefined();
  });

  it('batch-updates values and revalidates only changed fields in setValues', () => {
    const { result } = renderHook(() => useFormState(initialValues, validators));

    act(() => {
      result.current.setValues({ title: '', description: 'short' });
    });

    expect(result.current.values.title).toBe('');
    expect(result.current.values.description).toBe('short');
    // no previous errors – batch update does not introduce new ones
    expect(result.current.errors.title).toBeUndefined();
    expect(result.current.errors.description).toBeUndefined();

    // introduce an error first, then batch-update and expect revalidation
    act(() => {
      result.current.setValue('title', '');
    });
    expect(result.current.errors.title).toBe('Title is required');

    act(() => {
      result.current.setValues({ title: 'Valid', description: 'too long description' });
    });

    expect(result.current.values.title).toBe('Valid');
    expect(result.current.values.description).toBe('too long description');
    expect(result.current.errors.title).toBeUndefined();
    expect(result.current.errors.description).toBe('Too long');
  });

  it('reset restores initial values and clears errors, with optional overrides', () => {
    const { result } = renderHook(() => useFormState(initialValues, validators));

    act(() => {
      result.current.setValues({ title: 'X', description: 'Y', done: true });
      result.current.setValue('title', '');
    });
    expect(result.current.errors.title).toBe('Title is required');

    act(() => {
      result.current.reset();
    });
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});

    act(() => {
      result.current.reset({ title: 'Preset' });
    });
    expect(result.current.values).toEqual({ ...initialValues, title: 'Preset' });
  });

  it('validate returns true when no validators or when all pass', () => {
    const { result: noValidators } = renderHook(() => useFormState(initialValues));

    let ok = false;
    act(() => {
      ok = noValidators.current.validate();
    });
    expect(ok).toBe(true);

    const { result } = renderHook(() => useFormState(initialValues, validators));

    let valid = true;
    act(() => {
      valid = result.current.validate();
    });
    expect(valid).toBe(false);
    expect(result.current.errors.title).toBe('Title is required');
  });

  it('registerField handles both event and direct value changes and onBlur validation', () => {
    const { result } = renderHook(() => useFormState(initialValues, validators));

    const titleField = result.current.registerField('title');

    act(() => {
      titleField.onChange({ target: { value: '' } } as any);
    });
    expect(result.current.values.title).toBe('');

    act(() => {
      titleField.onBlur();
    });
    expect(result.current.errors.title).toBe('Title is required');

    act(() => {
      titleField.onChange('New title');
    });
    expect(result.current.values.title).toBe('New title');
  });

  it('clearErrors removes all recorded errors', () => {
    const { result } = renderHook(() => useFormState(initialValues, validators));

    act(() => {
      result.current.setValue('title', '');
    });
    expect(result.current.errors.title).toBe('Title is required');

    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors).toEqual({});
  });
});
