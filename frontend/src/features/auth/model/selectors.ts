import type { AuthState } from './store';

export const selectUser = (state: AuthState) => state.user;
export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAuthStatus = (state: AuthState) => state.status;
