import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { ChatLayout } from '@/app/layouts/ChatLayout';
import { MainLayout } from '@/app/layouts/MainLayout';
import {
  CallbackPage,
  ChatPage,
  LoginPage,
  NotFoundPage,
  RegisterPage,
} from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { ROUTES } from './routes';

export const router = createBrowserRouter([
  { path: ROUTES.ROOT, element: <Navigate to={ROUTES.CHAT} replace /> },
  {
    element: (
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>
    ),
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      { path: ROUTES.AUTH_CALLBACK, element: <CallbackPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <ChatLayout />,
        children: [{ path: ROUTES.CHAT, element: <ChatPage /> }],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
