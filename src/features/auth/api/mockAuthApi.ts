import type {
  LoginCredentials,
  LoginResponse,
} from '../types';
import { axiosClient, uninterceptedAuthClient } from '@/shared/lib/axiosClient';

export const mockAuthApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const identifier = credentials.username || credentials.email || '';
    const data = await axiosClient.post<any, LoginResponse>('/auth/login', {
      username: identifier,
      password: credentials.password,
    });
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      // Spring Boot expects RefreshTokenRequest { refreshToken }
      // Dùng uninterceptedAuthClient để tránh kích hoạt lại 401 interceptor
      await uninterceptedAuthClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }
  },
};

