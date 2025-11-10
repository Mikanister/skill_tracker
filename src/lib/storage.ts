/**
 * Safe localStorage utilities with error handling
 */

export function safeSetItem(key: string, value: any): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // Could show toast notification here
    } else {
      console.error('Failed to save to localStorage:', error);
    }
    return false;
  }
}

export function safeGetItem<T>(key: string, defaultValue: T, parser?: (data: unknown) => T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    if (parser) {
      return parser(parsed);
    }
    
    return parsed as T;
  } catch (error) {
    console.error(`Failed to load from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from localStorage (key: ${key}):`, error);
  }
}

/**
 * Generate unique ID with timestamp and random component
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}
