import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  sku: string;
}

export interface CartItem extends PosProduct {
  quantity: number;
  discount: number;
}

export interface CartTab {
  id: string;
  name: string;
  items: CartItem[];
  customer: { id: string; name: string } | null;
  createdAt: string;
}

const DEFAULT_TAB: CartTab = {
  id: 'tab_1',
  name: 'Đơn hàng 1',
  items: [],
  customer: null,
  createdAt: new Date().toISOString(),
};

interface PosCartState {
  tabs: CartTab[];
  activeTabId: string;

  // Helpers to get active cart items & customer
  items: CartItem[];
  customer: { id: string; name: string } | null;

  addItem: (product: PosProduct) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCustomer: (customer: { id: string; name: string } | null) => void;
  clearCart: () => void;
  getTotal: () => number;

  // Multi-tab actions for pending / in-progress orders
  createTab: () => string;
  switchTab: (id: string) => void;
  closeTab: (id: string) => void;
}

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      tabs: [DEFAULT_TAB],
      activeTabId: 'tab_1',
      items: [],
      customer: null,

      addItem: (product) =>
        set((state) => {
          const currentTab = state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
          const existing = currentTab.items.find((item) => item.id === product.id);
          const updatedItems = existing
            ? currentTab.items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
              )
            : [...currentTab.items, { ...product, quantity: 1, discount: 0 }];

          const updatedTabs = state.tabs.map((t) =>
            t.id === currentTab.id ? { ...t, items: updatedItems } : t
          );

          return {
            tabs: updatedTabs,
            items: updatedItems,
            customer: currentTab.customer,
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const currentTab = state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
          const updatedItems = currentTab.items.filter((item) => item.id !== id);
          const updatedTabs = state.tabs.map((t) =>
            t.id === currentTab.id ? { ...t, items: updatedItems } : t
          );
          return {
            tabs: updatedTabs,
            items: updatedItems,
          };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const currentTab = state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
          const updatedItems =
            quantity <= 0
              ? currentTab.items.filter((item) => item.id !== id)
              : currentTab.items.map((item) => (item.id === id ? { ...item, quantity } : item));

          const updatedTabs = state.tabs.map((t) =>
            t.id === currentTab.id ? { ...t, items: updatedItems } : t
          );
          return {
            tabs: updatedTabs,
            items: updatedItems,
          };
        }),

      setCustomer: (customer) =>
        set((state) => {
          const currentTab = state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
          const updatedTabs = state.tabs.map((t) =>
            t.id === currentTab.id ? { ...t, customer } : t
          );
          return {
            tabs: updatedTabs,
            customer,
          };
        }),

      clearCart: () =>
        set((state) => {
          const currentTab = state.tabs.find((t) => t.id === state.activeTabId) || state.tabs[0];
          const updatedTabs = state.tabs.map((t) =>
            t.id === currentTab.id ? { ...t, items: [], customer: null } : t
          );
          return {
            tabs: updatedTabs,
            items: [],
            customer: null,
          };
        }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity - item.discount, 0);
      },

      createTab: () => {
        const state = get();
        const nextIdx = state.tabs.length + 1;
        const newTabId = `tab_${Date.now()}`;
        const newTab: CartTab = {
          id: newTabId,
          name: `Đơn tạm ${nextIdx}`,
          items: [],
          customer: null,
          createdAt: new Date().toISOString(),
        };
        const updatedTabs = [...state.tabs, newTab];
        set({
          tabs: updatedTabs,
          activeTabId: newTabId,
          items: [],
          customer: null,
        });
        return newTabId;
      },

      switchTab: (id) => {
        const state = get();
        const targetTab = state.tabs.find((t) => t.id === id);
        if (targetTab) {
          set({
            activeTabId: id,
            items: targetTab.items,
            customer: targetTab.customer,
          });
        }
      },

      closeTab: (id) => {
        const state = get();
        if (state.tabs.length <= 1) {
          // If last tab, just clear it
          state.clearCart();
          return;
        }
        const updatedTabs = state.tabs.filter((t) => t.id !== id);
        const nextActive = updatedTabs[updatedTabs.length - 1];
        set({
          tabs: updatedTabs,
          activeTabId: nextActive.id,
          items: nextActive.items,
          customer: nextActive.customer,
        });
      },
    }),
    {
      name: 'pos-cart-storage-session',
      storage: {
        getItem: (name) => {
          try {
            const item = sessionStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch (e) {
            console.error(e);
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name);
          } catch (e) {
            console.error(e);
          }
        },
      },
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
