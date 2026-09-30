export const AUTH_STORAGE_KEYS = {
  REFRESH_TOKEN: 'auth:refreshToken',
} as const;

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
} as const;

//токен "искекает" заранее для autoRefresh
export const TOKEN_EXPIRY_LEEWAY_SECONDS = 10;
