import { sessionStore } from '@/shared/lib/storage';
import { AUTH_STORAGE_KEYS } from './constants';

/**
 * Access token хранится только в памяти (см. model/store.ts) так он недоступен через
 * localStorage/sessionStorage
 */
export const tokenStorage = {
  getRefreshToken(): string | null {
    return sessionStore.get<string | null>(AUTH_STORAGE_KEYS.REFRESH_TOKEN, null);
  },
  setRefreshToken(token: string): void {
    sessionStore.set(AUTH_STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  clear(): void {
    sessionStore.remove(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  },
};
