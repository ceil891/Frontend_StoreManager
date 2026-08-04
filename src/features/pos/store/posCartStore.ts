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

  // Derived: always reflects the active tab's items & customer
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

/** Helper: get the active tab safely */
const getActiveTab = (tabs: CartTab[], activeTabId: string): CartTab =>
  tabs.find((t) => t.id === activeTabId) ?? tabs[0];

/** Helper: after modifying tabs, re-derive items & customer from activeTabId */
const deriveFromActive = (tabs: CartTab[], activeTabId: string) => {
  const active = getActiveTab(tabs, activeTabId);
  return { items: active.items, customer: active.customer };
};

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      tabs: [DEFAULT_TAB],
      activeTabId: 'tab_1',
      items: [],
      customer: null,

      addItem: (product) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const existing = activeTab.items.find((item) => item.id === product.id);
          const updatedItems = existing
            ? activeTab.items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
              )
            : [...activeTab.items, { ...product, quantity: 1, discount: 0 }];

          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, items: updatedItems } : t
          );

          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedItems = activeTab.items.filter((item) => item.id !== id);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, items: updatedItems } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedItems =
            quantity <= 0
              ? activeTab.items.filter((item) => item.id !== id)
              : activeTab.items.map((item) => (item.id === id ? { ...item, quantity } : item));

          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, items: updatedItems } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      setCustomer: (customer) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, customer } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      clearCart: () =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, items: [], customer: null } : t
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
        const newTabId = `tab_${Date.now()}`;
        const tabCount = state.tabs.length + 1;
        const newTab: CartTab = {
          id: newTabId,
          name: `Đơn tạm ${tabCount}`,
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
          // Last tab — just clear it instead of removing
          const clearedTabs = state.tabs.map((t) =>
            t.id === id ? { ...t, items: [], customer: null } : t
          );
          set({ tabs: clearedTabs, items: [], customer: null });
          return;
        }
        const updatedTabs = state.tabs.filter((t) => t.id !== id);
        // Switch to previous tab or the last available
        const newActive =
          state.activeTabId === id
            ? updatedTabs[updatedTabs.length - 1]
            : updatedTabs.find((t) => t.id === state.activeTabId) ?? updatedTabs[0];
        set({
          tabs: updatedTabs,
          activeTabId: newActive.id,
          items: newActive.items,
          customer: newActive.customer,
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
      // Only persist tab data, not derived items/customer
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
      // After rehydration, re-derive items & customer from the active tab
      onRehydrateStorage: () => (state) => {
        if (state) {
          const activeTab =
            state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0];
          if (activeTab) {
            state.items = activeTab.items;
            state.customer = activeTab.customer;
          }
        }
      },
    }
  )
);
