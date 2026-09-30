export type { User } from '@/entities/user';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: import('@/entities/user').User;
  tokens: AuthTokens;
}


//idle до первой проверки сессии
//loading идёт вход/регистрация/восстановление сессии
//authenticated / unauthenticated  итоговое состояние

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
