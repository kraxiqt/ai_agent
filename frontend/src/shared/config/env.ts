//точка доступа к переменным окружениям
export const env = {
  API_URL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, ''),
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'AI Chat',
  MODE: import.meta.env.MODE,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
