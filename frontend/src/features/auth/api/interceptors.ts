import { addRequestInterceptor, setUnauthorizedHandler } from '@/shared/api/baseClient';
import { authApi } from './authApi';
import { isTokenExpired } from '../lib/jwt';
import { tokenStorage } from '../lib/tokenStorage';
import { useAuthStore } from '../model/store';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const tokens = await authApi.refresh(refreshToken);
    tokenStorage.setRefreshToken(tokens.refreshToken ?? refreshToken);
    useAuthStore.getState().setAccessToken(tokens.accessToken);
    return tokens.accessToken;
  } catch {
    tokenStorage.clear();
    useAuthStore.getState().clearSession();
    return null;
  }
}

//для того, чтобы не было накладки вылетов 401. Отправим бэку 1
export function ensureFreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function setupAuthInterceptors(): void {
  //если access token уже истёк (по exp), освежаем его ДО отправки запроса —
  addRequestInterceptor(async (init, _url, config) => {
    if (config.skipAuthRefresh) return init;

    let accessToken = useAuthStore.getState().accessToken;
    if (accessToken && isTokenExpired(accessToken)) {
      accessToken = await ensureFreshAccessToken();
    }
    if (!accessToken) return init;
    return {
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${accessToken}` },
    };
  });

  //backend всё равно может вернуть 401 раньше exp
  setUnauthorizedHandler(() => ensureFreshAccessToken());
}
