import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  order: number;
}

interface BannerState {
  banners: Banner[];
  fetchBanners: () => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, data: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<void>;
  reorderBanners: (startIndex: number, endIndex: number) => void;
}



export const useBannerStore = create<BannerState>()(
  persist(
    (set, get) => ({
      banners: [],

      fetchBanners: async () => {
        try {
          const res = await axiosClient.get<any, any>('/banners');
          const data = res.data || res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ banners: data.map((item: any) => ({
              id: String(item.id),
              title: item.title || '',
              imageUrl: item.imageUrl || '',
              linkUrl: item.linkUrl || '',
              isActive: Boolean(item.isActive !== false),
              validFrom: item.validFrom ? String(item.validFrom).split('T')[0] : '',
              validUntil: item.validUntil ? String(item.validUntil).split('T')[0] : '',
              order: Number(item.sortOrder || item.orderIndex || item.order || 0),
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch banners:', e);
        }
      },

      addBanner: async (banner) => {
        try {
          const payload = {
            title: banner.title,
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl,
            isActive: banner.isActive,
            validFrom: banner.validFrom ? `${banner.validFrom}T00:00:00` : null,
            validUntil: banner.validUntil ? `${banner.validUntil}T23:59:59` : null,
            sortOrder: banner.order || 0
          };
          const res = await axiosClient.post<any, any>('/banners', payload);
          const newId = String(res?.id || Date.now());
          set((state) => ({
            banners: [...state.banners, { ...banner, id: newId }].sort((a, b) => a.order - b.order)
          }));
        } catch (e) {
          console.error('Failed to add banner:', e);
          set((state) => ({
            banners: [...state.banners, { id: Date.now().toString(), ...banner }].sort((a, b) => a.order - b.order)
          }));
        }
      },

      updateBanner: async (id, data) => {
        try {
          const payload: any = { ...data };
          if (data.order !== undefined) payload.sortOrder = data.order;
          if (data.validFrom) payload.validFrom = data.validFrom.includes('T') ? data.validFrom : `${data.validFrom}T00:00:00`;
          if (data.validUntil) payload.validUntil = data.validUntil.includes('T') ? data.validUntil : `${data.validUntil}T23:59:59`;
          await axiosClient.put(`/banners/${id}`, payload);
        } catch (e) {
          console.error('Failed to update banner:', e);
        }
        set((state) => ({
          banners: state.banners.map((b) => b.id === id ? { ...b, ...data } : b)
        }));
      },

      deleteBanner: async (id) => {
        try {
          await axiosClient.delete(`/banners/${id}`);
        } catch (e) {
          console.error('Failed to delete banner:', e);
        }
        set((state) => ({
          banners: state.banners.filter((b) => b.id !== id)
        }));
      },

      toggleBannerStatus: async (id) => {
        const item = get().banners.find(b => b.id === id);
        if (item) {
          const newStatus = !item.isActive;
          try {
            await axiosClient.patch(`/banners/${id}/status?isActive=${newStatus}`);
          } catch (e) {
            try {
              await axiosClient.put(`/banners/${id}`, { isActive: newStatus });
            } catch (err) {
              console.error('Failed to toggle banner status:', err);
            }
          }
          set((state) => ({
            banners: state.banners.map((b) => b.id === id ? { ...b, isActive: newStatus } : b)
          }));
        }
      },
      reorderBanners: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.banners);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        // Update order property
        const reordered = result.map((item, index) => ({ ...item, order: index + 1 }));
        return { banners: reordered };
      })
    }),
    {
      name: 'retailhub-banner-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
