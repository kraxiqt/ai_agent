import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth';
import { ROUTES } from './routes';

/**
 * К моменту рендера этого компонента AuthProvider уже завершил проверку сессии
 * (он не рендерит children, пока bootstrap не закончен), так что здесь нет гонки.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
