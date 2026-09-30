import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth';
import { ROUTES } from './routes';

/**
 * Обратная сторона ProtectedRoute: /login и /register не нужны тому, кто уже вошёл —
 * отправляем сразу в чат, а не показываем форму входа поверх активной сессии.
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }

  return <>{children}</>;
}
