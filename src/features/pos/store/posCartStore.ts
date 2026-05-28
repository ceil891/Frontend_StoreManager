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

interface PosCartState {
  items: CartItem[];
  customer: { id: string; name: string } | null;
  addItem: (product: PosProduct) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCustomer: (customer: { id: string; name: string } | null) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      
      addItem: (product) => set((state) => {
        const existing = state.items.find((item) => item.id === product.id);
        if (existing) {
          return {
            items: state.items.map((item) => 
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          };
        }
        return { items: [...state.items, { ...product, quantity: 1, discount: 0 }] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter((item) => item.id !== id) };
        }
        return {
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        };
      }),

      setCustomer: (customer) => set({ customer }),
      
      clearCart: () => set({ items: [], customer: null }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity) - item.discount, 0);
      }
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);
