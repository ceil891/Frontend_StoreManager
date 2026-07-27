import { create } from 'zustand';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface SizeRecord {
  id: string;
  sizeCode: string;
  sizeName: string;
  sizeGroup: 'CLOTHING' | 'SHOES' | 'ACCESSORIES' | 'GENERAL';
  sortOrder: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface SizeState {
  sizes: SizeRecord[];
  isLoading: boolean;
  error: string | null;

  fetchSizes: () => Promise<void>;
  addSize: (size: Omit<SizeRecord, 'id'>) => Promise<void>;
  updateSize: (id: string, data: Partial<SizeRecord>) => Promise<void>;
  deleteSize: (id: string) => Promise<void>;
}

export const useSizeStore = create<SizeState>()((set, get) => ({
  sizes: [],
  isLoading: false,
  error: null,

  fetchSizes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosClient.get<any, any[]>('/sizes?includeDeleted=false');
      const mapped = res.map((s: any) => ({
        id: String(s.id),
        sizeCode: s.sizeCode || '',
        sizeName: s.sizeName || '',
        sizeGroup: 'GENERAL' as const, // Fallback do DB chưa lưu nhóm
        sortOrder: 1, // Fallback
        description: s.description || '',
        status: (s.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      }));
      set({ sizes: mapped, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch sizes:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách kích thước' });
    }
  },

  addSize: async (size) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        sizeCode: size.sizeCode,
        sizeName: size.sizeName,
        description: size.description || '',
        isActive: size.status === 'ACTIVE',
      };
      await axiosClient.post('/sizes', payload);
      await get().fetchSizes();
    } catch (err: any) {
      console.error('Failed to add size:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tạo kích thước mới' });
      throw err;
    }
  },

  updateSize: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const original = get().sizes.find((s) => s.id === id);
      const payload = {
        sizeCode: data.sizeCode || original?.sizeCode,
        sizeName: data.sizeName || original?.sizeName,
        description: data.description !== undefined ? data.description : original?.description,
      };
      await axiosClient.put(`/sizes/${id}`, payload);

      if (data.status !== undefined && original && (data.status === 'ACTIVE') !== (original.status === 'ACTIVE')) {
        await axiosClient.put(`/sizes/${id}/status?isActive=${data.status === 'ACTIVE'}`);
      }

      await get().fetchSizes();
    } catch (err: any) {
      console.error('Failed to update size:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật kích thước' });
      throw err;
    }
  },

  deleteSize: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosClient.put(`/sizes/${id}/status?isActive=false`);
      await axiosClient.delete(`/sizes/${id}`);
      await get().fetchSizes();
    } catch (err: any) {
      console.error('Failed to delete size:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi xóa kích thước' });
      throw err;
    }
  },
}));
