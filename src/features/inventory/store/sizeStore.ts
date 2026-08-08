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
      const res = await axiosClient.get<any, any>('/sizes?includeDeleted=false');
      const rawList = Array.isArray(res) ? res : (res?.content || res?.data || []);
      const mapped: SizeRecord[] = (rawList || []).map((s: any) => ({
        id: String(s.id),
        sizeCode: s.sizeCode || '',
        sizeName: s.sizeName || '',
        sizeGroup: 'GENERAL' as const,
        sortOrder: 1,
        description: s.description || '',
        status: (s.isActive !== false ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      }));
      const unique = mapped.filter((s, idx, self) =>
        idx === self.findIndex((t) => String(t.id) === String(s.id) || (t.sizeName && t.sizeName.trim().toLowerCase() === s.sizeName.trim().toLowerCase()))
      );
      set({ sizes: unique, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch sizes:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi tải danh sách kích thước' });
    }
  },


  addSize: async (size) => {
    const tempId = `sz_${Date.now()}`;
    const newRecord: SizeRecord = {
      id: tempId,
      ...size,
    };
    set((state) => ({ sizes: [newRecord, ...state.sizes] }));

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
      console.error('Failed to post size to API, kept in local state:', err);
    }
  },

  updateSize: async (id, data) => {
    set((state) => ({
      sizes: state.sizes.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    try {
      const original = get().sizes.find((s) => s.id === id);
      const payload = {
        sizeCode: data.sizeCode || original?.sizeCode,
        sizeName: data.sizeName || original?.sizeName,
        description: data.description !== undefined ? data.description : original?.description,
      };
      await axiosClient.put(`/sizes/${id}`, payload);
      if (data.status !== undefined) {
        await axiosClient.put(`/sizes/${id}/status?isActive=${data.status === 'ACTIVE'}`).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to update size on API:', err);
    }
  },

  deleteSize: async (id) => {
    set((state) => ({
      sizes: state.sizes.filter((s) => s.id !== id),
    }));
    try {
      await axiosClient.delete(`/sizes/${id}`).catch(() => {});
    } catch (err: any) {
      console.error('Failed to delete size on API:', err);
    }
  },
}));
