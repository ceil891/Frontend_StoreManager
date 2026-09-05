import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

const DEFAULT_AREAS: AreaItem[] = [
  { id: '1', areaCode: 'AREA-HN', name: 'TP. Hà Nội', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Trụ sở chính Miền Bắc' },
  { id: '2', areaCode: 'AREA-HCM', name: 'TP. Hồ Chí Minh', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Trụ sở chính Miền Nam' },
  { id: '3', areaCode: 'AREA-DN', name: 'TP. Đà Nẵng', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Khu vực Miền Trung' },
  { id: '4', areaCode: 'AREA-HP', name: 'TP. Hải Phòng', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Khu vực Duyên hải Miền Bắc' },
  { id: '5', areaCode: 'AREA-CT', name: 'TP. Cần Thơ', level: 'TỈNH_THÀNH', parentId: null, status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Khu vực Tây Nam Bộ' },
  { id: '6', areaCode: 'AREA-HK', name: 'Quận Hoàn Kiếm', level: 'QUẬN_HUYỆN', parentId: '1', parentName: 'TP. Hà Nội', status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Quận trung tâm Hà Nội' },
  { id: '7', areaCode: 'AREA-Q1', name: 'Quận 1', level: 'QUẬN_HUYỆN', parentId: '2', parentName: 'TP. Hồ Chí Minh', status: 'KÍCH_HOẠT', createdAt: '2026-01-01', description: 'Quận trung tâm TP.HCM' },
];

export const useAreaStore = create<AreaState>()(
  persist(
    (set, get) => ({
      areas: DEFAULT_AREAS,
      isLoading: false,

      fetchAreas: async () => {
        set({ isLoading: true });
        try {
          const data = await axiosClient.get<any, unknown>('/partnerarea/areas?size=500');
          const list = extractPageContent<any>(data);
          if (Array.isArray(list)) {
            const mapped = list.map((item: any) => ({
              id: String(item.id),
              areaCode: item.code || `AREA-${item.id}`,
              name: item.name || '',
              level: (item.type === 'PROVINCE' ? 'TỈNH_THÀNH' : item.type === 'DISTRICT' ? 'QUẬN_HUYỆN' : 'PHƯỜNG_XÃ') as any,
              parentId: item.parentId ? String(item.parentId) : null,
              parentName: item.parentName || undefined,
              status: (item.isActive === false ? 'KHOÁ' : 'KÍCH_HOẠT') as any,
              createdAt: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              description: item.description || ''
            }));
            set({ areas: mapped.length > 0 ? mapped : (get().areas.length > 0 ? get().areas : DEFAULT_AREAS), isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          console.error('Failed to fetch areas from API, keeping current state', err);
          set({ isLoading: false });
        }
      },

      createArea: async (data) => {
        const payload = {
          code: data.areaCode,
          name: data.name,
          type: data.level === 'TỈNH_THÀNH' ? 'PROVINCE' : data.level === 'QUẬN_HUYỆN' ? 'DISTRICT' : 'WARD',
          parentId: data.parentId ? Number(data.parentId) : null,
          description: data.description,
          isActive: data.status === 'KÍCH_HOẠT'
        };
        try {
          await axiosClient.post('/partnerarea/areas', payload);
          await get().fetchAreas();
        } catch (err) {
          console.error('Failed to create area on API', err);
          // Fallback local save if offline
          const tempId = String(Date.now());
          const newRecord: AreaItem = {
            id: tempId,
            areaCode: data.areaCode || `AREA-${tempId.slice(-4)}`,
            name: data.name || '',
            level: data.level || 'TỈNH_THÀNH',
            parentId: data.parentId || null,
            parentName: data.parentName || undefined,
            status: data.status || 'KÍCH_HOẠT',
            createdAt: new Date().toISOString().split('T')[0],
            description: data.description || '',
          };
          set((state) => ({ areas: [newRecord, ...state.areas] }));
          throw err;
        }
      },

      updateArea: async (id, data) => {
        const payload = {
          code: data.areaCode,
          name: data.name,
          type: data.level === 'TỈNH_THÀNH' ? 'PROVINCE' : data.level === 'QUẬN_HUYỆN' ? 'DISTRICT' : 'WARD',
          parentId: data.parentId ? Number(data.parentId) : null,
          description: data.description,
          isActive: data.status === 'KÍCH_HOẠT'
        };
        try {
          await axiosClient.put(`/partnerarea/areas/${id}`, payload);
          set((state) => ({
            areas: state.areas.map((a) => (a.id === id ? { ...a, ...data } : a)),
          }));
        } catch (err) {
          console.error('Failed to update area on API', err);
          throw err;
        }
      },

      deleteArea: async (id) => {
        try {
          await axiosClient.delete(`/partnerarea/areas/${id}`);
          set((state) => ({
            areas: state.areas.filter((a) => a.id !== id),
          }));
        } catch (err) {
          console.error('Failed to delete area on API', err);
          throw err;
        }
      },

      toggleStatus: async (id) => {
        try {
          await axiosClient.patch(`/partnerarea/areas/${id}/status`);
          set((state) => ({
            areas: state.areas.map((a) => (a.id === id ? { ...a, status: a.status === 'KÍCH_HOẠT' ? 'KHOÁ' : 'KÍCH_HOẠT' } : a)),
          }));
        } catch (err) {
          console.error('Failed to toggle area status on API', err);
          throw err;
        }
      },
    }),
    { name: 'retailhub-areas-storage' }
  )
);
