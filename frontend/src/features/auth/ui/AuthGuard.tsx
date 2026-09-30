import type { ReactNode } from 'react';
import { useAuth } from '../model/hooks';

interface AuthGuardProps {
  children: ReactNode;
  //Что показать неавторизованному
  fallback?: ReactNode;
}

//Условный рендер по авторизации
export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();
  return <>{isAuthenticated ? children : fallback}</>;
}
