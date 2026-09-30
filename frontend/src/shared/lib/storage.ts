import { STORAGE_PREFIX } from '@/shared/config/constants';

type StorageKind = 'local' | 'session';

function getBackend(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    //приватный режим или запрещён доступ
    return null;
  }
}

function createStorage(kind: StorageKind) {
  return {
    get<T>(key: string, fallback: T): T {
      const raw = getBackend(kind)?.getItem(STORAGE_PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    },
    set<T>(key: string, value: T): boolean {
      try {
        getBackend(kind)?.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key: string): void {
      getBackend(kind)?.removeItem(STORAGE_PREFIX + key);
    },
  };
}

export const storage = createStorage('local');
export const sessionStore = createStorage('session');
