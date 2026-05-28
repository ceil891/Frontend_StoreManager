// ============================================================
// LAYER 3: STATE — Zustand Auth Store (upgraded)
//
// RESPONSIBILITIES:
// - Gọi Service Layer (mockAuthApi), KHÔNG chứa fetch/axios.
// - Giữ trạng thái auth (user, tokens, loading, error).
// - Persist xuống localStorage để session sống qua F5.
// - Cung cấp selectors đơn giản để UI đọc dữ liệu.
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, RoleType, LoginCredentials, ApiError } from '../types';
import { mockAuthApi } from '../api/mockAuthApi';
import { recordActivity } from '@/shared/utils/activityLogger';

// ----------------------------------------------------------------
// State & Actions interface
// ----------------------------------------------------------------
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  loginAsync: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  // Used by axios interceptor to refresh tokens
  setAccessToken: (token: string) => void;
}

// ----------------------------------------------------------------
// Store
// ----------------------------------------------------------------
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      loginAsync: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await mockAuthApi.login(credentials);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          recordActivity({
            actionType: 'VIEW',
            moduleName: 'Hệ thống',
            pageName: 'Đăng nhập',
            entityType: 'AuthSession',
            entityId: response.user.id,
            entityLabel: response.user.email,
            description: `Đăng nhập thành công với vai trò ${response.user.role}.`,
          });
        } catch (err) {
          const apiError = err as ApiError;
          set({
            isLoading: false,
            error: apiError.message ?? 'An unexpected error occurred.',
          });
          // Re-throw so the UI can also react (e.g. shake animation)
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await mockAuthApi.logout();
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),

      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'retailhub-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields — never store sensitive computed state
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ----------------------------------------------------------------
// Selectors — call these in UI to minimize re-renders
// ----------------------------------------------------------------
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthRole = (): RoleType | null =>
  useAuthStore((s) => s.user?.role ?? null);
