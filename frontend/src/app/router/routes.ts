export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',
  CHAT: '/chat',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
