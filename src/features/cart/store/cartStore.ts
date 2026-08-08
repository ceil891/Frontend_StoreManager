import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cartApi } from '@/api/cartApi';
import type { CartItem } from '../types';

// ─────────────────────────────────────────────────────────────
// State & Actions
// ─────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  cartId: number | null;
  isLoading: boolean;
  isSyncing: boolean; // background sync indicator
}

interface CartActions {
  /** Background sync – hiển thị local ngay, diff với backend */
  fetchCart: () => Promise<void>;

  /** Thêm Sản Phẩm – optimistic update */
  addItem: (variantId: number, quantity?: number) => Promise<void>;

  /** Cập nhật số lượng – optimistic update. quantity=0 → xóa */
  updateItem: (itemId: number, quantity: number) => Promise<void>;

  /** Xóa 1 sản phẩm – optimistic update */
  removeItem: (itemId: number) => Promise<void>;

  /** Xóa toàn bộ giỏ hàng */
  clearCart: () => Promise<void>;

  /**
   * Gọi sau khi đăng nhập thành công.
   * Merge guest cart → user cart → sync lại.
   */
  mergeAndSync: (guestToken: string) => Promise<void>;

  /** Reset store (khi logout) */
  reset: () => void;
}

type CartStore = CartState & CartActions;

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      items: [],
      cartId: null,
      isLoading: false,
      isSyncing: false,

      // ── fetchCart (background sync) ──────────────────────────
      fetchCart: async () => {
        set({ isSyncing: true });
        try {
          const response = await cartApi.getCart();
          // Diff: chỉ update nếu backend trả khác local (tránh re-render không cần)
          const current = get().items;
          const serverItems = response.items ?? [];
          const hasChanged =
            JSON.stringify(current.map((i) => ({ id: i.itemId, qty: i.quantity }))) !==
            JSON.stringify(serverItems.map((i) => ({ id: i.itemId, qty: i.quantity })));

          if (hasChanged) {
            set({ items: serverItems, cartId: response.cartId });
          }
        } catch {
          // Không throw – background sync fail không block UI
        } finally {
          set({ isSyncing: false });
        }
      },

      // ── addItem ──────────────────────────────────────────────
      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true });
        try {
          const response = await cartApi.addItem({ productVariantId: variantId, quantity });
          set({ items: response.items ?? [], cartId: response.cartId, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // ── updateItem ───────────────────────────────────────────
      updateItem: async (itemId, quantity) => {
        // Optimistic: update local ngay
        const prevItems = get().items;
        if (quantity === 0) {
          set({ items: prevItems.filter((i) => i.itemId !== itemId) });
        } else {
          set({
            items: prevItems.map((i) =>
              i.itemId === itemId
                ? { ...i, quantity, subtotal: i.unitPrice * quantity }
                : i
            ),
          });
        }

        try {
          const response = await cartApi.updateItem(itemId, { quantity });
          // Confirm với server response
          set({ items: response.items ?? [], cartId: response.cartId });
        } catch {
          // Rollback nếu API fail
          set({ items: prevItems });
        }
      },

      // ── removeItem ───────────────────────────────────────────
      removeItem: async (itemId) => {
        const prevItems = get().items;
        // Optimistic remove
        set({ items: prevItems.filter((i) => i.itemId !== itemId) });

        try {
          const response = await cartApi.removeItem(itemId);
          set({ items: response.items ?? [], cartId: response.cartId });
        } catch {
          set({ items: prevItems });
        }
      },

      // ── clearCart ────────────────────────────────────────────
      clearCart: async () => {
        set({ isLoading: true });
        try {
          await cartApi.clearCart();
          set({ items: [], cartId: null, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // ── mergeAndSync ─────────────────────────────────────────
      mergeAndSync: async (guestToken: string) => {
        try {
          const response = await cartApi.mergeCart(guestToken);
          set({ items: response.items ?? [], cartId: response.cartId });
          // Dọn dẹp guest token sau merge
          localStorage.removeItem('guest_cart_token');
        } catch {
          // Merge fail không block login – giữ nguyên local items
        }
      },

      // ── reset ────────────────────────────────────────────────
      reset: () => set({ items: [], cartId: null, isLoading: false, isSyncing: false }),
    }),
    {
      name: 'retailhub-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

export const useCartItems = () => useCartStore((s) => s.items);
export const useCartTotalQuantity = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
export const useCartTotalAmount = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.subtotal, 0));
export const useCartIsLoading = () => useCartStore((s) => s.isLoading);
