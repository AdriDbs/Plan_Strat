const SIZE_LIMIT = 4 * 1024 * 1024; // 4MB

export const saveToStorage = (key: string, data: unknown): boolean => {
  try {
    const serialized = JSON.stringify(data);
    if (serialized.length > SIZE_LIMIT) {
      console.warn(`Storage: key "${key}" exceeds 4MB limit (${(serialized.length / 1024 / 1024).toFixed(2)}MB), not persisting.`);
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error(`Storage: failed to save "${key}"`, e);
    return false;
  }
};

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (_e) {
    // ignore
  }
};
