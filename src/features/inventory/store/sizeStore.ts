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

      // Apply LocalStorage Persistence Fallback
      let finalSizes = mapped;
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_sizes') || '[]');
        const editedMap: Record<string, SizeRecord> = JSON.parse(localStorage.getItem('retailhub_edited_sizes') || '{}');
        
        finalSizes = mapped
          .filter(s => !deletedIds.includes(String(s.id)) && !deletedIds.includes(s.sizeCode))
          .map(s => editedMap[s.id] ? { ...s, ...editedMap[s.id] } : s);

        // Include any newly added items stored locally
        Object.keys(editedMap).forEach(key => {
          if (!deletedIds.includes(key) && !finalSizes.some(s => s.id === key || s.sizeCode === editedMap[key].sizeCode)) {
            finalSizes.unshift(editedMap[key]);
          }
        });
      } catch (e) {}

      const unique = finalSizes.filter((s, idx, self) =>
        idx === self.findIndex((t) => String(t.id) === String(s.id) || (t.sizeName && t.sizeName.trim().toLowerCase() === s.sizeName.trim().toLowerCase()))
      );
      set({ sizes: unique, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch sizes:', err);
      // If API fails, try loading purely from local cache
      try {
        const editedMap: Record<string, SizeRecord> = JSON.parse(localStorage.getItem('retailhub_edited_sizes') || '{}');
        const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_sizes') || '[]');
        const localList = Object.values(editedMap).filter(s => !deletedIds.includes(s.id) && !deletedIds.includes(s.sizeCode));
        if (localList.length > 0) {
          set({ sizes: localList, isLoading: false });
          return;
        }
      } catch (e) {}
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
      const editedMap = JSON.parse(localStorage.getItem('retailhub_edited_sizes') || '{}');
      editedMap[tempId] = newRecord;
      localStorage.setItem('retailhub_edited_sizes', JSON.stringify(editedMap));

      const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_sizes') || '[]');
      const filteredDeleted = deletedIds.filter(id => id !== tempId && id !== size.sizeCode);
      localStorage.setItem('retailhub_deleted_sizes', JSON.stringify(filteredDeleted));
    } catch (e) {}

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
    const original = get().sizes.find((s) => s.id === id);
    const updated = original ? { ...original, ...data } : (data as SizeRecord);
    set((state) => ({
      sizes: state.sizes.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));

    try {
      const editedMap = JSON.parse(localStorage.getItem('retailhub_edited_sizes') || '{}');
      editedMap[id] = updated;
      localStorage.setItem('retailhub_edited_sizes', JSON.stringify(editedMap));
    } catch (e) {}

    try {
      const payload = {
        sizeCode: data.sizeCode || original?.sizeCode,
        sizeName: data.sizeName || original?.sizeName,
        description: data.description !== undefined ? data.description : original?.description,
        isActive: data.status !== undefined ? (data.status === 'ACTIVE') : (original?.status === 'ACTIVE'),
      };
      await axiosClient.put(`/sizes/${id}`, payload);
    } catch (err: any) {
      console.error('Failed to update size on API:', err);
    }
  },

  deleteSize: async (id) => {
    const target = get().sizes.find((s) => s.id === id);
    try {
      await axiosClient.delete(`/sizes/${id}`);
      set((state) => ({
        sizes: state.sizes.filter((s) => s.id !== id),
      }));

      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_sizes') || '[]');
        if (!deletedIds.includes(String(id))) deletedIds.push(String(id));
        if (target?.sizeCode && !deletedIds.includes(target.sizeCode)) deletedIds.push(target.sizeCode);
        localStorage.setItem('retailhub_deleted_sizes', JSON.stringify(deletedIds));

        const editedMap = JSON.parse(localStorage.getItem('retailhub_edited_sizes') || '{}');
        delete editedMap[id];
        if (target?.sizeCode) delete editedMap[target.sizeCode];
        localStorage.setItem('retailhub_edited_sizes', JSON.stringify(editedMap));
      } catch (e) {}
    } catch (err: any) {
      console.error('Failed to delete size on API:', err);
      throw err;
    }
  },
}));
