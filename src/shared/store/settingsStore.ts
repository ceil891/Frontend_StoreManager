import { create } from 'zustand';

interface InventorySettings {
  lowStockThreshold: number; // Threshold để cảnh báo tồn kho thấp (mặc định 10)
}

interface SettingsState {
  inventorySettings: InventorySettings;
  setLowStockThreshold: (threshold: number) => void;
  getLowStockThreshold: () => number;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  inventorySettings: {
    lowStockThreshold: 10, // Mặc định threshold là 10
  },

  setLowStockThreshold: (threshold: number) => {
    set((state) => ({
      inventorySettings: {
        ...state.inventorySettings,
        lowStockThreshold: Math.max(0, threshold), // Không cho phép số âm
      },
    }));
    // Lưu vào localStorage để persist
    localStorage.setItem(
      'inventory_settings',
      JSON.stringify({ lowStockThreshold: threshold })
    );
  },

  getLowStockThreshold: () => {
    const state = get();
    return state.inventorySettings.lowStockThreshold;
  },
}));

// Khôi phục settings từ localStorage khi app load
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('inventory_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      useSettingsStore.setState({
        inventorySettings: parsed,
      });
    } catch (e) {
      console.warn('Failed to restore settings from localStorage', e);
    }
  }
}
