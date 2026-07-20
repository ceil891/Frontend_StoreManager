import { create } from 'zustand';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';

export interface AreaItem {
  id: string;
  areaCode: string;
  name: string;
  level: 'TỈNH_THÀNH' | 'QUẬN_HUYỆN' | 'PHƯỜNG_XÃ';
  parentId: string | null;
  parentName?: string;
  status: 'KÍCH_HOẠT' | 'KHOÁ';
  createdAt: string;
  description?: string;
}

interface AreaState {
  areas: AreaItem[];
  isLoading: boolean;
  fetchAreas: () => Promise<void>;
  createArea: (data: Partial<AreaItem>) => Promise<void>;
  updateArea: (id: string, data: Partial<AreaItem>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
}

export const useAreaStore = create<AreaState>((set, get) => ({
  areas: [],
  isLoading: false,

  fetchAreas: async () => {
    set({ isLoading: true });
    try {
      const data = await axiosClient.get<any, unknown>('/partnerarea/areas?size=500');
      const list = extractPageContent<any>(data);
      set({ 
        areas: list.map((item: any) => ({
          id: String(item.id),
          areaCode: item.code || '',
          name: item.name || '',
          level: item.type === 'PROVINCE' ? 'TỈNH_THÀNH' : item.type === 'DISTRICT' ? 'QUẬN_HUYỆN' : 'PHƯỜNG_XÃ',
          parentId: item.parentId ? String(item.parentId) : null,
          parentName: item.parentName || undefined,
          status: item.isActive === false ? 'KHOÁ' : 'KÍCH_HOẠT',
          createdAt: item.createdAt || new Date().toISOString(),
          description: item.description || ''
        })),
        isLoading: false 
      });
    } catch (err) {
      console.error('Failed to fetch areas', err);
      set({ isLoading: false });
    }
  },

  createArea: async (data) => {
    try {
      const payload = {
        code: data.areaCode,
        name: data.name,
        type: data.level === 'TỈNH_THÀNH' ? 'PROVINCE' : data.level === 'QUẬN_HUYỆN' ? 'DISTRICT' : 'WARD',
        parentId: data.parentId ? Number(data.parentId) : null,
        description: data.description,
        isActive: data.status === 'KÍCH_HOẠT'
      };
      await axiosClient.post('/partnerarea/areas', payload);
      await get().fetchAreas();
    } catch (err) {
      console.error('Failed to create area', err);
    }
  },

  updateArea: async (id, data) => {
    try {
      const payload = {
        code: data.areaCode,
        name: data.name,
        type: data.level === 'TỈNH_THÀNH' ? 'PROVINCE' : data.level === 'QUẬN_HUYỆN' ? 'DISTRICT' : 'WARD',
        parentId: data.parentId ? Number(data.parentId) : null,
        description: data.description,
        isActive: data.status === 'KÍCH_HOẠT'
      };
      await axiosClient.put(`/partnerarea/areas/${id}`, payload);
      await get().fetchAreas();
    } catch (err) {
      console.error('Failed to update area', err);
    }
  },

  deleteArea: async (id) => {
    try {
      await axiosClient.delete(`/partnerarea/areas/${id}`);
      await get().fetchAreas();
    } catch (err) {
      console.error('Failed to delete area', err);
    }
  },

  toggleStatus: async (id) => {
    try {
      await axiosClient.patch(`/partnerarea/areas/${id}/status`);
      await get().fetchAreas();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  }
}));
