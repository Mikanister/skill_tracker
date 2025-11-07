/**
 * Undo/Redo system for deletions
 */

export type UndoAction = {
  id: string;
  type: 'delete_fighter' | 'delete_task' | 'delete_skill' | 'delete_category';
  description: string;
  data: any;
  timestamp: number;
};

export class UndoManager {
  private stack: UndoAction[] = [];
  private maxSize = 10;

  push(action: UndoAction) {
    this.stack.push(action);
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    }
  }

  pop(): UndoAction | undefined {
    return this.stack.pop();
  }

  peek(): UndoAction | undefined {
    return this.stack[this.stack.length - 1];
  }

  clear() {
    this.stack = [];
  }

  get size() {
    return this.stack.length;
  }
}
