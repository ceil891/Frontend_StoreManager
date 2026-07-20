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
      const mapped = res.map((c: any) => ({
        id: String(c.id),
        colorCode: c.colorCode || '',
        colorName: c.colorName || '',
        hexCode: c.hexValue || '#000000',
        description: c.description || '',
        status: (c.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      }));
      set({ colors: mapped, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch colors:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách màu sắc' });
    }
  },

  addColor: async (color) => {
    set({ isLoading: true, error: null });
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
      console.error('Failed to add color:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tạo màu sắc mới' });
      throw err;
    }
  },

  updateColor: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const original = get().colors.find((c) => c.id === id);
      const payload = {
        colorCode: data.colorCode || original?.colorCode,
        colorName: data.colorName || original?.colorName,
        hexValue: data.hexCode || original?.hexCode,
        description: data.description !== undefined ? data.description : original?.description,
      };
      await axiosClient.put(`/colors/${id}`, payload);

      if (data.status !== undefined && original && (data.status === 'ACTIVE') !== (original.status === 'ACTIVE')) {
        await axiosClient.put(`/colors/${id}/status?isActive=${data.status === 'ACTIVE'}`);
      }

      await get().fetchColors();
    } catch (err: any) {
      console.error('Failed to update color:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật màu sắc' });
      throw err;
    }
  },

  deleteColor: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosClient.put(`/colors/${id}/status?isActive=false`);
      await axiosClient.delete(`/colors/${id}`);
      await get().fetchColors();
    } catch (err: any) {
      console.error('Failed to delete color:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi xóa màu sắc' });
      throw err;
    }
  },
}));
