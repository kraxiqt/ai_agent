import { apiClient } from '@/shared/api/baseClient';
import type { User } from '@/entities/user';
import { AUTH_ENDPOINTS } from '../lib/constants';
import type { AuthResponse, AuthTokens, LoginDto, RegisterDto } from '../model/types';

//login/register/refresh

export const authApi = {
  //skipAuthRefresh: true,  иначе неверный пароль
  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, dto, { skipAuthRefresh: true }),
  register: (dto: RegisterDto) =>
    apiClient.post<AuthResponse>(AUTH_ENDPOINTS.REGISTER, dto, { skipAuthRefresh: true }),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>(AUTH_ENDPOINTS.REFRESH, { refreshToken }, { skipAuthRefresh: true }),
  logout: () => apiClient.post<void>(AUTH_ENDPOINTS.LOGOUT, undefined, { skipAuthRefresh: true }),
  me: () => apiClient.get<User>(AUTH_ENDPOINTS.ME),
};
