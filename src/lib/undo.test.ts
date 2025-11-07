import { describe, it, expect, beforeEach } from 'vitest';
import { UndoManager, type UndoAction } from './undo';

const mkAction = (id: string): UndoAction => ({
  id,
  type: 'delete_task',
  description: `Action ${id}`,
  data: { foo: id },
  timestamp: Date.now()
});

describe('UndoManager', () => {
  let manager: UndoManager;

  beforeEach(() => {
    manager = new UndoManager();
  });

  it('pushes and pops last action', () => {
    const a1 = mkAction('a1');
    const a2 = mkAction('a2');

    manager.push(a1);
    manager.push(a2);

    expect(manager.size).toBe(2);
    expect(manager.peek()).toEqual(a2);

    expect(manager.pop()).toEqual(a2);
    expect(manager.pop()).toEqual(a1);
    expect(manager.pop()).toBeUndefined();
  });

  it('caps stack at max size', () => {
    for (let i = 0; i < 11; i++) {
      manager.push(mkAction(`a${i}`));
    }
    expect(manager.size).toBeLessThanOrEqual(10);
    // Oldest action should be dropped
    expect(manager.pop()!.id).toBe('a10');
  });

  it('clears stack', () => {
    manager.push(mkAction('a1'));
    manager.push(mkAction('a2'));
    expect(manager.size).toBe(2);
    manager.clear();
    expect(manager.size).toBe(0);
    expect(manager.pop()).toBeUndefined();
  });
});
