import axios from 'axios';
import type {
  AddCartItemRequest,
  CartResponse,
  CheckoutValidationResult,
  UpdateCartItemRequest,
} from '../features/cart/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Dedicated Axios instance for Cart API.
 * - Auto-attaches Bearer JWT (from localStorage) if present.
 * - Auto-attaches Guest-Token header if present.
 * - Saves backend-generated Guest-Token into localStorage automatically.
 */
const cartAxios = axios.create({
  baseURL: `${BASE_URL}/cart`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach auth headers
cartAxios.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Guest-Token: chỉ đính kèm khi KHÔNG có JWT (tránh nhầm lẫn)
  if (!accessToken) {
    const guestToken = localStorage.getItem('guest_cart_token');
    if (guestToken) {
      config.headers['Guest-Token'] = guestToken;
    }
  }

  return config;
});

// Response interceptor – save backend-generated Guest-Token + unwrap ApiResponse
cartAxios.interceptors.response.use(
  (response) => {
    // Lưu Guest-Token mới nếu backend sinh
    const newGuestToken = response.headers['guest-token'];
    if (newGuestToken) {
      localStorage.setItem('guest_cart_token', newGuestToken);
    }

    // Unwrap Spring Boot ApiResponse: { success, status, data }
    const res = response.data;
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) return res.data;
      return Promise.reject({ code: res.errorCode, message: res.message });
    }
    return res;
  },
  (error) => {
    const errorBody = error.response?.data;
    return Promise.reject({
      code: errorBody?.errorCode || 'CART_ERROR',
      message: errorBody?.message || error.message || 'Lỗi giỏ hàng',
    });
  }
);

// ─── API Functions ───────────────────────────────────────────

export const cartApi = {
  /** Lấy giỏ hàng hiện tại. */
  getCart: (): Promise<CartResponse> => cartAxios.get('/'),

  /** Thêm sản phẩm vào giỏ hàng. */
  addItem: (data: AddCartItemRequest): Promise<CartResponse> =>
    cartAxios.post('/items', data),

  /** Cập nhật số lượng. quantity=0 → xóa item. */
  updateItem: (itemId: number, data: UpdateCartItemRequest): Promise<CartResponse> =>
    cartAxios.put(`/items/${itemId}`, data),

  /** Xóa 1 sản phẩm. */
  removeItem: (itemId: number): Promise<CartResponse> =>
    cartAxios.delete(`/items/${itemId}`),

  /** Xóa toàn bộ giỏ hàng. */
  clearCart: (): Promise<CartResponse> => cartAxios.delete('/'),

  /**
   * Merge guest cart vào user cart sau đăng nhập.
   * Cần đính kèm cả JWT (auto) lẫn Guest-Token.
   */
  mergeCart: (guestToken: string): Promise<CartResponse> =>
    cartAxios.post('/merge', null, {
      headers: { 'Guest-Token': guestToken },
    }),

  /** Validate giỏ hàng trước checkout (check giá, variant còn bán). */
  validateCheckout: (): Promise<CheckoutValidationResult> =>
    cartAxios.get('/validate'),
};
