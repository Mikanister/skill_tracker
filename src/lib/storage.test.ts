import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeSetItem, safeGetItem, safeRemoveItem, generateId, validators } from './storage';

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
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw error; });
    const ok = safeSetItem('key', { foo: 'bar' });
    expect(ok).toBe(false);
  });

  it('safeGetItem returns default when key missing', () => {
    const value = safeGetItem('missing', 42);
    expect(value).toBe(42);
  });

  it('safeGetItem returns parsed value when validator passes', () => {
    localStorage.setItem('foo', JSON.stringify({ bar: 1 }));
    const value = safeGetItem('foo', {}, data => 'bar' in data);
    expect(value).toEqual({ bar: 1 });
  });

  it('safeGetItem falls back when validator fails', () => {
    localStorage.setItem('foo', JSON.stringify({ bar: 1 }));
    const value = safeGetItem('foo', { baz: 2 }, data => 'baz' in data);
    expect(value).toEqual({ baz: 2 });
  });

  it('safeGetItem handles malformed JSON', () => {
    localStorage.setItem('foo', '{ not json');
    const value = safeGetItem('foo', 'fallback');
    expect(value).toBe('fallback');
  });

  it('safeRemoveItem removes value without throwing', () => {
    localStorage.setItem('foo', 'bar');
    safeRemoveItem('foo');
    expect(localStorage.getItem('foo')).toBeNull();
  });

  it('generateId includes prefix when provided', () => {
    const id = generateId('test');
    expect(id.startsWith('test_')).toBe(true);
    expect(id.split('_')).toHaveLength(3);
  });

  it('validators work as expected', () => {
    expect(validators.isFightersArray([{ id: 'f1', name: 'Alpha' }])).toBe(true);
    expect(validators.isFightersArray([{ id: 1 }])).toBe(false);

    expect(validators.isTasksV2Array([{ id: 't1', title: 'Task', assignees: [] }])).toBe(true);
    expect(validators.isTasksV2Array([{ id: 't1', title: 123, assignees: [] }])).toBe(false);

    expect(validators.isSkillTree({ categories: [], version: 1 })).toBe(true);
    expect(validators.isSkillTree(null)).toBe(false);
  });
});
