import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/shared/api/errorHandler';
import { authApi } from '../api/authApi';
import { tokenStorage } from '../lib/tokenStorage';
import { selectAuthStatus, selectIsAuthenticated, selectUser } from './selectors';
import { useAuthStore } from './store';
import type { LoginDto, RegisterDto } from './types';

//Текущая сессия. Не выполняет запросов , а только читает store
export function useAuth() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const status = useAuthStore(selectAuthStatus);
  return { user, isAuthenticated, status };
}

//loading/error
function useMutation<TArgs extends unknown[]>(action: (...args: TArgs) => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(undefined);
      try {
        await action(...args);
      } catch (err) {
        setError(getErrorMessage(err, 'Не удалось выполнить действие'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { run, loading, error };
}

export function useLogin() {
  const action = useCallback(async (dto: LoginDto) => {
    const { user, tokens } = await authApi.login(dto);
    if (tokens.refreshToken) tokenStorage.setRefreshToken(tokens.refreshToken);
    useAuthStore.getState().setSession(user, tokens);
  }, []);
  const { run, loading, error } = useMutation(action);
  return { login: run, loading, error };
}

export function useRegister() {
  const action = useCallback(async (dto: RegisterDto) => {
    const { user, tokens } = await authApi.register(dto);
    if (tokens.refreshToken) tokenStorage.setRefreshToken(tokens.refreshToken);
    useAuthStore.getState().setSession(user, tokens);
  }, []);
  const { run, loading, error } = useMutation(action);
  return { register: run, loading, error };
}

export function useLogout() {
  const action = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      //Локальную сессию чистим независимо от того, ответил ли backend
      tokenStorage.clear();
      useAuthStore.getState().clearSession();
    }
  }, []);
  const { run, loading, error } = useMutation(action);
  return { logout: run, loading, error };
}
