import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeSetItem, safeGetItem, safeRemoveItem, generateId } from './storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('safeSetItem stores serialized value and returns true', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    const payload = { foo: 'bar' };
    const ok = safeSetItem('key', payload);
    expect(ok).toBe(true);
    expect(spy).toHaveBeenCalledWith('key', JSON.stringify(payload));
  });

  it('safeSetItem handles quota errors gracefully', () => {
    const error = new DOMException('Quota exceeded', 'QuotaExceededError');
    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw error; });
    const ok = safeSetItem('key', { foo: 'bar' });
    expect(ok).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('localStorage quota exceeded');
  });

  it('safeGetItem returns default when key missing', () => {
    const value = safeGetItem('missing', 42);
    expect(value).toBe(42);
  });

  it('safeGetItem returns parsed value when parser succeeds', () => {
    localStorage.setItem('foo', JSON.stringify({ bar: 1 }));
    const value = safeGetItem('foo', {}, data => {
      if (typeof data === 'object' && data !== null && 'bar' in data) return data as { bar: number };
      return {};
    });
    expect(value).toEqual({ bar: 1 });
  });

  it('safeGetItem falls back when parser returns default', () => {
    localStorage.setItem('foo', JSON.stringify({ bar: 1 }));
    const fallback = { baz: 2 };
    const value = safeGetItem('foo', fallback, data => {
      if (typeof data === 'object' && data !== null && 'baz' in data) {
        return data as typeof fallback;
      }
      return fallback;
    });
    expect(value).toEqual({ baz: 2 });
  });

  it('safeGetItem handles malformed JSON', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('foo', '{ not json');
    const value = safeGetItem('foo', 'fallback');
    expect(value).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load from localStorage (key: foo):'), expect.any(SyntaxError));
  });

  it('safeRemoveItem removes value without throwing', () => {
    localStorage.setItem('foo', 'bar');
    safeRemoveItem('foo');
    expect(localStorage.getItem('foo')).toBeNull();
  });

  it('safeRemoveItem logs error when removal fails', () => {
    const error = new Error('remove failed');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw error; });
    safeRemoveItem('foo');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to remove from localStorage (key: foo):'), error);
  });

  it('generateId includes prefix when provided', () => {
    const id = generateId('test');
    expect(id.startsWith('test_')).toBe(true);
    expect(id.split('_')).toHaveLength(3);
  });

  it('generateId creates unique ids for successive calls', () => {
    vi.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const first = generateId();
    vi.spyOn(Math, 'random').mockReturnValue(0.987654321);
    const second = generateId();
    expect(first).not.toBe(second);
    vi.useRealTimers();
  });

  it('safeGetItem without parser returns parsed JSON', () => {
    const payload = { foo: 'bar' };
    localStorage.setItem('foo', JSON.stringify(payload));
    const value = safeGetItem('foo', {} as { foo: string });
    expect(value).toEqual(payload);
  });
});
