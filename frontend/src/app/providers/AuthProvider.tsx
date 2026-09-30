import { useEffect, useState, type ReactNode } from 'react';
import { authApi, ensureFreshAccessToken } from '@/features/auth';
import { tokenStorage } from '@/features/auth/lib/tokenStorage';
import { useAuthStore } from '@/features/auth/model/store';
import { Spinner } from '@/shared/ui';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      useAuthStore.getState().setStatus('loading');

      if (!tokenStorage.getRefreshToken()) {
        if (!cancelled) useAuthStore.getState().setStatus('unauthenticated');
        return;
      }

      const accessToken = await ensureFreshAccessToken();
      if (!accessToken) {
        if (!cancelled) useAuthStore.getState().setStatus('unauthenticated');
        return;
      }

      try {
        const user = await authApi.me();
        if (!cancelled) useAuthStore.getState().setSession(user, { accessToken });
      } catch {
        tokenStorage.clear();
        if (!cancelled) useAuthStore.getState().clearSession();
      }
    }

    void bootstrap().finally(() => {
      if (!cancelled) setIsBootstrapping(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isBootstrapping) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner size="lg" label="Проверяем сессию" />
      </div>
    );
  }

  return <>{children}</>;
}
