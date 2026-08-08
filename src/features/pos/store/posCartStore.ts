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

export interface VoucherInfo {
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
}

export interface CartTab {
  id: string;
  name: string;
  items: CartItem[];
  customer: { id: string; name: string; phone?: string } | null;
  customerPhone: string;
  selectedPaymentId: string;
  appliedVoucher: VoucherInfo | null;
  usedPoints: number;
  cashGiven: string;
  createdAt: string;
}

const DEFAULT_TAB: CartTab = {
  id: 'tab_1',
  name: 'Đơn hàng 1',
  items: [],
  customer: null,
  customerPhone: '',
  selectedPaymentId: 'fb-cash',
  appliedVoucher: null,
  usedPoints: 0,
  cashGiven: '',
  createdAt: new Date().toISOString(),
};

interface PosCartState {
  tabs: CartTab[];
  activeTabId: string;

  // Derived state: always reflects the active tab's properties
  items: CartItem[];
  customer: { id: string; name: string; phone?: string } | null;
  customerPhone: string;
  selectedPaymentId: string;
  appliedVoucher: VoucherInfo | null;
  usedPoints: number;
  cashGiven: string;

  addItem: (product: PosProduct) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCustomer: (customer: { id: string; name: string; phone?: string } | null) => void;
  setCustomerPhone: (phone: string) => void;
  setSelectedPaymentId: (paymentId: string) => void;
  setAppliedVoucher: (voucher: VoucherInfo | null) => void;
  setUsedPoints: (points: number) => void;
  setCashGiven: (cash: string) => void;
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

/** Helper: after modifying tabs, re-derive properties from activeTabId */
const deriveFromActive = (tabs: CartTab[], activeTabId: string) => {
  const active = getActiveTab(tabs, activeTabId);
  return {
    items: active.items || [],
    customer: active.customer || null,
    customerPhone: active.customerPhone || '',
    selectedPaymentId: active.selectedPaymentId || 'fb-cash',
    appliedVoucher: active.appliedVoucher || null,
    usedPoints: active.usedPoints || 0,
    cashGiven: active.cashGiven || '',
  };
};

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      tabs: [DEFAULT_TAB],
      activeTabId: 'tab_1',
      items: [],
      customer: null,
      customerPhone: '',
      selectedPaymentId: 'fb-cash',
      appliedVoucher: null,
      usedPoints: 0,
      cashGiven: '',

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

      setCustomerPhone: (customerPhone) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, customerPhone } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      setSelectedPaymentId: (selectedPaymentId) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, selectedPaymentId } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      setAppliedVoucher: (appliedVoucher) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, appliedVoucher } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      setUsedPoints: (usedPoints) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, usedPoints } : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
          };
        }),

      setCashGiven: (cashGiven) =>
        set((state) => {
          const activeTab = getActiveTab(state.tabs, state.activeTabId);
          const updatedTabs = state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, cashGiven } : t
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
            t.id === activeTab.id
              ? {
                  ...t,
                  items: [],
                  customer: null,
                  customerPhone: '',
                  selectedPaymentId: 'fb-cash',
                  appliedVoucher: null,
                  usedPoints: 0,
                  cashGiven: '',
                }
              : t
          );
          return {
            tabs: updatedTabs,
            ...deriveFromActive(updatedTabs, state.activeTabId),
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
          name: `Đơn hàng ${tabCount}`,
          items: [],
          customer: null,
          customerPhone: '',
          selectedPaymentId: 'fb-cash',
          appliedVoucher: null,
          usedPoints: 0,
          cashGiven: '',
          createdAt: new Date().toISOString(),
        };
        const updatedTabs = [...state.tabs, newTab];
        set({
          tabs: updatedTabs,
          activeTabId: newTabId,
          ...deriveFromActive(updatedTabs, newTabId),
        });
        return newTabId;
      },

      switchTab: (id) => {
        const state = get();
        const targetTab = state.tabs.find((t) => t.id === id);
        if (targetTab) {
          set({
            activeTabId: id,
            ...deriveFromActive(state.tabs, id),
          });
        }
      },

      closeTab: (id) => {
        const state = get();
        if (state.tabs.length <= 1) {
          // Last tab — just clear it instead of removing
          const clearedTabs = state.tabs.map((t) =>
            t.id === id
              ? {
                  ...t,
                  items: [],
                  customer: null,
                  customerPhone: '',
                  selectedPaymentId: 'fb-cash',
                  appliedVoucher: null,
                  usedPoints: 0,
                  cashGiven: '',
                }
              : t
          );
          set({
            tabs: clearedTabs,
            ...deriveFromActive(clearedTabs, state.activeTabId),
          });
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
          ...deriveFromActive(updatedTabs, newActive.id),
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          const derived = deriveFromActive(state.tabs, state.activeTabId);
          Object.assign(state, derived);
        }
      },
    }
  )
);
