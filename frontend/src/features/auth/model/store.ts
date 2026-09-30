import { create } from 'zustand';
import type { User } from '@/entities/user';
import type { AuthStatus, AuthTokens } from './types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  setSession: (user: User, tokens: AuthTokens) => void;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  clearSession: () => void;
}

// @ts-ignore TODO()
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  status: 'idle',
  setSession: (user, tokens) =>
    set({ user, accessToken: tokens.accessToken, isAuthenticated: true, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clearSession: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, status: 'unauthenticated' }),
}));
