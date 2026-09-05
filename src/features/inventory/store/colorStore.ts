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
      const res = await axiosClient.get<any, any>('/colors?includeDeleted=false');
      const rawList = Array.isArray(res) ? res : (res?.content || res?.data || []);
      const mapped: ColorRecord[] = (rawList || []).map((c: any) => ({
        id: String(c.id),
        colorCode: c.colorCode || '',
        colorName: c.colorName || '',
        hexCode: c.hexValue || c.hexCode || '#000000',
        description: c.description || '',
        status: (c.isActive !== false ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
      }));

      // Apply LocalStorage Persistence Fallback
      let finalColors = mapped;
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_colors') || '[]');
        const editedMap: Record<string, ColorRecord> = JSON.parse(localStorage.getItem('retailhub_edited_colors') || '{}');
        
        finalColors = mapped
          .filter(c => !deletedIds.includes(String(c.id)) && !deletedIds.includes(c.colorCode))
          .map(c => editedMap[c.id] ? { ...c, ...editedMap[c.id] } : c);

        // Include any newly added items stored locally
        Object.keys(editedMap).forEach(key => {
          if (!deletedIds.includes(key) && !finalColors.some(c => c.id === key || c.colorCode === editedMap[key].colorCode)) {
            finalColors.unshift(editedMap[key]);
          }
        });
      } catch (e) {}

      const unique = finalColors.filter((c, idx, self) =>
        idx === self.findIndex((t) => String(t.id) === String(c.id) || (t.colorName && t.colorName.trim().toLowerCase() === c.colorName.trim().toLowerCase()))
      );
      set({ colors: unique, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch colors:', err);
      // If API fails, try loading purely from local cache
      try {
        const editedMap: Record<string, ColorRecord> = JSON.parse(localStorage.getItem('retailhub_edited_colors') || '{}');
        const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_colors') || '[]');
        const localList = Object.values(editedMap).filter(c => !deletedIds.includes(c.id) && !deletedIds.includes(c.colorCode));
        if (localList.length > 0) {
          set({ colors: localList, isLoading: false });
          return;
        }
      } catch (e) {}
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
      const editedMap = JSON.parse(localStorage.getItem('retailhub_edited_colors') || '{}');
      editedMap[tempId] = newRecord;
      localStorage.setItem('retailhub_edited_colors', JSON.stringify(editedMap));

      const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_colors') || '[]');
      const filteredDeleted = deletedIds.filter(id => id !== tempId && id !== color.colorCode);
      localStorage.setItem('retailhub_deleted_colors', JSON.stringify(filteredDeleted));
    } catch (e) {}

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
    const original = get().colors.find((c) => c.id === id);
    const updated = original ? { ...original, ...data } : (data as ColorRecord);
    set((state) => ({
      colors: state.colors.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));

    try {
      const editedMap = JSON.parse(localStorage.getItem('retailhub_edited_colors') || '{}');
      editedMap[id] = updated;
      localStorage.setItem('retailhub_edited_colors', JSON.stringify(editedMap));
    } catch (e) {}

    try {
      const payload = {
        colorCode: data.colorCode || original?.colorCode,
        colorName: data.colorName || original?.colorName,
        hexValue: data.hexCode || original?.hexCode,
        description: data.description !== undefined ? data.description : original?.description,
        isActive: data.status !== undefined ? (data.status === 'ACTIVE') : (original?.status === 'ACTIVE'),
      };
      await axiosClient.put(`/colors/${id}`, payload);
    } catch (err: any) {
      console.error('Failed to update color on API:', err);
    }
  },

  deleteColor: async (id) => {
    const target = get().colors.find((c) => c.id === id);
    try {
      await axiosClient.delete(`/colors/${id}`);
      set((state) => ({
        colors: state.colors.filter((c) => c.id !== id),
      }));

      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem('retailhub_deleted_colors') || '[]');
        if (!deletedIds.includes(String(id))) deletedIds.push(String(id));
        if (target?.colorCode && !deletedIds.includes(target.colorCode)) deletedIds.push(target.colorCode);
        localStorage.setItem('retailhub_deleted_colors', JSON.stringify(deletedIds));

        const editedMap = JSON.parse(localStorage.getItem('retailhub_edited_colors') || '{}');
        delete editedMap[id];
        if (target?.colorCode) delete editedMap[target.colorCode];
        localStorage.setItem('retailhub_edited_colors', JSON.stringify(editedMap));
      } catch (e) {}
    } catch (err: any) {
      console.error('Failed to delete color on API:', err);
      throw err;
    }
  },
}));
