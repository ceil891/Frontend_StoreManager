import { create } from 'zustand';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface ColorRecord {
  id: string;
  colorCode: string;
  colorName: string;
  hexCode: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface ColorState {
  colors: ColorRecord[];
  isLoading: boolean;
  error: string | null;

  fetchColors: () => Promise<void>;
  addColor: (color: Omit<ColorRecord, 'id'>) => Promise<void>;
  updateColor: (id: string, data: Partial<ColorRecord>) => Promise<void>;
  deleteColor: (id: string) => Promise<void>;
}

export const useColorStore = create<ColorState>()((set, get) => ({
  colors: [],
  isLoading: false,
  error: null,

  fetchColors: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosClient.get<any, any[]>('/colors?includeDeleted=false');
      const mapped = (res || []).map((c: any) => ({
        id: String(c.id),
        colorCode: c.colorCode || '',
        colorName: c.colorName || '',
        hexCode: c.hexValue || '#000000',
        description: c.description || '',
        status: (c.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      }));
      const currentLocal = get().colors || [];
      const merged = [...mapped];
      currentLocal.forEach(loc => {
        if (!merged.some(m => String(m.id) === String(loc.id) || m.colorCode === loc.colorCode)) {
          merged.push(loc);
        }
      });
      set({ colors: merged, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch colors:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách màu sắc' });
    }
  },

  addColor: async (color) => {
    const tempId = `clr_${Date.now()}`;
    const newRecord: ColorRecord = {
      id: tempId,
      ...color,
    };
    set((state) => ({ colors: [newRecord, ...state.colors] }));

    try {
      const payload = {
        colorCode: color.colorCode,
        colorName: color.colorName,
        hexValue: color.hexCode,
        description: color.description || '',
        isActive: color.status === 'ACTIVE',
      };
      await axiosClient.post('/colors', payload);
      await get().fetchColors();
    } catch (err: any) {
      console.error('Failed to post color to API, kept in local state:', err);
    }
  },

  updateColor: async (id, data) => {
    set((state) => ({
      colors: state.colors.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    try {
      const original = get().colors.find((c) => c.id === id);
      const payload = {
        colorCode: data.colorCode || original?.colorCode,
        colorName: data.colorName || original?.colorName,
        hexValue: data.hexCode || original?.hexCode,
        description: data.description !== undefined ? data.description : original?.description,
      };
      await axiosClient.put(`/colors/${id}`, payload);
      if (data.status !== undefined) {
        await axiosClient.put(`/colors/${id}/status?isActive=${data.status === 'ACTIVE'}`).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to update color on API:', err);
    }
  },

  deleteColor: async (id) => {
    set((state) => ({
      colors: state.colors.filter((c) => c.id !== id),
    }));
    try {
      await axiosClient.delete(`/colors/${id}`).catch(() => {});
    } catch (err: any) {
      console.error('Failed to delete color on API:', err);
    }
  },
}));
