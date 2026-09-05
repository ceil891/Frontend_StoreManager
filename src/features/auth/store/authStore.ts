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
import { axiosClient } from '@/shared/lib/axiosClient';
import { recordActivity } from '@/shared/utils/activityLogger';
import { useCartStore } from '@/features/cart/store/cartStore';

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
  loadPermissions: () => Promise<void>;
  // Used by axios interceptor to refresh tokens
  setAccessToken: (token: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
}

// ----------------------------------------------------------------
// Store
// ----------------------------------------------------------------
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
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

          // Lưu token vào localStorage để axiosClient sử dụng
          localStorage.setItem('access_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);

          // Ưu tiên lấy permissions từ login response (backend đã resolve từ role)
          let permissions: string[] = [];
          if (response.user.permissions && Array.isArray(response.user.permissions) && response.user.permissions.length > 0) {
            permissions = response.user.permissions;
            console.log('[AuthStore] Permissions từ login response (role-based):', permissions);
          } else {
            // Fallback: gọi API riêng nếu login response không trả permissions
            try {
              const permRes = await axiosClient.get<any, string[]>('/auth/me/permissions');
              console.log('[AuthStore] /auth/me/permissions fallback response:', permRes);
              permissions = Array.isArray(permRes) ? permRes : [];
            } catch (permErr) {
              console.error('[AuthStore] Failed to fetch permissions:', permErr);
              permissions = [];
            }
          }

          const rawUser = response.user as any;
          const resolvedBranchId = rawUser?.branchId ? String(rawUser.branchId) : rawUser?.branch?.id ? String(rawUser.branch.id) : null;
          const resolvedBranchCode = rawUser?.branchCode || rawUser?.branch?.branchCode || null;
          const resolvedBranchName = rawUser?.branchName || rawUser?.branch?.branchName || rawUser?.branchLocation || null;

          set({
            user: {
              ...response.user,
              id: String(response.user.id),
              branchId: resolvedBranchId,
              branchCode: resolvedBranchCode,
              branchName: resolvedBranchName,
              permissions,
            },
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

          // Merge guest cart → user cart (non-critical: lỗi không block login)
          const guestToken = localStorage.getItem('guest_cart_token');
          if (guestToken) {
            try {
              await useCartStore.getState().mergeAndSync(guestToken);
            } catch (mergeErr) {
              console.warn('[AuthStore] Cart merge failed (non-critical):', mergeErr);
            }
          }
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

      /** Refresh lại danh sách quyền của user (dùng khi admin vừa thay đổi quyền) */
      loadPermissions: async () => {
        const { user } = get();
        if (!user) return;
        try {
          // axiosClient interceptor đã unwrap ApiResponse.data rồi → permRes là string[] trực tiếp
          const permRes = await axiosClient.get<any, string[]>('/auth/me/permissions');
          const permissions: string[] = Array.isArray(permRes) ? permRes : [];
          set((state) => ({
            user: state.user ? { ...state.user, permissions } : null,
          }));
        } catch {
          // Giữ nguyên quyền cũ nếu lỗi mạng
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await mockAuthApi.logout().catch(() => {});
        } finally {
          // Xóa token và auth persist state khỏi localStorage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('retailhub-auth');

          // Reset cart store khi logout
          useCartStore.getState().reset();

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

      updateUser: (partialUser) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updated = { ...currentUser, ...partialUser };
        set({ user: updated });
      },
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
      onRehydrateStorage: () => (state) => {
        // Sanity check: nếu isAuthenticated là true nhưng user, role hoặc access_token bị null, tự động reset
        const hasToken = !!localStorage.getItem('access_token');
        if (state && state.isAuthenticated && (!state.user || !state.user.role || !hasToken)) {
          console.warn('[AuthStore] Corrupted or expired auth state detected on rehydrate. Resetting auth state.');
          useAuthStore.setState({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('retailhub-auth');
        }
      },
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
/** Trả về danh sách permissionCode thực của user hiện tại từ backend */
export const useAuthPermissions = (): string[] =>
  useAuthStore((s) => s.user?.permissions ?? []);
