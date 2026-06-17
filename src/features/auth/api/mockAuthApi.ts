import type {
  LoginCredentials,
  LoginResponse,
} from '../types';
import { axiosClient } from '@/shared/lib/axiosClient';

export const mockAuthApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Spring Boot expects 'username' instead of 'email' in LoginRequest
    const data = await axiosClient.post<any, LoginResponse>('/auth/login', {
      username: credentials.email,
      password: credentials.password,
    });
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      // Spring Boot expects RefreshTokenRequest { refreshToken }
      await axiosClient.post('/auth/logout', { refreshToken });
    }
  },
};

